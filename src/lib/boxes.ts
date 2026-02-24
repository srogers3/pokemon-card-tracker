import { db } from "@/db";
import {
  creatureBoxes,
  reporterBadges,
  badgeTypeEnum,
} from "@/db/schema";
import { eq, and, sql, isNotNull, isNull } from "drizzle-orm";
import { CREATURE_DATA, getSpriteUrl } from "@/db/creature-data";
import { adjustTrustScore } from "@/lib/trust";

type RarityTier = "common" | "uncommon" | "rare" | "ultra_rare";
type BadgeType = (typeof badgeTypeEnum.enumValues)[number];

// Rarity pools by report status
const RARITY_WEIGHTS: Record<string, Record<RarityTier, number>> = {
  not_found: { common: 75, uncommon: 25, rare: 0, ultra_rare: 0 },
  found: { common: 35, uncommon: 35, rare: 25, ultra_rare: 5 },
  found_corroborated: { common: 25, uncommon: 30, rare: 30, ultra_rare: 15 },
};

const TRANSFER_POINTS: Record<RarityTier, number> = {
  common: 1,
  uncommon: 2,
  rare: 3,
  ultra_rare: 5,
};

const SHINY_CHANCE = 1 / 50; // 2%

// Upgrade chance by report status
const UPGRADE_CHANCE: Record<string, number> = {
  not_found: 0.05,
  found: 0.20,
  found_corroborated: 0.35,
};

// When upgrade triggers, relative weight for each tier above wild creature's tier
const UPGRADE_TIER_WEIGHTS: Record<RarityTier, number> = {
  common: 0,
  uncommon: 60,
  rare: 30,
  ultra_rare: 10,
};

const TIER_ORDER: RarityTier[] = ["common", "uncommon", "rare", "ultra_rare"];

export async function createBox(
  userId: string,
  sightingId: string,
  reportStatus: "found" | "not_found",
  wildCreatureId?: number
): Promise<string> {
  const [box] = await db
    .insert(creatureBoxes)
    .values({
      userId,
      sightingId,
      reportStatus,
      wildCreatureId,
    })
    .returning();

  return box.id;
}

export async function openBox(
  sightingId: string,
  corroborated: boolean = false
): Promise<{ creatureName: string; isShiny: boolean; wasUpgrade: boolean; wildCreatureName: string | null } | null> {
  const [box] = await db
    .select()
    .from(creatureBoxes)
    .where(
      and(
        eq(creatureBoxes.sightingId, sightingId),
        eq(creatureBoxes.opened, false)
      )
    )
    .limit(1);

  if (!box) return null;

  let creature: { id: number; name: string; rarityTier: RarityTier };
  let wasUpgrade = false;
  let wildCreatureName: string | null = null;

  if (box.wildCreatureId) {
    // New behavior: base + upgrade
    const wildCreature = CREATURE_DATA.find((p) => p.id === box.wildCreatureId);
    if (!wildCreature) {
      creature = rollRandomCreature(box.reportStatus as string, corroborated);
    } else {
      wildCreatureName = wildCreature.name;

      let poolKey = box.reportStatus as string;
      if (poolKey === "found" && corroborated) {
        poolKey = "found_corroborated";
      }
      const upgradeChance = UPGRADE_CHANCE[poolKey] ?? UPGRADE_CHANCE["not_found"];

      if (Math.random() < upgradeChance) {
        const wildTierIndex = TIER_ORDER.indexOf(wildCreature.rarityTier);
        const eligibleTiers = TIER_ORDER.slice(wildTierIndex + 1);
        if (eligibleTiers.length > 0) {
          const tier = rollUpgradeTier(eligibleTiers);
          const tierCreatures = CREATURE_DATA.filter((p) => p.rarityTier === tier);
          creature = tierCreatures[Math.floor(Math.random() * tierCreatures.length)];
          wasUpgrade = true;
        } else {
          creature = wildCreature;
        }
      } else {
        creature = wildCreature;
      }
    }
  } else {
    // Legacy behavior for boxes without wildCreatureId
    creature = rollRandomCreature(box.reportStatus as string, corroborated);
  }

  const isShiny = Math.random() < SHINY_CHANCE;

  await db
    .update(creatureBoxes)
    .set({
      opened: true,
      creatureId: creature.id,
      isShiny,
      openedAt: new Date(),
    })
    .where(eq(creatureBoxes.id, box.id));

  await checkCardboardexBadges(box.userId);

  return { creatureName: creature.name, isShiny, wasUpgrade, wildCreatureName };
}

function rollUpgradeTier(eligibleTiers: RarityTier[]): RarityTier {
  const weights = eligibleTiers.map((tier) => ({
    tier,
    weight: UPGRADE_TIER_WEIGHTS[tier],
  }));
  const total = weights.reduce((sum, w) => sum + w.weight, 0);
  let roll = Math.random() * total;

  for (const { tier, weight } of weights) {
    roll -= weight;
    if (roll <= 0) return tier;
  }

  return eligibleTiers[eligibleTiers.length - 1];
}

function rollRandomCreature(
  reportStatus: string,
  corroborated: boolean
): { id: number; name: string; rarityTier: RarityTier } {
  let poolKey = reportStatus;
  if (poolKey === "found" && corroborated) {
    poolKey = "found_corroborated";
  }
  const weights = RARITY_WEIGHTS[poolKey] ?? RARITY_WEIGHTS["not_found"];
  const tier = rollRarity(weights);
  const creaturesInTier = CREATURE_DATA.filter((p) => p.rarityTier === tier);
  return creaturesInTier[Math.floor(Math.random() * creaturesInTier.length)];
}

