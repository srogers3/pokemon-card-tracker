"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, MapPin, Clock } from "lucide-react";
import type { Store, Product } from "@/db/schema";
import { MapSightingForm } from "./map-sighting-form";
import { cn } from "@/lib/utils";
import { getStoreTrends } from "@/app/dashboard/actions";
import type { RestockTrend } from "@/lib/trends";
import { getBarPercent } from "@/lib/trends";

interface Sighting {
  id: string;
  productName: string;
  status: string;
  sightedAt: Date;
  verified: boolean;
}

export function StoreDetailPanel({
  store,
  sightings,
  products,
  hasSubmittedToday,
  onClose,
}: {
  store: Store;
  sightings: Sighting[];
  products: Product[];
  hasSubmittedToday: boolean;
  onClose: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [trend, setTrend] = useState<RestockTrend | null>(null);

  useEffect(() => {
    getStoreTrends(store.id).then(setTrend);
  }, [store.id]);

  return (
    <div className={cn(
      "absolute bottom-0 left-0 right-0 z-10 overflow-y-auto bg-card rounded-t-2xl shadow-lg border-t border-border/50 transition-[max-height] duration-300 ease-in-out",
      showForm ? "max-h-[70vh]" : "max-h-[40vh]",
      "md:absolute md:right-4 md:bottom-4 md:left-auto md:w-96 md:rounded-2xl md:border md:max-h-[70vh]"
    )}>
      {/* Header */}
      <div className="sticky top-0 bg-card z-10 p-4 border-b border-border/50 flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-lg">{store.name}</h3>
          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
            <MapPin className="w-3 h-3" />
            {store.locationLabel}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="shrink-0">
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="p-4 space-y-4">
        {/* Quick stats */}
        <div className="flex gap-3 text-sm">
          <div className="bg-muted/50 rounded-lg px-3 py-2 flex-1 text-center">
            <div className="font-semibold">{sightings.length}</div>
            <div className="text-muted-foreground text-xs">Recent Tips</div>
          </div>
          <div className="bg-muted/50 rounded-lg px-3 py-2 flex-1 text-center">
            <div className="font-semibold">
              {sightings.length > 0
                ? new Date(sightings[0].sightedAt).toLocaleDateString()
                : "—"}
            </div>
            <div className="text-muted-foreground text-xs">Last Sighting</div>
          </div>
        </div>

        {/* Restock Intel */}
        {trend && (
          <div className="bg-muted/50 rounded-lg px-3 py-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Restock Intel</span>
              {trend.confidence === "low" ? (
                <span className="text-xs text-muted-foreground">Not enough data</span>
              ) : (
                <span className="text-sm font-semibold">
                  {trend.grade === "hot" && "🔥 Hot"}
                  {trend.grade === "warm" && "🌤️ Warm"}
                  {trend.grade === "cool" && "🌙 Cool"}
                  {trend.grade === "cold" && "🧊 Cold"}
                </span>
              )}
            </div>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
                style={{ width: `${trend.confidence === "low" ? 0 : getBarPercent(trend.grade)}%` }}
              />
            </div>
            {trend.confidence === "low" ? (
              <p className="text-xs text-muted-foreground">Need 3+ verified reports to show patterns</p>
            ) : (
              <div className="text-xs text-muted-foreground space-y-0.5">
                {trend.avgDaysBetween !== null && (
                  <p>Restocks every ~{Math.round(trend.avgDaysBetween)} days</p>
                )}
                {(trend.bestDay || trend.bestTimeWindow) && (
                  <p>
                    {[trend.bestDay, trend.bestTimeWindow].filter(Boolean).join(", ")}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Recent sightings */}
        {sightings.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Recent Sightings</h4>
            <div className="space-y-2">
              {sightings.slice(0, 5).map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between text-sm bg-muted/30 rounded-lg px-3 py-2"
                >
                  <span className="font-medium truncate mr-2">{s.productName}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={s.status === "found" ? "found" : "notFound"} className="text-xs">
                      {s.status === "found" ? "Found" : "Empty"}
                    </Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(s.sightedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Report Sighting button or inline form */}
        {hasSubmittedToday ? (
          <div className="bg-muted/50 rounded-lg p-4 text-center space-y-1">
            <p className="text-2xl">🥚</p>
            <p className="font-semibold text-sm">Your Trainer already scouted this location today!</p>
            <p className="text-xs text-muted-foreground">Come back tomorrow — a new Pokemon might be waiting.</p>
          </div>
        ) : showForm ? (
          <MapSightingForm
            storeId={store.id}
            products={products}
            onCancel={() => setShowForm(false)}
          />
        ) : (
          <Button
            variant="accent"
            className="w-full"
            onClick={() => setShowForm(true)}
          >
            Report Sighting
          </Button>
        )}
      </div>
    </div>
  );
}
