import { POKEMON_DATA, getSpriteUrl } from "@/db/pokemon-data";

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

export function getWildPokemon(storeId: string): { id: number; name: string; spriteUrl: string; rarity: string } {
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

  const tierPokemon = POKEMON_DATA.filter((p) => p.rarityTier === selectedTier);
  const idx = simpleHash(seed + "pick") % tierPokemon.length;
  const pokemon = tierPokemon[idx];
  return { id: pokemon.id, name: pokemon.name, spriteUrl: getSpriteUrl(pokemon.id), rarity: selectedTier };
}
