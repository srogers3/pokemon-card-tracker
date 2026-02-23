"use client";

import { useState } from "react";
import { EggHatchModal } from "@/components/egg-hatch-modal";

const MOCK_HATCHES = [
  {
    id: "test-common",
    pokemonName: "Pidgey",
    pokemonId: 16,
    rarityTier: "common" as const,
    spriteUrl: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/16.png",
    isShiny: false,
    wasUpgrade: false,
    wildPokemonName: null,
  },
  {
    id: "test-uncommon-upgrade",
    pokemonName: "Pikachu",
    pokemonId: 25,
    rarityTier: "uncommon" as const,
    spriteUrl: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png",
    isShiny: false,
    wasUpgrade: true,
    wildPokemonName: "Rattata",
  },
  {
    id: "test-rare-shiny",
    pokemonName: "Charizard",
    pokemonId: 6,
    rarityTier: "rare" as const,
    spriteUrl: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/6.png",
    isShiny: true,
    wasUpgrade: false,
    wildPokemonName: null,
  },
  {
    id: "test-ultra-rare",
    pokemonName: "Mewtwo",
    pokemonId: 150,
    rarityTier: "ultra_rare" as const,
    spriteUrl: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/150.png",
    isShiny: false,
    wasUpgrade: true,
    wildPokemonName: "Dragonite",
  },
];

export default function TestHatchPage() {
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState(MOCK_HATCHES);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <h1 className="text-2xl font-bold mb-6">Egg Hatch Animation Tester</h1>

      <div className="space-y-4 mb-8">
        <p className="text-gray-400 text-sm">Pick which eggs to test, then click Play.</p>

        {MOCK_HATCHES.map((h) => (
          <label key={h.id} className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              defaultChecked
              onChange={(e) => {
                if (e.target.checked) {
                  setSelected((prev) => [...prev, h]);
                } else {
                  setSelected((prev) => prev.filter((p) => p.id !== h.id));
                }
              }}
              className="w-4 h-4"
            />
            <span>
              {h.pokemonName} ({h.rarityTier})
              {h.isShiny && " ✨ Shiny"}
              {h.wasUpgrade && ` 🍀 Lucky (from ${h.wildPokemonName})`}
            </span>
          </label>
        ))}
      </div>

      <button
        onClick={() => setShowModal(true)}
        className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
      >
        Play Hatch Animation ({selected.length} eggs)
      </button>

      {showModal && selected.length > 0 && (
        <EggHatchModal
          key={Date.now()}
          hatches={selected}
          onComplete={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
