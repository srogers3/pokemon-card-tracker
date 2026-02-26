"use client";

import { useState } from "react";
import { PendingBoxCard } from "@/components/pending-box-card";
import { UnboxRevealModal, type UnboxData } from "@/components/unbox-reveal-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type PendingBox = {
  id: string;
  createdAt: string;
  reportStatus: string;
};

export function CollectionPendingSection({
  pendingBoxes,
  isPremium,
}: {
  pendingBoxes: PendingBox[];
  isPremium: boolean;
}) {
  const [openings, setOpenings] = useState<UnboxData[]>([]);

  if (pendingBoxes.length === 0) return null;

  return (
    <>
      <Card className="mb-6 gold-glow">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            Pending Boxes ({pendingBoxes.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap pb-2">
            {pendingBoxes.map((box) => (
              <PendingBoxCard
                key={box.id}
                boxId={box.id}
                createdAt={box.createdAt}
                canOpenImmediately={isPremium}
                onOpened={(newOpenings) => setOpenings(newOpenings)}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {isPremium
              ? "Premium: open your boxes anytime!"
              : "Boxes can be opened after 24 hours, or when your report is verified!"}
          </p>
        </CardContent>
      </Card>

      {openings.length > 0 && (
        <UnboxRevealModal
          openings={openings}
          onComplete={() => {
            setOpenings([]);
            window.location.reload();
          }}
        />
      )}
    </>
  );
}
