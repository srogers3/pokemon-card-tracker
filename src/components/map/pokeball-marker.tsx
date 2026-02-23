"use client";

import { AdvancedMarker } from "@vis.gl/react-google-maps";
import { POKEMON_DATA, getSpriteUrl } from "@/db/pokemon-data";
import type { Store } from "@/db/schema";

const RARITY_WEIGHTS = [
  { tier: "common", weight: 0.60 },
  { tier: "uncommon", weight: 0.25 },
  { tier: "rare", weight: 0.12 },
  { tier: "ultra_rare", weight: 0.03 },
] as const;

const RARITY_BORDER_COLORS: Record<string, string> = {
  common: "#9CA3AF",
  uncommon: "#2DD4BF",
  rare: "#F59E0B",
  ultra_rare: "rainbow",
};

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getWildPokemon(storeId: string): { name: string; spriteUrl: string; rarity: string } {
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
  return { name: pokemon.name, spriteUrl: getSpriteUrl(pokemon.id), rarity: selectedTier };
}

export function PokeballMarker({
  store,
  onClick,
  isSelected,
}: {
  store: Store;
  onClick: () => void;
  isSelected: boolean;
}) {
  if (!store.latitude || !store.longitude) return null;

  const wild = getWildPokemon(store.id);
  const borderColor = RARITY_BORDER_COLORS[wild.rarity] ?? "#9CA3AF";
  const isRainbow = borderColor === "rainbow";

  // Deterministic animation delay so sprites don't bob in sync
  const animDelay = (simpleHash(store.id) % 3000) / 1000;
  const size = isSelected ? 64 : 48;
  const spriteSize = isSelected ? 44 : 32;

  return (
    <AdvancedMarker
      position={{ lat: store.latitude, lng: store.longitude }}
      onClick={onClick}
      title={`${store.name} — Wild ${wild.name}!`}
      zIndex={isSelected ? 999 : undefined}
    >
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          background: isRainbow
            ? "conic-gradient(from var(--rainbow-angle, 0deg), #ef4444, #f59e0b, #22c55e, #3b82f6, #a855f7, #ef4444)"
            : "transparent",
          padding: isRainbow ? 3 : 0,
          animation: `float 3s ease-in-out infinite, ${isRainbow ? "rainbow-spin 2s linear infinite" : "none"}`,
          animationDelay: `${animDelay}s`,
          transition: "width 200ms ease, height 200ms ease",
          cursor: "pointer",
          filter: isSelected ? "drop-shadow(0 0 8px rgba(0,0,0,0.3))" : "none",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            backgroundColor: "rgba(255, 255, 255, 0.6)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            border: isRainbow ? "none" : `3px solid ${borderColor}`,
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1), inset 0 1px 2px rgba(255, 255, 255, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={wild.spriteUrl}
            alt={wild.name}
            width={spriteSize}
            height={spriteSize}
            style={{
              imageRendering: "pixelated",
              transition: "width 200ms ease, height 200ms ease",
            }}
          />
        </div>
      </div>
    </AdvancedMarker>
  );
}
