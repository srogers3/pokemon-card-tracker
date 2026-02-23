"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, MapPin, Clock } from "lucide-react";
import type { Store, Product } from "@/db/schema";
import { MapSightingForm } from "./map-sighting-form";
import { cn } from "@/lib/utils";

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
  onClose,
}: {
  store: Store;
  sightings: Sighting[];
  products: Product[];
  onClose: () => void;
}) {
  const [showForm, setShowForm] = useState(false);

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
        {showForm ? (
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
