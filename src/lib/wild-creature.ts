import { CREATURE_DATA, MAX_SPRITE_ID, getSpriteUrl } from "@/db/creature-data";

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

  // Only pick from creatures with finished sprites
  const spriteReady = CREATURE_DATA.filter((c) => c.id <= MAX_SPRITE_ID);
  let pool = spriteReady.filter((c) => c.rarityTier === selectedTier);

  // If no sprite-ready creatures in this tier, fall back to nearest available tier
  if (pool.length === 0) {
    const tierOrder = ["common", "uncommon", "rare", "ultra_rare"];
    const selectedIdx = tierOrder.indexOf(selectedTier);
    // Try adjacent tiers, closest first
    for (let offset = 1; offset < tierOrder.length; offset++) {
      for (const dir of [-1, 1]) {
        const tryIdx = selectedIdx + offset * dir;
        if (tryIdx >= 0 && tryIdx < tierOrder.length) {
          pool = spriteReady.filter((c) => c.rarityTier === tierOrder[tryIdx]);
          if (pool.length > 0) break;
        }
      }
      if (pool.length > 0) break;
    }
    // Final fallback: all sprite-ready creatures
    if (pool.length === 0) pool = spriteReady;
  }

  const idx = simpleHash(seed + "pick") % pool.length;
  const creature = pool[idx];
  // Return the creature's intrinsic rarity, not the rolled tier
  return { id: creature.id, name: creature.name, spriteUrl: getSpriteUrl(creature.id), rarity: creature.rarityTier };
}
