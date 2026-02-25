import { CREATURE_DATA, getSpriteUrl } from "@/db/creature-data";

const RARITY_WEIGHTS = [
  { tier: "common", weight: 0.60 },
  { tier: "uncommon", weight: 0.25 },
  { tier: "rare", weight: 0.12 },
  { tier: "ultra_rare", weight: 0.03 },
] as const;

export function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getWildCreature(storeId: string): { id: number; name: string; spriteUrl: string; rarity: string } {
  const today = new Date().toISOString().split("T")[0];
  const seed = storeId + today;
  const hash = simpleHash(seed);
  const tierRand = (hash % 1000) / 1000;

  let selectedTier = "common";
  let cumulative = 0;
  for (const { tier, weight } of RARITY_WEIGHTS) {
    cumulative += weight;
    if (tierRand < cumulative) {
      selectedTier = tier;
      break;
    }
  }

  const tierCreatures = CREATURE_DATA.filter((c) => c.rarityTier === selectedTier);
  // Fall back to all creatures if selected tier has none (e.g. limited creature set)
  const pool = tierCreatures.length > 0 ? tierCreatures : CREATURE_DATA;
  const idx = simpleHash(seed + "pick") % pool.length;
  const creature = pool[idx];
  return { id: creature.id, name: creature.name, spriteUrl: getSpriteUrl(creature.id), rarity: selectedTier };
}
