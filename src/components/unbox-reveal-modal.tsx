"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { markBoxesViewedAction } from "@/app/dashboard/actions";

export type UnboxData = {
  id: string;
  creatureName: string;
  creatureId: number;
  rarityTier: "common" | "uncommon" | "rare" | "ultra_rare";
  spriteUrl: string;
  isShiny: boolean;
  wasUpgrade: boolean;
  wildCreatureName: string | null;
};

type AnimStage = "idle" | "wobble1" | "wobble2" | "wobble3" | "crack" | "reveal" | "done";

const RARITY_GLOW: Record<string, string> = {
  common: "rgba(255, 255, 255, 0.6)",
  uncommon: "rgba(45, 212, 191, 0.6)",
  rare: "rgba(245, 158, 11, 0.6)",
  ultra_rare: "",
};

const RARITY_LABEL: Record<string, string> = {
  common: "Common",
  uncommon: "Uncommon",
  rare: "Rare",
  ultra_rare: "Ultra Rare",
};

const RARITY_LABEL_COLOR: Record<string, string> = {
  common: "text-gray-400",
  uncommon: "text-teal-400",
  rare: "text-amber-400",
  ultra_rare: "text-purple-400",
};

export function UnboxRevealModal({ openings, onComplete }: { openings: UnboxData[]; onComplete?: () => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [stage, setStage] = useState<AnimStage>("idle");
  const [open, setOpen] = useState(true);
  const markedViewedRef = useRef(false);

  const current = openings[currentIndex];

  // Mark ALL boxes as viewed immediately on mount to prevent the layout modal
  // from showing the same boxes (double-up bug)
  useEffect(() => {
    if (markedViewedRef.current || openings.length === 0) return;
    markedViewedRef.current = true;

    const boxIds = openings.map((o) => o.id);
    markBoxesViewedAction(boxIds).catch(() => {
      // If this fails, user may see boxes again on next page load — acceptable
    });
  }, [openings]);

  // Auto-advance through animation stages
  useEffect(() => {
    if (!open || !current) return;

    // Start animation on mount / index change
    setStage("wobble1"); // eslint-disable-line react-hooks/set-state-in-effect -- animation sequencing

    const timers: NodeJS.Timeout[] = [];
    timers.push(setTimeout(() => setStage("wobble2"), 700));
    timers.push(setTimeout(() => setStage("wobble3"), 1400));
    timers.push(setTimeout(() => setStage("crack"), 2100));
    timers.push(setTimeout(() => setStage("reveal"), 2600));
    timers.push(setTimeout(() => setStage("done"), 3200));

    return () => timers.forEach(clearTimeout);
  }, [currentIndex, open, current]);

  const handleContinue = useCallback(async () => {
    if (stage !== "done") return;

    if (currentIndex < openings.length - 1) {
      setStage("idle");
      setCurrentIndex((i) => i + 1);
    } else {
      setOpen(false);
      onComplete?.();
    }
  }, [stage, currentIndex, openings.length, onComplete]);

  if (!open || !current) return null;

  const isUltraRare = current.rarityTier === "ultra_rare";
  const glowColor = RARITY_GLOW[current.rarityTier];
  const showCreature = stage === "reveal" || stage === "done";
  const showBox = stage !== "reveal" && stage !== "done";
  const isCracking = stage === "crack";

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 animate-in fade-in duration-300"
        onClick={handleContinue}
      />

      {/* Modal content */}
      <div
        className="relative z-10 w-full max-w-sm mx-auto mb-0 flex flex-col items-center pb-12 pt-8"
        style={{ animation: "slide-up 300ms ease-out" }}
      >
        {/* Box counter */}
        {openings.length > 1 && (
          <div className="text-white/60 text-sm mb-4">
            Box {currentIndex + 1} of {openings.length}
          </div>
        )}

        {/* Box / Creature container */}
        <div className="relative w-48 h-48 flex items-center justify-center">
          {/* Glow burst behind creature on reveal */}
          {isCracking && (
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: isUltraRare
                  ? "conic-gradient(from var(--rainbow-angle, 0deg), #ff0000, #ff8000, #ffff00, #00ff00, #0080ff, #8000ff, #ff0000)"
                  : `radial-gradient(circle, ${glowColor}, transparent 70%)`,
                animation: isUltraRare
                  ? "glow-burst 600ms ease-out forwards, rainbow-spin 2s linear infinite"
                  : "glow-burst 600ms ease-out forwards",
              }}
            />
          )}

          {showCreature && (
            <div
              className="absolute inset-0 rounded-full opacity-50"
              style={{
                background: isUltraRare
                  ? "conic-gradient(from var(--rainbow-angle, 0deg), #ff0000, #ff8000, #ffff00, #00ff00, #0080ff, #8000ff, #ff0000)"
                  : `radial-gradient(circle, ${glowColor}, transparent 70%)`,
                animation: isUltraRare ? "rainbow-spin 2s linear infinite" : undefined,
              }}
            />
          )}

          {/* Box — key forces remount so CSS animation re-triggers each stage */}
          {showBox && (
            <div
              key={stage}
              className="text-8xl select-none"
              style={{
                animation:
                  stage === "wobble1"
                    ? "egg-wobble-mild 700ms ease-in-out"
                    : stage === "wobble2"
                      ? "egg-wobble 700ms ease-in-out"
                      : stage === "wobble3"
                        ? "egg-wobble-intense 700ms ease-in-out"
                        : stage === "crack"
                          ? "egg-crack 500ms ease-out forwards"
                          : undefined,
              }}
            >
              📦
            </div>
          )}

          {/* Creature sprite */}
          {showCreature && (
            <div className="relative">
              {current.isShiny && <div className="absolute inset-0 shimmer rounded-full" />}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={current.spriteUrl}
                alt={current.creatureName}
                className="w-32 h-32 relative z-10 pixelated"
                style={{
                  animation: "creature-reveal 600ms ease-out",
                  imageRendering: "pixelated",
                }}
              />
            </div>
          )}
        </div>

        {/* Creature info */}
        {showCreature && (
          <div className="text-center mt-4 animate-in fade-in duration-500">
            <div className="flex items-center justify-center gap-2">
              <h3 className="text-2xl font-bold text-white">
                {current.creatureName}
              </h3>
              {current.isShiny && <span className="text-xl">✨</span>}
            </div>
            <p className={`text-sm font-medium mt-1 ${RARITY_LABEL_COLOR[current.rarityTier]}`}>
              {RARITY_LABEL[current.rarityTier]}
            </p>

            {/* Upgrade flair */}
            {current.wasUpgrade && current.wildCreatureName && (
              <div
                className="mt-3 inline-block bg-amber-500/20 border border-amber-400/50 rounded-full px-4 py-1"
                style={{ animation: "lucky-banner 500ms ease-out" }}
              >
                <span className="text-amber-300 font-semibold text-sm">
                  Lucky! <span className="text-white/80 font-normal">instead of {current.wildCreatureName}</span>
                </span>
              </div>
            )}
          </div>
        )}

        {/* Continue prompt — always rendered to reserve space, visible only when done */}
        <button
          onClick={handleContinue}
          className={`mt-8 text-sm transition-all ${stage === "done" ? "text-white/60 animate-pulse hover:text-white/90" : "text-transparent pointer-events-none"}`}
        >
          {currentIndex < openings.length - 1 ? "Tap to continue" : "Tap to close"}
        </button>
      </div>
    </div>
  );
}