export async function transferCreature(
  userId: string,
  boxId: string
): Promise<{ points: number } | { error: string }> {
  // Get the box details
  const [box] = await db
    .select({
      id: creatureBoxes.id,
      userId: creatureBoxes.userId,
      creatureId: creatureBoxes.creatureId,
      isShiny: creatureBoxes.isShiny,
      opened: creatureBoxes.opened,
    })
    .from(creatureBoxes)
    .where(eq(creatureBoxes.id, boxId))
    .limit(1);

  if (!box || !box.opened || !box.creatureId) {
    return { error: "Box not found or not opened" };
  }

  if (box.userId !== userId) {
    return { error: "Not your creature" };
  }

  // Check if this is the user's last copy (shiny and non-shiny are separate)
  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(creatureBoxes)
    .where(
      and(
        eq(creatureBoxes.userId, userId),
        eq(creatureBoxes.creatureId, box.creatureId),
        eq(creatureBoxes.isShiny, box.isShiny),
        eq(creatureBoxes.opened, true)
      )
    );

  if ((countResult?.count ?? 0) <= 1) {
    return { error: "Cannot transfer your last copy" };
  }

  // Get rarity for point calculation
  const creatureEntry = CREATURE_DATA.find((p) => p.id === box.creatureId);
  if (!creatureEntry) return { error: "Creature not found in catalog" };

  const basePoints = TRANSFER_POINTS[creatureEntry.rarityTier];
  const points = box.isShiny ? basePoints * 2 : basePoints;

  // Delete the box and award points
  await db.delete(creatureBoxes).where(eq(creatureBoxes.id, boxId));
  await adjustTrustScore(userId, points);

  return { points };
}

function rollRarity(weights: Record<RarityTier, number>): RarityTier {
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  let roll = Math.random() * total;

  for (const [tier, weight] of Object.entries(weights)) {
    roll -= weight;
    if (roll <= 0) return tier as RarityTier;
  }

  return "common";
}

async function checkCardboardexBadges(userId: string): Promise<void> {
  // Count unique creatures caught
  const [result] = await db
    .select({
      uniqueCaught: sql<number>`COUNT(DISTINCT creature_id)::int`,
    })
    .from(creatureBoxes)
    .where(
      and(eq(creatureBoxes.userId, userId), eq(creatureBoxes.opened, true))
    );

  const uniqueCaught = result?.uniqueCaught ?? 0;

  const existingBadges = await db
    .select({ badgeType: reporterBadges.badgeType })
    .from(reporterBadges)
    .where(eq(reporterBadges.userId, userId));

  const earned = new Set(existingBadges.map((b) => b.badgeType));

  const toAward: BadgeType[] = [];

  if (uniqueCaught >= 50 && !earned.has("cardboardex_50")) {
    toAward.push("cardboardex_50");
  }
  if (uniqueCaught >= 151 && !earned.has("cardboardex_complete")) {
    toAward.push("cardboardex_complete");
  }

  if (toAward.length > 0) {
    await db.insert(reporterBadges).values(
      toAward.map((badge) => ({
        userId,
        badgeType: badge,
      }))
    );
  }
}

export async function getUserCollection(userId: string) {
  const boxes = await db
    .select({
      id: creatureBoxes.id,
      creatureId: creatureBoxes.creatureId,
      wildCreatureId: creatureBoxes.wildCreatureId,
      isShiny: creatureBoxes.isShiny,
      opened: creatureBoxes.opened,
      openedAt: creatureBoxes.openedAt,
      reportStatus: creatureBoxes.reportStatus,
      createdAt: creatureBoxes.createdAt,
    })
    .from(creatureBoxes)
    .where(eq(creatureBoxes.userId, userId));

  return boxes;
}

export function getCardboardexCompletion(
  openedBoxes: { creatureId: number | null }[]
): number {
  const uniqueCreatures = new Set(
    openedBoxes
      .filter((e) => e.creatureId !== null)
      .map((e) => e.creatureId)
  );
  return uniqueCreatures.size;
}

export async function getUnviewedOpenings(userId: string) {
  const boxes = await db
    .select({
      id: creatureBoxes.id,
      creatureId: creatureBoxes.creatureId,
      wildCreatureId: creatureBoxes.wildCreatureId,
      isShiny: creatureBoxes.isShiny,
      openedAt: creatureBoxes.openedAt,
    })
    .from(creatureBoxes)
    .where(
      and(
        eq(creatureBoxes.userId, userId),
        eq(creatureBoxes.opened, true),
        isNotNull(creatureBoxes.creatureId),
        isNull(creatureBoxes.viewedAt)
      )
    )
    .orderBy(creatureBoxes.openedAt);

  return boxes.map((box) => {
    const creature = CREATURE_DATA.find((p) => p.id === box.creatureId);
    const wildCreature = box.wildCreatureId
      ? CREATURE_DATA.find((p) => p.id === box.wildCreatureId)
      : null;

    return {
      id: box.id,
      creatureName: creature?.name ?? "Unknown",
      creatureId: box.creatureId!,
      rarityTier: creature?.rarityTier ?? "common",
      spriteUrl: getSpriteUrl(box.creatureId!),
      isShiny: box.isShiny,
      wasUpgrade: !!(box.wildCreatureId && box.creatureId !== box.wildCreatureId),
      wildCreatureName: wildCreature?.name ?? null,
    };
  });
}

export async function markBoxViewed(userId: string, boxId: string) {
  await db
    .update(creatureBoxes)
    .set({ viewedAt: new Date() })
    .where(and(eq(creatureBoxes.id, boxId), eq(creatureBoxes.userId, userId)));
}
