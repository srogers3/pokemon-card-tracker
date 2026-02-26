"use client";

import { memo, useCallback, useState, useEffect } from "react";
import { AdvancedMarker } from "@vis.gl/react-google-maps";
import type { Store } from "@/db/schema";
import { getWildCreature, simpleHash, type StarTier } from "@/lib/wild-creature";

const RARITY_BORDER_COLORS: Record<string, string> = {
  common: "#9CA3AF",
  uncommon: "#2DD4BF",
  rare: "#F59E0B",
  ultra_rare: "rainbow",
};

const STAR_COLORS: Record<string, string> = {
  green: "#22C55E",
  yellow: "#EAB308",
  purple: "#A855F7",
};

const BOX_EMOJI_URL = "data:image/svg+xml," + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><text y="50" font-size="48">📦</text></svg>'
);

export const ClusterMarker = memo(function ClusterMarker({
  store,
  onClick,
  isSelected,
  hasSubmittedToday,
  justSubmitted,
  setMarkerRef,
  starTier,
}: {
  store: Store;
  onClick: (storeId: string) => void;
  isSelected: boolean;
  hasSubmittedToday: boolean;
  justSubmitted?: boolean;
  setMarkerRef?: (marker: google.maps.marker.AdvancedMarkerElement | null, id: string) => void;
  starTier: StarTier | null;
}) {
  const ref = useCallback(
    (marker: google.maps.marker.AdvancedMarkerElement | null) => {
      setMarkerRef?.(marker, store.id);
    },
    [setMarkerRef, store.id]
  );

  const handleClick = useCallback(() => onClick(store.id), [onClick, store.id]);

  const [animPhase, setAnimPhase] = useState<"idle" | "shrink" | "grow">("idle");

  useEffect(() => {
    if (!justSubmitted) return;
    const shrinkTimer = setTimeout(() => setAnimPhase("shrink"), 0);
    const growTimer = setTimeout(() => setAnimPhase("grow"), 300);
    const doneTimer = setTimeout(() => setAnimPhase("idle"), 600);
    return () => {
      clearTimeout(shrinkTimer);
      clearTimeout(growTimer);
      clearTimeout(doneTimer);
    };
  }, [justSubmitted]);

  if (!store.latitude || !store.longitude) return null;

  const wild = getWildCreature(store.id);
  const spriteUrl = hasSubmittedToday ? BOX_EMOJI_URL : wild.spriteUrl;
  const spriteName = hasSubmittedToday ? "Box" : wild.name;
  const borderColor = RARITY_BORDER_COLORS[wild.rarity] ?? "#9CA3AF";
  const isRainbow = borderColor === "rainbow";

  // Deterministic animation delay so sprites don't bob in sync
  const animDelay = (simpleHash(store.id) % 3000) / 1000;
  // Use a fixed size + GPU-accelerated scale instead of animating width/height
  // (width/height transitions trigger layout recalc every frame)
  const scale = isSelected ? 128 / 48 : 1;

  return (
    <AdvancedMarker
      ref={ref}
      position={{ lat: store.latitude, lng: store.longitude }}
      onClick={handleClick}
      title={`${store.name} — ${hasSubmittedToday ? "Already scouted!" : `${spriteName} lurks here!`}`}
      zIndex={isSelected ? 999 : undefined}
      collisionBehavior="REQUIRED_AND_HIDES_OPTIONAL"
    >
      {/* Outer: fade-in (opacity) + float (translateY) — owns the animation transforms */}
      <div
        style={{
          animation: `marker-fade-in 0.4s ease-out both, float 3s ease-in-out infinite`,
          animationDelay: `0s, ${animDelay}s`,
          cursor: "pointer",
        }}
      >
        {/* Scale wrapper: GPU-accelerated scale via inline transform — no competing animations */}
        <div
          style={{
            position: "relative",
            width: 48,
            height: 48,
            borderRadius: "50%",
            background: isRainbow
              ? "conic-gradient(from var(--rainbow-angle, 0deg), #ef4444, #f59e0b, #22c55e, #3b82f6, #a855f7, #ef4444)"
              : "transparent",
            padding: isRainbow ? 3 : 0,
            animation: isRainbow ? "rainbow-spin 2s linear infinite" : "none",
            transform: `scale(${scale})`,
            transition: "transform 200ms ease, filter 200ms ease",
            willChange: "transform",
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
              src={spriteUrl}
              alt={spriteName}
              width={32}
              height={32}
              style={{
                imageRendering: "pixelated",
                transition: animPhase !== "idle"
                  ? "transform 300ms ease-in-out"
                  : undefined,
                transform: animPhase === "shrink" ? "scale(0)" : animPhase === "grow" ? "scale(1)" : undefined,
              }}
            />
          </div>
          {starTier && (
            <div
              style={{
                position: "absolute",
                top: isSelected ? -4 : -2,
                right: isSelected ? -4 : -2,
                width: isSelected ? 20 : 10,
                height: isSelected ? 20 : 10,
                borderRadius: "50%",
                backgroundColor: STAR_COLORS[starTier],
                border: "2px solid white",
                boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: isSelected ? 12 : 0,
                transition: "all 200ms ease",
                zIndex: 10,
              }}
            >
              {isSelected && "★"}
            </div>
          )}
        </div>
      </div>
    </AdvancedMarker>
  );
});
