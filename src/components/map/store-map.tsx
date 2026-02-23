"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { APIProvider, Map as GoogleMap, Marker, useMap, useApiIsLoaded } from "@vis.gl/react-google-maps";
import { PokeballMarker } from "./pokeball-marker";
import { StoreDetailPanel } from "./store-detail-panel";
import { searchNearbyStores } from "@/lib/places";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LocateFixed, Search } from "lucide-react";
import type { Store, Product } from "@/db/schema";

interface StoreWithSightings {
  store: Store;
  lastSightingAt: Date | null;
  sightings: {
    id: string;
    productName: string;
    status: string;
    sightedAt: Date;
    verified: boolean;
  }[];
}

interface StoreMapProps {
  initialStores: StoreWithSightings[];
  products: Product[];
  apiKey: string;
}

const DEFAULT_CENTER = { lat: 39.8283, lng: -98.5795 };
const DEFAULT_ZOOM = 4;
const LOCATED_ZOOM = 13;

// Hide default Google Maps POI labels so only our markers show
const POI_OFF_STYLES: google.maps.MapTypeStyle[] = [
  { featureType: "poi", stylers: [{ visibility: "off" }] },
];

function MapContent({
  initialStores,
  products,
}: {
  initialStores: StoreWithSightings[];
  products: Product[];
}) {
  const map = useMap();
  const apiIsLoaded = useApiIsLoaded();
  const [storeData, setStoreData] = useState<StoreWithSightings[]>(initialStores);
  const [selectedStore, setSelectedStore] = useState<StoreWithSightings | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const lastSearchCenter = useRef<{ lat: number; lng: number } | null>(null);

  // Apply map styles programmatically (the styles prop on GoogleMap doesn't work)
  useEffect(() => {
    if (map) {
      map.setOptions({ styles: POI_OFF_STYLES });
    }
  }, [map]);

  const handleSearchArea = useCallback(
    async (lat: number, lng: number) => {
      if (lastSearchCenter.current) {
        const dist = Math.abs(lat - lastSearchCenter.current.lat) + Math.abs(lng - lastSearchCenter.current.lng);
        if (dist < 0.05) return;
      }
      lastSearchCenter.current = { lat, lng };

      const newStores = await searchNearbyStores(lat, lng);
      setStoreData((prev) => {
        const existing = new Map(prev.map((s) => [s.store.id, s]));
        for (const store of newStores) {
          if (!existing.has(store.id)) {
            existing.set(store.id, { store, lastSightingAt: null, sightings: [] });
          }
        }
        return Array.from(existing.values());
      });
    },
    []
  );

  useEffect(() => {
    const cached = localStorage.getItem("userLocation");
    if (cached) {
      const parsed = JSON.parse(cached);
      setUserLocation(parsed);
      map?.panTo(parsed);
      map?.setZoom(LOCATED_ZOOM);
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        localStorage.setItem("userLocation", JSON.stringify(loc));
        map?.panTo(loc);
        map?.setZoom(LOCATED_ZOOM);
        handleSearchArea(loc.lat, loc.lng);
      },
      () => {
        setLocationDenied(true);
      }
    );
  }, [map, handleSearchArea]);

  useEffect(() => {
    if (!map) return;
    const listener = map.addListener("idle", () => {
      const center = map.getCenter();
      if (center) {
        handleSearchArea(center.lat(), center.lng());
      }
    });
    return () => listener.remove();
  }, [map, handleSearchArea]);

  const handleRecenter = () => {
    if (userLocation && map) {
      map.panTo(userLocation);
      map.setZoom(LOCATED_ZOOM);
    }
  };

  const handleCitySearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || !map) return;

    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: searchQuery }, (results, status) => {
      if (status === "OK" && results?.[0]) {
        const loc = results[0].geometry.location;
        const center = { lat: loc.lat(), lng: loc.lng() };
        setUserLocation(center);
        map.panTo(center);
        map.setZoom(LOCATED_ZOOM);
        handleSearchArea(center.lat, center.lng);
      }
    });
  };

  return (
    <>
      <GoogleMap
        defaultCenter={userLocation || DEFAULT_CENTER}
        defaultZoom={userLocation ? LOCATED_ZOOM : DEFAULT_ZOOM}
        gestureHandling="greedy"
        disableDefaultUI={true}
        zoomControl={true}
        className="w-full h-full"
      >
        {userLocation && apiIsLoaded && (
          <Marker
            position={userLocation}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: "#3B82F6",
              fillOpacity: 1,
              strokeColor: "white",
              strokeWeight: 2,
            }}
            zIndex={1000}
          />
        )}

        {storeData.map((sd) => (
          <PokeballMarker
            key={sd.store.id}
            store={sd.store}
            onClick={() => setSelectedStore(sd)}
          />
        ))}
      </GoogleMap>

      <div className="absolute top-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-10">
        {locationDenied && !userLocation && (
          <div className="bg-card/90 backdrop-blur-sm rounded-lg px-3 py-2 mb-2 text-sm text-muted-foreground border border-border/50">
            Enable location to see stores near you
          </div>
        )}
        <form onSubmit={handleCitySearch} className="flex gap-2">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search city or zip..."
            className="bg-card/90 backdrop-blur-sm border-border/50 h-10"
          />
          <Button type="submit" size="sm" variant="accent" className="h-10 px-3">
            <Search className="w-4 h-4" />
          </Button>
        </form>
      </div>

      {userLocation && (
        <Button
          onClick={handleRecenter}
          variant="outline"
          size="sm"
          className="absolute bottom-24 right-4 z-10 bg-card/90 backdrop-blur-sm shadow-md"
        >
          <LocateFixed className="w-4 h-4" />
        </Button>
      )}

      {selectedStore && (
        <StoreDetailPanel
          store={selectedStore.store}
          sightings={selectedStore.sightings}
          products={products}
          onClose={() => setSelectedStore(null)}
        />
      )}
    </>
  );
}

export function StoreMap({ initialStores, products, apiKey }: StoreMapProps) {
  return (
    <APIProvider apiKey={apiKey}>
      <div className="relative w-full h-[calc(100vh-64px)]">
        <MapContent initialStores={initialStores} products={products} />
      </div>
    </APIProvider>
  );
}
