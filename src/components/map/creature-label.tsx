"use client";

import { AdvancedMarker } from "@vis.gl/react-google-maps";
import type { StarTier } from "@/lib/wild-creature";

const RARITY_BORDER_COLORS: Record<string, string> = {
  common: "#9CA3AF",
  uncommon: "#2DD4BF",
  rare: "#F59E0B",
  ultra_rare: "conic-gradient(from 0deg, #ef4444, #f59e0b, #22c55e, #3b82f6, #a855f7, #ef4444)",
};

const STAR_COLORS: Record<string, string> = {
  green: "#22C55E",
  yellow: "#EAB308",
  purple: "#A855F7",
};

export function CreatureLabel({
  position,
  creatureName,
  isCaught,
  rarity,
  starTier,
  visible,
}: {
  position: { lat: number; lng: number };
  creatureName: string;
  isCaught: boolean;
  rarity: string;
  starTier: StarTier | null;
  visible: boolean;
}) {
  const borderColor = RARITY_BORDER_COLORS[rarity] ?? "#9CA3AF";
  const isRainbow = rarity === "ultra_rare";
  const displayName = isCaught ? creatureName : "???";

  return (
    <AdvancedMarker
      position={position}
      zIndex={visible ? 1001 : -1}
    >
      <div
        style={{
          transform: "translateY(-90px)",
          opacity: visible ? 1 : 0,
          transition: "opacity 300ms ease-in-out",
          pointerEvents: "none",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* Speech bubble */}
        <div
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.85)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            borderRadius: 8,
            padding: "4px 10px",
            border: isRainbow ? "none" : `2px solid ${borderColor}`,
            background: isRainbow
              ? "linear-gradient(white, white) padding-box, conic-gradient(from 0deg, #ef4444, #f59e0b, #22c55e, #3b82f6, #a855f7, #ef4444) border-box"
              : undefined,
            borderColor: isRainbow ? "transparent" : undefined,
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
            whiteSpace: "nowrap",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          {starTier && (
            <span style={{ color: STAR_COLORS[starTier], fontSize: 12 }}>★</span>
          )}
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: isCaught ? "#1a1a2e" : "#6b7280",
              fontStyle: isCaught ? "normal" : "italic",
            }}
          >
            {displayName}
          </span>
        </div>
        {/* Downward caret */}
        <div
          style={{
            width: 0,
            height: 0,
            borderLeft: "6px solid transparent",
            borderRight: "6px solid transparent",
            borderTop: `6px solid ${isRainbow ? "#3b82f6" : borderColor}`,
            marginTop: -1,
          }}
        />
      </div>
    </AdvancedMarker>
  );
}
