"use client";

import { useState } from "react";
import { getSpriteUrl, TOTAL_CREATURES } from "@/db/creature-data";
import { ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface RegionCardProps {
  uniqueCaught: number;
  totalCaught: number;
  shinyCount: number;
  /** IDs of first few caught creatures for the card preview */
  previewCreatureIds: number[];
}

export function RegionCard({
  uniqueCaught,
  totalCaught,
  shinyCount,
  previewCreatureIds,
}: RegionCardProps) {
  const [expanded, setExpanded] = useState(false);
  const isComplete = uniqueCaught >= TOTAL_CREATURES;
  const progressPercent = Math.round((uniqueCaught / TOTAL_CREATURES) * 100);

  return (
    <button
      type="button"
      onClick={() => setExpanded((v) => !v)}
      className="w-full text-left focus:outline-none"
    >
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl border bg-card shadow-sm transition-all",
          expanded ? "rounded-b-none border-b-0" : ""
        )}
      >
        {/* Diagonal accent stripes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -right-8 -top-8 w-[200px] h-[300px] rotate-[20deg] bg-gradient-to-b from-primary/[0.07] to-transparent" />
          <div className="absolute -right-16 -top-4 w-[160px] h-[280px] rotate-[20deg] bg-gradient-to-b from-accent/[0.05] to-transparent" />
        </div>

        <div className="relative flex items-center gap-4 p-4">
          {/* Left: Region info */}
          <div className="flex-1 min-w-0 z-10">
            <h3 className="text-xl font-extrabold tracking-wider uppercase text-foreground">
              Yoris
            </h3>
            {isComplete ? (
              <p className="text-sm font-semibold text-accent">Complete!</p>
            ) : (
              <div className="w-28 h-2 bg-muted rounded-full mt-1.5 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            )}
            <p className="text-sm font-bold text-foreground/70 mt-1">
              {uniqueCaught} / {TOTAL_CREATURES}
            </p>
            {/* Shimmer medal */}
            <div className="region-circle-shimmer rounded-full p-[2px] w-8 h-8 mt-1.5">
              <div className="w-full h-full rounded-full bg-card flex items-center justify-center">
                <span className="text-xs font-bold text-primary">
                  {progressPercent}%
                </span>
              </div>
            </div>
          </div>

          {/* Right: Preview creature sprites */}
          <div className="flex items-end -space-x-2 z-10">
            {previewCreatureIds.slice(0, 3).map((id, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={id}
                src={getSpriteUrl(id)}
                alt=""
                className={cn(
                  "drop-shadow-md",
                  i === 0 && "w-14 h-14 relative z-30",
                  i === 1 && "w-16 h-16 relative z-20 -mb-1",
                  i === 2 && "w-12 h-12 relative z-10"
                )}
              />
            ))}
          </div>
        </div>

        {/* Expand chevron */}
        <div className="flex justify-center pb-1">
          <ChevronUp
            className={cn(
              "w-4 h-4 text-muted-foreground transition-transform",
              !expanded && "rotate-180"
            )}
          />
        </div>
      </div>

      {/* Expanded detail header */}
      {expanded && (
        <div className="rounded-b-2xl border border-t-0 bg-foreground/[0.03] backdrop-blur-sm px-4 py-3 shadow-inner">
          <div className="flex justify-center gap-8">
            <div className="text-center">
              <p className="text-lg font-bold text-foreground">{totalCaught}</p>
              <p className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wide">
                Caught
              </p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-foreground">{shinyCount}</p>
              <p className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wide">
                Shiny
              </p>
            </div>
          </div>
        </div>
      )}
    </button>
  );
}
