"use client";

import { Badge } from "@/components/ui/badge";
import { getSpriteUrl } from "@/db/creature-data";
import type { CreatureEntry } from "@/db/creature-data";
import type { StarTier } from "@/lib/wild-creature";
import { STAR_UPGRADE_CHANCE } from "@/lib/wild-creature";
import { cn } from "@/lib/utils";

const RARITY_COLORS: Record<string, string> = {
  common: "bg-gray-100 text-gray-700 border-gray-300",
  uncommon: "bg-teal-50 text-teal-700 border-teal-300",
  rare: "bg-amber-50 text-amber-700 border-amber-300",
  ultra_rare: "bg-purple-50 text-purple-700 border-purple-300",
};

const TYPE_LABELS: Record<string, string> = {
  shelf: "Shelf",
  logistics: "Logistics",
  checkout: "Checkout",
  scalper: "Scalper",
  hype: "Hype",
  clearance: "Clearance",
  backroom: "Backroom",
  corporate: "Corporate",
};

const STAR_STYLES: Record<string, { color: string; label: string }> = {
  green: { color: "#22C55E", label: "Green Star" },
  yellow: { color: "#EAB308", label: "Yellow Star" },
  purple: { color: "#A855F7", label: "Purple Star" },
};

export function CardboardexTab({
  creature,
  isCaught,
  catchCount,
  shinyCount,
  starTier,
  hasPendingBox,
}: {
  creature: CreatureEntry;
  isCaught: boolean;
  catchCount: number;
  shinyCount: number;
  starTier: StarTier | null;
  hasPendingBox: boolean;
}) {
  const showDetails = isCaught && !hasPendingBox;
  const rarityClass = RARITY_COLORS[creature.rarityTier] ?? RARITY_COLORS.common;

  return (
    <div className="p-4 space-y-4">
      {/* Sprite */}
      <div className="flex justify-center">
        <div className={cn(
          "w-24 h-24 rounded-xl flex items-center justify-center",
          showDetails ? "bg-card border border-primary/20" : "bg-muted/50 border border-dashed border-border"
        )}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={getSpriteUrl(creature.id)}
            alt={showDetails ? creature.name : "???"}
            className={cn("w-20 h-20", !showDetails && "brightness-0 opacity-30")}
            style={{ imageRendering: "pixelated" }}
          />
        </div>
      </div>

      {/* Name + badges */}
      <div className="text-center space-y-2">
        <h4 className="text-lg font-semibold">
          {showDetails ? creature.name : "???"}
        </h4>
        <div className="flex items-center justify-center gap-2">
          <Badge variant="outline" className={cn("text-xs border", rarityClass)}>
            {creature.rarityTier.replace("_", " ")}
          </Badge>
          {showDetails && (
            <Badge variant="outline" className="text-xs">
              {TYPE_LABELS[creature.type] ?? creature.type}
            </Badge>
          )}
        </div>
      </div>

      {/* Star tier */}
      {starTier && (
        <div className="flex items-center justify-center gap-2 text-sm">
          <span style={{ color: STAR_STYLES[starTier].color, fontSize: 16 }}>★</span>
          <span className="font-medium">{STAR_STYLES[starTier].label}</span>
          <span className="text-muted-foreground">
            — {Math.round(STAR_UPGRADE_CHANCE[starTier] * 100)}% upgrade chance
          </span>
        </div>
      )}

      {/* Description (caught only) */}
      {showDetails && (
        <p className="text-sm text-muted-foreground text-center italic">
          {creature.description}
        </p>
      )}

      {/* Collection stats (caught only) */}
      {showDetails && (
        <div className="flex gap-3 text-sm">
          <div className="bg-muted/50 rounded-lg px-3 py-2 flex-1 text-center">
            <div className="font-semibold">{catchCount}</div>
            <div className="text-muted-foreground text-xs">Caught</div>
          </div>
          {shinyCount > 0 && (
            <div className="bg-muted/50 rounded-lg px-3 py-2 flex-1 text-center">
              <div className="font-semibold">✨ {shinyCount}</div>
              <div className="text-muted-foreground text-xs">Shiny</div>
            </div>
          )}
        </div>
      )}

      {/* Uncaught message */}
      {!showDetails && !hasPendingBox && (
        <p className="text-xs text-muted-foreground text-center">
          Report a sighting at this store to discover this creature!
        </p>
      )}

      {/* Pending box message */}
      {hasPendingBox && (
        <div className="text-center space-y-1">
          <p className="text-2xl">📦</p>
          <p className="text-xs text-muted-foreground">
            You have a pending box from this store — details revealed when it opens!
          </p>
        </div>
      )}
    </div>
  );
}
