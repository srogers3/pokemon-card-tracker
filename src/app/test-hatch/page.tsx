"use client";

import { useState } from "react";
import { UnboxRevealModal } from "@/components/unbox-reveal-modal";

const MOCK_OPENINGS = [
  { id: "1", creatureName: "Blisterfang", creatureId: 10, rarityTier: "common" as const, spriteUrl: "/sprites/10.svg", isShiny: false, wasUpgrade: false, wildCreatureName: null },
  { id: "2", creatureName: "FOMOgre", creatureId: 97, rarityTier: "uncommon" as const, spriteUrl: "/sprites/97.svg", isShiny: false, wasUpgrade: false, wildCreatureName: null },
  { id: "3", creatureName: "Forklord", creatureId: 142, rarityTier: "ultra_rare" as const, spriteUrl: "/sprites/142.svg", isShiny: true, wasUpgrade: false, wildCreatureName: null },
  { id: "4", creatureName: "Logistigon", creatureId: 151, rarityTier: "ultra_rare" as const, spriteUrl: "/sprites/151.svg", isShiny: false, wasUpgrade: true, wildCreatureName: "Stocklit" },
  { id: "5", creatureName: "Cartivore", creatureId: 15, rarityTier: "common" as const, spriteUrl: "/sprites/15.svg", isShiny: false, wasUpgrade: false, wildCreatureName: null },
  { id: "6", creatureName: "Dropocalypse", creatureId: 106, rarityTier: "ultra_rare" as const, spriteUrl: "/sprites/106.svg", isShiny: true, wasUpgrade: true, wildCreatureName: "Scalpizard" },
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
