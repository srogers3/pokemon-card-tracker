import { db } from "@/db";
import {
  pokemonEggs,
  reporterBadges,
  badgeTypeEnum,
} from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { POKEMON_DATA } from "@/db/pokemon-data";
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

export async function createEgg(
  userId: string,
  sightingId: string,
  reportStatus: "found" | "not_found"
): Promise<string> {
  const [egg] = await db
    .insert(pokemonEggs)
    .values({
      userId,
      sightingId,
      reportStatus,
    })
    .returning();

  return egg.id;
}

export async function hatchEgg(
  sightingId: string,
  corroborated: boolean = false
): Promise<{ pokemonName: string; isShiny: boolean } | null> {
  // Find the egg for this sighting
  const [egg] = await db
    .select()
    .from(pokemonEggs)
    .where(
      and(
        eq(pokemonEggs.sightingId, sightingId),
        eq(pokemonEggs.hatched, false)
      )
    )
    .limit(1);

  if (!egg) return null;

  // Determine rarity pool
  let poolKey = egg.reportStatus as string;
  if (poolKey === "found" && corroborated) {
    poolKey = "found_corroborated";
  }
  const weights = RARITY_WEIGHTS[poolKey] ?? RARITY_WEIGHTS["not_found"];

  // Roll rarity tier
  const tier = rollRarity(weights);

  // Pick random Pokemon from that tier
  const pokemonInTier = POKEMON_DATA.filter((p) => p.rarityTier === tier);
  const pokemon =
    pokemonInTier[Math.floor(Math.random() * pokemonInTier.length)];

  // Roll shiny
  const isShiny = Math.random() < SHINY_CHANCE;

  // Update the egg
  await db
    .update(pokemonEggs)
    .set({
      hatched: true,
      pokemonId: pokemon.id,
      isShiny,
      hatchedAt: new Date(),
    })
    .where(eq(pokemonEggs.id, egg.id));

  // Check for pokedex badges
  await checkPokedexBadges(egg.userId);

  return { pokemonName: pokemon.name, isShiny };
}

export async function transferPokemon(
  userId: string,
  eggId: string
): Promise<{ points: number } | { error: string }> {
  // Get the egg details
  const [egg] = await db
    .select({
      id: pokemonEggs.id,
      userId: pokemonEggs.userId,
      pokemonId: pokemonEggs.pokemonId,
      isShiny: pokemonEggs.isShiny,
      hatched: pokemonEggs.hatched,
    })
    .from(pokemonEggs)
    .where(eq(pokemonEggs.id, eggId))
    .limit(1);

  if (!egg || !egg.hatched || !egg.pokemonId) {
    return { error: "Egg not found or not hatched" };
  }

  if (egg.userId !== userId) {
    return { error: "Not your Pokemon" };
  }

  // Check if this is the user's last copy (shiny and non-shiny are separate)
  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(pokemonEggs)
    .where(
      and(
        eq(pokemonEggs.userId, userId),
        eq(pokemonEggs.pokemonId, egg.pokemonId),
        eq(pokemonEggs.isShiny, egg.isShiny),
        eq(pokemonEggs.hatched, true)
      )
    );

  if ((countResult?.count ?? 0) <= 1) {
    return { error: "Cannot transfer your last copy" };
  }

  // Get rarity for point calculation
  const pokemonEntry = POKEMON_DATA.find((p) => p.id === egg.pokemonId);
  if (!pokemonEntry) return { error: "Pokemon not found in catalog" };

  const basePoints = TRANSFER_POINTS[pokemonEntry.rarityTier];
  const points = egg.isShiny ? basePoints * 2 : basePoints;

  // Delete the egg and award points
  await db.delete(pokemonEggs).where(eq(pokemonEggs.id, eggId));
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

async function checkPokedexBadges(userId: string): Promise<void> {
  // Count unique Pokemon caught
  const [result] = await db
    .select({
      uniqueCaught: sql<number>`COUNT(DISTINCT pokemon_id)::int`,
    })
    .from(pokemonEggs)
    .where(
      and(eq(pokemonEggs.userId, userId), eq(pokemonEggs.hatched, true))
    );

  const uniqueCaught = result?.uniqueCaught ?? 0;

  const existingBadges = await db
    .select({ badgeType: reporterBadges.badgeType })
    .from(reporterBadges)
    .where(eq(reporterBadges.userId, userId));

  const earned = new Set(existingBadges.map((b) => b.badgeType));

  const toAward: BadgeType[] = [];

  if (uniqueCaught >= 50 && !earned.has("pokedex_50")) {
    toAward.push("pokedex_50");
  }
  if (uniqueCaught >= 151 && !earned.has("pokedex_complete")) {
    toAward.push("pokedex_complete");
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
  const eggs = await db
    .select({
      id: pokemonEggs.id,
      pokemonId: pokemonEggs.pokemonId,
      isShiny: pokemonEggs.isShiny,
      hatched: pokemonEggs.hatched,
      hatchedAt: pokemonEggs.hatchedAt,
      reportStatus: pokemonEggs.reportStatus,
      createdAt: pokemonEggs.createdAt,
    })
    .from(pokemonEggs)
    .where(eq(pokemonEggs.userId, userId));

  return eggs;
}

export function getPokedexCompletion(
  hatchedEggs: { pokemonId: number | null }[]
): number {
  const uniquePokemon = new Set(
    hatchedEggs
      .filter((e) => e.pokemonId !== null)
      .map((e) => e.pokemonId)
  );
  return uniquePokemon.size;
}
