import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import { timeAgo } from "@/lib/utils";
import type { SightingItem } from "@/app/dashboard/sightings/actions";

export function SightingCard({ sighting }: { sighting: SightingItem }) {
  const isFound = sighting.status === "found";

  return (
    <Card className={`p-3 border-l-4 overflow-hidden ${isFound ? "border-l-green-500" : "border-l-red-500"}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm truncate">{sighting.storeName}</span>
            <span className="text-xs text-muted-foreground shrink-0">
              {timeAgo(new Date(sighting.sightedAt))}
            </span>
          </div>
          <p className="text-xs text-muted-foreground truncate">{sighting.storeLocation}</p>
        </div>
        <Badge variant={isFound ? "found" : "notFound"} className="shrink-0">
          {isFound ? "Found" : "Not Found"}
        </Badge>
      </div>

      {sighting.productName && (
        <p className="text-sm mt-1.5">{sighting.productName}</p>
      )}

      {sighting.notes && (
        <p className="text-xs text-muted-foreground italic mt-1 line-clamp-2">
          {sighting.notes}
        </p>
      )}

      <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
        <span>{sighting.reporterName}</span>
        {sighting.verified && (
          <CheckCircle2 className="size-3.5 text-green-500" />
        )}
      </div>
    </Card>
  );
}
