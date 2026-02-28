"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { StoreMap } from "./store-map";
import { getMapPageData } from "@/app/dashboard/map/actions";

type Awaited<T> = T extends Promise<infer U> ? U : T;
type MapData = Awaited<ReturnType<typeof getMapPageData>>;

/**
 * Renders the map permanently in the dashboard layout.
 * Lazily loads data on first visit to /dashboard/map, then keeps the
 * Google Maps instance mounted (but hidden) when on other pages.
 */
export function PersistentMap() {
  const pathname = usePathname();
  const isMapRoute = pathname === "/dashboard/map";
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  const loading = hasInitialized && !mapData;

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID;

  // Load map data on first visit to the map route
  useEffect(() => {
    if (isMapRoute && !hasInitialized) {
      setHasInitialized(true); // eslint-disable-line react-hooks/set-state-in-effect -- one-time lazy init
      getMapPageData().then((data) => setMapData(data));
    }
  }, [isMapRoute, hasInitialized]);

  // Don't render anything until we've visited the map at least once
  if (!mapData && !isMapRoute) return null;

  if (!apiKey || !mapId) {
    if (!isMapRoute) return null;
    return (
      <div className="flex items-center justify-center h-[60vh] text-muted-foreground">
        Google Maps API key or Map ID not configured.
      </div>
    );
  }

  if (loading || !mapData) {
    if (!isMapRoute) return null;
    return (
      <div className="flex items-center justify-center h-[calc(100dvh-64px)]">
        <div className="animate-pulse text-muted-foreground">Loading map...</div>
      </div>
    );
  }

  return (
    <div
      data-persistent-map
      style={{
        display: isMapRoute ? "block" : "none",
      }}
    >
      <StoreMap
        initialStores={mapData.stores}
        products={mapData.products}
        apiKey={apiKey}
        mapId={mapId}
        userBoxes={mapData.userBoxes}
      />
    </div>
  );
}
