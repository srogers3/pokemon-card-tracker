"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SightingCard } from "@/components/sighting-card";
import { getRecentSightings, getNearbySightings } from "@/app/dashboard/sightings/actions";
import type { SightingItem } from "@/app/dashboard/sightings/actions";
import { MapPin, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
      ))}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <p className="text-center text-muted-foreground py-12 text-sm">{message}</p>
  );
}

export function SightingsFeed({ isPremium }: { isPremium: boolean }) {
  const [recentSightings, setRecentSightings] = useState<SightingItem[] | null>(null);
  const [nearbySightings, setNearbySightings] = useState<SightingItem[] | null>(null);
  const [locationStatus, setLocationStatus] = useState<"loading" | "granted" | "denied" | "error">(
    () => (typeof navigator !== "undefined" && !navigator.geolocation ? "denied" : "loading")
  );

  // Fetch global sightings on mount
  useEffect(() => {
    getRecentSightings(isPremium).then(setRecentSightings);
  }, [isPremium]);

  // Request GPS and fetch nearby sightings
  useEffect(() => {
    if (locationStatus === "denied") return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationStatus("granted");
        getNearbySightings(position.coords.latitude, position.coords.longitude, isPremium)
          .then(setNearbySightings);
      },
      () => {
        setLocationStatus("denied");
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only run on mount
  }, [isPremium]);

  function retryLocation() {
    setLocationStatus("loading");
    setNearbySightings(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationStatus("granted");
        getNearbySightings(position.coords.latitude, position.coords.longitude, isPremium)
          .then(setNearbySightings);
      },
      () => {
        setLocationStatus("denied");
      }
    );
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="nearby">
        <TabsList className="sticky top-0 z-10 w-full">
          <TabsTrigger value="nearby" className="flex-1 gap-1.5">
            <MapPin className="size-4" />
            Near You
          </TabsTrigger>
          <TabsTrigger value="all" className="flex-1 gap-1.5">
            <Globe className="size-4" />
            All Recent
          </TabsTrigger>
        </TabsList>

        <TabsContent value="nearby">
          {locationStatus === "loading" && <LoadingSkeleton />}
          {locationStatus === "denied" && (
            <div className="text-center py-12 space-y-3">
              <p className="text-sm text-muted-foreground">Enable location to see sightings near you.</p>
              <Button variant="outline" size="sm" onClick={retryLocation}>
                Try Again
              </Button>
            </div>
          )}
          {locationStatus === "granted" && nearbySightings === null && <LoadingSkeleton />}
          {locationStatus === "granted" && nearbySightings !== null && nearbySightings.length === 0 && (
            <EmptyState message="No recent sightings nearby. Be the first to report!" />
          )}
          {nearbySightings && nearbySightings.length > 0 && (
            <div className="grid gap-3 md:grid-cols-2 page-fade-in">
              {nearbySightings.map((s) => (
                <SightingCard key={s.id} sighting={s} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="all">
          {recentSightings === null && <LoadingSkeleton />}
          {recentSightings !== null && recentSightings.length === 0 && (
            <EmptyState message="No sightings yet." />
          )}
          {recentSightings && recentSightings.length > 0 && (
            <div className="grid gap-3 md:grid-cols-2 page-fade-in">
              {recentSightings.map((s) => (
                <SightingCard key={s.id} sighting={s} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {!isPremium && (
        <Card className="card-hover border-gold/30 gold-glow">
          <CardHeader>
            <CardTitle className="text-base">Unlock More Features</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Premium members get full sighting history, restock heatmaps, and email alerts.{" "}
            <Link href="/dashboard/upgrade" className="text-gold font-medium hover:underline">
              Upgrade now
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
