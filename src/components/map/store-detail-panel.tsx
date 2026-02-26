"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, MapPin, Clock } from "lucide-react";
import type { Store, Product } from "@/db/schema";
import { MapSightingForm } from "./map-sighting-form";
import { cn, getDistanceMeters, MAX_TIP_DISTANCE_M } from "@/lib/utils";
import { getStoreTrends } from "@/app/dashboard/map/actions";
import type { RestockTrend } from "@/lib/trends";
import { getBarPercent } from "@/lib/trends";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CardboardexTab } from "./cardboardex-tab";
import type { CreatureEntry } from "@/db/creature-data";
import type { StarTier } from "@/lib/wild-creature";

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
  userLocation,
  onClose,
  onSightingSubmitted,
  wildCreature,
  starTier,
  isCreatureCaught,
  creatureCatchCount,
  creatureShinyCount,
  hasPendingBox,
}: {
  store: Store;
  sightings: Sighting[];
  products: Product[];
  hasSubmittedToday: boolean;
  userLocation: { lat: number; lng: number } | null;
  onClose: () => void;
  onSightingSubmitted: () => void;
  wildCreature: CreatureEntry;
  starTier: StarTier | null;
  isCreatureCaught: boolean;
  creatureCatchCount: number;
  creatureShinyCount: number;
  hasPendingBox: boolean;
}) {
  const [showForm, setShowForm] = useState(false);
  const [trend, setTrend] = useState<RestockTrend | null>(null);

  const locationUnknown = !userLocation;
  const devSkipProximity = typeof document !== "undefined" && document.cookie.includes("dev_skip_proximity=true");
  const isTooFar = !devSkipProximity && !locationUnknown && store.latitude != null && store.longitude != null
    ? getDistanceMeters(userLocation.lat, userLocation.lng, store.latitude, store.longitude) > MAX_TIP_DISTANCE_M
    : false;

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

      <Tabs defaultValue="store-info" className="flex-1">
        <div className="px-4 pt-2">
          <TabsList className="w-full">
            <TabsTrigger value="store-info" className="flex-1">Store Info</TabsTrigger>
            <TabsTrigger value="cardboardex" className="flex-1">Cardboardex</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="store-info">
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
              <p className="text-xs text-muted-foreground">Need 3+ verified sightings to show patterns</p>
            ) : trend.avgDaysBetween === null ? (
              <p className="text-xs text-muted-foreground">Need sightings on different days to detect patterns</p>
            ) : (
              <div className="text-xs text-muted-foreground space-y-0.5">
                <p>Restocks every ~{Math.round(trend.avgDaysBetween)} days</p>
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
                  className={cn(
                    "flex items-center justify-between text-sm bg-muted/30 rounded-lg px-3 py-2",
                    !s.verified && "opacity-60"
                  )}
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
                    {!s.verified && (
                      <span className="text-[10px] text-muted-foreground/60">(unverified)</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Report Sighting button or inline form */}
        {hasSubmittedToday ? (
          <div className="bg-muted/50 rounded-lg p-4 text-center space-y-1">
            <p className="text-2xl">📦</p>
            <p className="font-semibold text-sm">You already scouted this location today!</p>
            <p className="text-xs text-muted-foreground">Come back tomorrow — a new creature might be lurking.</p>
          </div>
        ) : locationUnknown ? (
          <div className="bg-muted/50 rounded-lg p-4 text-center space-y-1">
            <p className="text-2xl">📍</p>
            <p className="font-semibold text-sm">Location required</p>
            <p className="text-xs text-muted-foreground">Enable location services to submit a report.</p>
          </div>
        ) : isTooFar ? (
          <div className="bg-muted/50 rounded-lg p-4 text-center space-y-1">
            <p className="text-2xl">📍</p>
            <p className="font-semibold text-sm">You&apos;re too far from this store</p>
            <p className="text-xs text-muted-foreground">Get within 0.5 miles to submit a report.</p>
          </div>
        ) : showForm ? (
          <MapSightingForm
            storeId={store.id}
            products={products}
            userLatitude={userLocation?.lat ?? null}
            userLongitude={userLocation?.lng ?? null}
            onCancel={() => setShowForm(false)}
            onSubmitSuccess={onSightingSubmitted}
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
        </TabsContent>

        <TabsContent value="cardboardex">
          <CardboardexTab
            creature={wildCreature}
            isCaught={isCreatureCaught}
            catchCount={creatureCatchCount}
            shinyCount={creatureShinyCount}
            starTier={starTier}
            hasPendingBox={hasPendingBox}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
