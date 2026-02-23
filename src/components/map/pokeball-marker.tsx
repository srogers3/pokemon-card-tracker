"use client";

import { AdvancedMarker } from "@vis.gl/react-google-maps";
import type { Store } from "@/db/schema";

type MarkerState = "active" | "inactive" | "hot";

function getMarkerState(lastSightingAt: Date | null): MarkerState {
  if (!lastSightingAt) return "inactive";
  const hoursSince = (Date.now() - new Date(lastSightingAt).getTime()) / (1000 * 60 * 60);
  if (hoursSince <= 4) return "hot";
  if (hoursSince <= 48) return "active";
  return "inactive";
}

const markerColors: Record<MarkerState, { top: string; band: string }> = {
  active: { top: "#EF4444", band: "#1F2937" },
  inactive: { top: "#9CA3AF", band: "#6B7280" },
  hot: { top: "#D4A843", band: "#92710A" },
};

function PokeballSvg({ state }: { state: MarkerState }) {
  const colors = markerColors[state];
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 2 A16 16 0 0 1 34 18 H22 A4 4 0 0 0 14 18 H2 A16 16 0 0 1 18 2Z" fill={colors.top} />
      <path d="M2 18 H14 A4 4 0 0 0 22 18 H34 A16 16 0 0 1 2 18Z" fill="white" />
      <rect x="2" y="16.5" width="32" height="3" rx="1.5" fill={colors.band} />
      <circle cx="18" cy="18" r="5" fill={colors.band} />
      <circle cx="18" cy="18" r="3" fill="white" />
      <circle cx="18" cy="18" r="17" fill="none" stroke={colors.band} strokeWidth="1" />
      {state === "hot" && (
        <circle cx="18" cy="18" r="17" fill="none" stroke="#D4A843" strokeWidth="2" opacity="0.6">
          <animate attributeName="r" values="17;20;17" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.6;0;0.6" dur="2s" repeatCount="indefinite" />
        </circle>
      )}
    </svg>
  );
}

export function PokeballMarker({
  store,
  lastSightingAt,
  onClick,
}: {
  store: Store;
  lastSightingAt: Date | null;
  onClick: () => void;
}) {
  if (!store.latitude || !store.longitude) return null;

  const state = getMarkerState(lastSightingAt);

  return (
    <AdvancedMarker
      position={{ lat: store.latitude, lng: store.longitude }}
      onClick={onClick}
      title={store.name}
    >
      <div className="cursor-pointer transition-transform hover:scale-110">
        <PokeballSvg state={state} />
      </div>
    </AdvancedMarker>
  );
}
