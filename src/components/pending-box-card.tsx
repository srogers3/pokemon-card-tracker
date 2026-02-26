"use client";

import { useState, useEffect, useTransition } from "react";
import { openPendingBoxAction } from "@/app/dashboard/collection/actions";
import type { UnboxData } from "@/components/unbox-reveal-modal";

type PendingBoxProps = {
  boxId: string;
  createdAt: string;
  canOpenImmediately: boolean;
  onOpened: (openings: UnboxData[]) => void;
};

const DELAY_MS = 24 * 60 * 60 * 1000;

export function PendingBoxCard({ boxId, createdAt, canOpenImmediately, onOpened }: PendingBoxProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (canOpenImmediately) return;

    const update = () => {
      const elapsed = Date.now() - new Date(createdAt).getTime();
      setTimeLeft(Math.max(0, DELAY_MS - elapsed));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [createdAt, canOpenImmediately]);

  const canOpen = canOpenImmediately || timeLeft <= 0;

  const handleOpen = () => {
    startTransition(async () => {
      try {
        const result = await openPendingBoxAction(boxId);
        if (result?.openings) {
          onOpened(result.openings);
        }
      } catch {
        // Will retry on next visit
      }
    });
  };

  const hours = Math.floor(timeLeft / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

  return (
    <div className="relative">
      <button
        onClick={canOpen ? handleOpen : undefined}
        disabled={!canOpen || isPending}
        className={`w-12 h-12 rounded-lg flex items-center justify-center text-lg transition-all ${
          canOpen
            ? "bg-gold/20 hover:bg-gold/30 cursor-pointer egg-float border border-gold/40"
            : "bg-gold/10 cursor-default egg-float"
        }`}
        title={canOpen ? "Tap to open!" : `Opens in ${hours}h ${minutes}m`}
      >
        {isPending ? "..." : "\u{1F4E6}"}
      </button>
      {!canOpen && (
        <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[9px] text-muted-foreground whitespace-nowrap">
          {hours}h {minutes}m
        </span>
      )}
      {canOpen && !isPending && (
        <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[9px] text-gold font-medium whitespace-nowrap">
          Open!
        </span>
      )}
    </div>
  );
}
