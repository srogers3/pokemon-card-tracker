"use client";

import { useState } from "react";
import { UnboxRevealModal } from "@/components/unbox-reveal-modal";

const MOCK_OPENINGS = [
  {
    id: "test-common",
    creatureName: "Pidgey",
    creatureId: 16,
    rarityTier: "common" as const,
    spriteUrl: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/16.png",
    isShiny: false,
    wasUpgrade: false,
    wildCreatureName: null,
  },
  {
    id: "test-uncommon-upgrade",
    creatureName: "Pikachu",
    creatureId: 25,
    rarityTier: "uncommon" as const,
    spriteUrl: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png",
    isShiny: false,
    wasUpgrade: true,
    wildCreatureName: "Rattata",
  },
  {
    id: "test-rare-shiny",
    creatureName: "Charizard",
    creatureId: 6,
    rarityTier: "rare" as const,
    spriteUrl: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/6.png",
    isShiny: true,
    wasUpgrade: false,
    wildCreatureName: null,
  },
  {
    id: "test-ultra-rare",
    creatureName: "Mewtwo",
    creatureId: 150,
    rarityTier: "ultra_rare" as const,
    spriteUrl: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/150.png",
    isShiny: false,
    wasUpgrade: true,
    wildCreatureName: "Dragonite",
  },
];

export default function TestHatchPage() {
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState(MOCK_OPENINGS);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <h1 className="text-2xl font-bold mb-6">Unbox Animation Tester</h1>

      <div className="space-y-4 mb-8">
        <p className="text-gray-400 text-sm">Pick which boxes to test, then click Play.</p>

        {MOCK_OPENINGS.map((h) => (
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
              {h.creatureName} ({h.rarityTier})
              {h.isShiny && " ✨ Shiny"}
              {h.wasUpgrade && ` 🍀 Lucky (from ${h.wildCreatureName})`}
            </span>
          </label>
        ))}
      </div>

      <button
        onClick={() => setShowModal(true)}
        className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
      >
        Play Unbox Animation ({selected.length} boxes)
      </button>

      {showModal && selected.length > 0 && (
        <UnboxRevealModal
          key={Date.now()}
          openings={selected}
          onComplete={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
