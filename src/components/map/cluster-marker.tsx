"use client";

import { memo, useCallback } from "react";
import { AdvancedMarker } from "@vis.gl/react-google-maps";
import type { Store } from "@/db/schema";
import { getWildCreature, simpleHash } from "@/lib/wild-creature";

const RARITY_BORDER_COLORS: Record<string, string> = {
  common: "#9CA3AF",
  uncommon: "#2DD4BF",
  rare: "#F59E0B",
  ultra_rare: "rainbow",
};

const BOX_EMOJI_URL = "data:image/svg+xml," + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><text y="50" font-size="48">📦</text></svg>'
);

export const ClusterMarker = memo(function ClusterMarker({
  store,
  onClick,
  isSelected,
  hasSubmittedToday,
  setMarkerRef,
}: {
  store: Store;
  onClick: (storeId: string) => void;
  isSelected: boolean;
  hasSubmittedToday: boolean;
  setMarkerRef?: (marker: google.maps.marker.AdvancedMarkerElement | null, id: string) => void;
}) {
  const ref = useCallback(
    (marker: google.maps.marker.AdvancedMarkerElement | null) => {
      setMarkerRef?.(marker, store.id);
    },
    [setMarkerRef, store.id]
  );

  const handleClick = useCallback(() => onClick(store.id), [onClick, store.id]);

  if (!store.latitude || !store.longitude) return null;

  const wild = getWildCreature(store.id);
  const spriteUrl = hasSubmittedToday ? BOX_EMOJI_URL : wild.spriteUrl;
  const spriteName = hasSubmittedToday ? "Box" : wild.name;
  const borderColor = hasSubmittedToday ? "#9CA3AF" : (RARITY_BORDER_COLORS[wild.rarity] ?? "#9CA3AF");
  const isRainbow = !hasSubmittedToday && borderColor === "rainbow";

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
              }}
            />
          </div>
        </div>
      </div>
    </AdvancedMarker>
  );
});
