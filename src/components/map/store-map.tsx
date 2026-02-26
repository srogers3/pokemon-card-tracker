"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { APIProvider, Map as GoogleMap, Marker, useMap, useApiIsLoaded } from "@vis.gl/react-google-maps";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import { ClusterMarker } from "./cluster-marker";
import { StoreDetailPanel } from "./store-detail-panel";
import { clusterRenderer } from "./cluster-renderer";
import { CreatureLabel } from "./creature-label";
import { getWildCreature, getStarTier } from "@/lib/wild-creature";
import { CREATURE_DATA } from "@/db/creature-data";
import { searchNearbyStores } from "@/lib/places";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LocateFixed, Search } from "lucide-react";
import type { Store, Product } from "@/db/schema";

interface StoreWithSightings {
  store: Store;
  lastSightingAt: Date | null;
  hasSubmittedToday: boolean;
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
  mapId: string;
  userBoxes: {
    creatureId: number | null;
    wildCreatureId: number | null;
    isShiny: boolean;
    opened: boolean;
  }[];
}

const DEFAULT_CENTER = { lat: 39.8283, lng: -98.5795 };
const DEFAULT_ZOOM = 4;
const LOCATED_ZOOM = 13;

function MapContent({
  initialStores,
  products,
  mapId,
  userBoxes,
}: {
  initialStores: StoreWithSightings[];
  products: Product[];
  mapId: string;
  userBoxes: StoreMapProps["userBoxes"];
}) {
  const map = useMap();
  const apiIsLoaded = useApiIsLoaded();
  const [storeData, setStoreData] = useState<StoreWithSightings[]>(() => {
    console.log("[StoreMap] Initial stores loaded:", initialStores.length);
    // console.table(
    //   initialStores.map((s) => ({
    //     id: s.store.id,
    //     name: s.store.name,
    //     lat: s.store.latitude,
    //     lng: s.store.longitude,
    //     location: s.store.locationLabel,
    //     sightings: s.sightings.length,
    //   }))
    // );
    return initialStores;
  });
  const storeDataRef = useRef(storeData);
  storeDataRef.current = storeData;
  const [selectedStore, setSelectedStore] = useState<StoreWithSightings | null>(null);
  const selectedStoreRef = useRef(selectedStore);
  selectedStoreRef.current = selectedStore;
  const [recentlySubmittedId, setRecentlySubmittedId] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const lastSearchCenter = useRef<{ lat: number; lng: number } | null>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const markersRef = useRef<Record<string, google.maps.marker.AdvancedMarkerElement>>({});
  const clustererRef = useRef<MarkerClusterer | null>(null);

  const caughtMap = useMemo(() => {
    const map = new Map<number, { count: number; shinyCount: number }>();
    for (const box of userBoxes.filter(b => b.opened && b.creatureId)) {
      const existing = map.get(box.creatureId!) ?? { count: 0, shinyCount: 0 };
      existing.count++;
      if (box.isShiny) existing.shinyCount++;
      map.set(box.creatureId!, existing);
    }
    return map;
  }, [userBoxes]);

  const pendingWildIds = useMemo(() => {
    return new Set(
      userBoxes.filter(b => !b.opened && b.wildCreatureId).map(b => b.wildCreatureId!)
    );
  }, [userBoxes]);

  // Collect marker refs for clustering
  const setMarkerRef = useCallback(
    (marker: google.maps.marker.AdvancedMarkerElement | null, id: string) => {
      if (marker) {
        markersRef.current[id] = marker;
      } else {
        delete markersRef.current[id];
      }
    },
    []
  );

  // Stable callback for selecting a store — uses refs so it never changes identity
  const handleSelectStore = useCallback(
    (storeId: string) => {
      const sd = storeDataRef.current.find((s) => s.store.id === storeId);
      if (!sd) return;
      setSelectedStore(sd);
      if (map && sd.store.latitude && sd.store.longitude) {
        map.panTo({ lat: sd.store.latitude, lng: sd.store.longitude });
        // On mobile, the bottom sheet covers ~40vh and the search bar ~60px from top.
        // Offset the pan so the marker is centered in the visible area between them.
        if (window.innerWidth < 768) {
          const bottomSheetHeight = window.innerHeight * 0.4;
          const searchBarHeight = 60;
          const offsetY = (bottomSheetHeight - searchBarHeight) / 2;
          map.panBy(0, offsetY);
        }
      }
    },
    [map]
  );

  const handleSightingSubmitted = useCallback((storeId: string) => {
    setStoreData((prev) =>
      prev.map((sd) =>
        sd.store.id === storeId ? { ...sd, hasSubmittedToday: true } : sd
      )
    );
    setSelectedStore((prev) =>
      prev && prev.store.id === storeId ? { ...prev, hasSubmittedToday: true } : prev
    );
    setRecentlySubmittedId(storeId);
  }, []);

  // Track which marker IDs are currently in the clusterer
  const clusteredIdsRef = useRef<Set<string>>(new Set());

  // Initialize and update the clusterer (diff-based to avoid flickering)
  useEffect(() => {
    if (!map) return;

    if (!clustererRef.current) {
      clustererRef.current = new MarkerClusterer({
        map,
        renderer: clusterRenderer,
      });
    }

    const selectedId = selectedStore?.store.id;

    // Build the desired set of marker IDs (everything except selected)
    const desiredIds = new Set<string>();
    for (const id of Object.keys(markersRef.current)) {
      if (id !== selectedId) desiredIds.add(id);
    }

    // Remove markers that should no longer be clustered
    const toRemove: google.maps.marker.AdvancedMarkerElement[] = [];
    for (const id of clusteredIdsRef.current) {
      if (!desiredIds.has(id) && markersRef.current[id]) {
        toRemove.push(markersRef.current[id]);
        clusteredIdsRef.current.delete(id);
      }
    }
    if (toRemove.length > 0) {
      clustererRef.current.removeMarkers(toRemove);
    }

    // Add markers that are new to the cluster
    const toAdd: google.maps.marker.AdvancedMarkerElement[] = [];
    for (const id of desiredIds) {
      if (!clusteredIdsRef.current.has(id) && markersRef.current[id]) {
        toAdd.push(markersRef.current[id]);
        clusteredIdsRef.current.add(id);
      }
    }
    if (toAdd.length > 0) {
      clustererRef.current.addMarkers(toAdd);
    }

    // Ensure selected marker is visible on the map (not hidden by clusterer)
    if (selectedId && markersRef.current[selectedId]) {
      markersRef.current[selectedId].map = map;
    }
  }, [map, storeData, selectedStore]);

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
        const added: typeof newStores = [];
        for (const store of newStores) {
          if (!existing.has(store.id)) {
            existing.set(store.id, { store, lastSightingAt: null, hasSubmittedToday: false, sightings: [] });
            added.push(store);
          }
        }
        if (added.length > 0) {
          console.log(`[StoreMap] Discovered ${added.length} new stores near (${lat.toFixed(4)}, ${lng.toFixed(4)}):`);
          console.table(
            added.map((s) => ({
              id: s.id,
              name: s.name,
              lat: s.latitude,
              lng: s.longitude,
              location: s.locationLabel,
            }))
          );
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
      setGpsLocation(parsed);
      map?.panTo(parsed);
      map?.setZoom(LOCATED_ZOOM);
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        setGpsLocation(loc);
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
      // Deselect pin if it left the viewport.
      // Return early so the search doesn't pile a second re-render
      // on top of the deselect in the same tick.
      const sel = selectedStoreRef.current;
      if (sel) {
        const bounds = map.getBounds();
        const { latitude, longitude } = sel.store;
        if (bounds && latitude && longitude && !bounds.contains({ lat: latitude, lng: longitude })) {
          setSelectedStore(null);
          return;
        }
      }

      // Debounce the search so rapid panning doesn't spam the server
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
      searchTimerRef.current = setTimeout(() => {
        const center = map.getCenter();
        if (center) {
          handleSearchArea(center.lat(), center.lng());
        }
      }, 500);
    });
    return () => {
      listener.remove();
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [map, handleSearchArea]);

  const handleRecenter = () => {
    if (gpsLocation && map) {
      map.panTo(gpsLocation);
      map.setZoom(LOCATED_ZOOM);
      setSearchQuery("");
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
        zoomControl={false}
        mapId={mapId}
        className="w-full h-full"
        onClick={() => setSelectedStore(null)}
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
          <ClusterMarker
            key={sd.store.id}
            store={sd.store}
            isSelected={selectedStore?.store.id === sd.store.id}
            hasSubmittedToday={sd.hasSubmittedToday}
            justSubmitted={recentlySubmittedId === sd.store.id}
            setMarkerRef={setMarkerRef}
            onClick={handleSelectStore}
            starTier={getStarTier(sd.store.id)}
          />
        ))}

        {selectedStore && selectedStore.store.latitude && selectedStore.store.longitude && (() => {
          const wild = getWildCreature(selectedStore.store.id);
          const caught = caughtMap.get(wild.id);
          return (
            <CreatureLabel
              key={selectedStore.store.id}
              position={{ lat: selectedStore.store.latitude, lng: selectedStore.store.longitude }}
              creatureName={wild.name}
              isCaught={!!caught}
              rarity={wild.rarity}
              starTier={getStarTier(selectedStore.store.id)}
              visible={true}
            />
          );
        })()}
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

      {gpsLocation && (
        <Button
          onClick={handleRecenter}
          variant="outline"
          size="sm"
          className="absolute bottom-4 right-4 z-10 bg-card/90 backdrop-blur-sm shadow-md"
        >
          <LocateFixed className="w-4 h-4" />
        </Button>
      )}

      {selectedStore && (() => {
        const wild = getWildCreature(selectedStore.store.id);
        const creatureEntry = CREATURE_DATA.find(c => c.id === wild.id)!;
        const caught = caughtMap.get(wild.id);
        return (
          <StoreDetailPanel
            store={selectedStore.store}
            sightings={selectedStore.sightings}
            products={products}
            hasSubmittedToday={selectedStore.hasSubmittedToday}
            userLocation={gpsLocation}
            onClose={() => setSelectedStore(null)}
            onSightingSubmitted={() => handleSightingSubmitted(selectedStore.store.id)}
            wildCreature={creatureEntry}
            starTier={getStarTier(selectedStore.store.id)}
            isCreatureCaught={!!caught}
            creatureCatchCount={caught?.count ?? 0}
            creatureShinyCount={caught?.shinyCount ?? 0}
            hasPendingBox={pendingWildIds.has(wild.id)}
          />
        );
      })()}
    </>
  );
}

export function StoreMap({ initialStores, products, apiKey, mapId, userBoxes }: StoreMapProps) {
  return (
    <APIProvider apiKey={apiKey}>
      <div className="relative w-full h-[calc(100vh-64px)]">
        <MapContent initialStores={initialStores} products={products} mapId={mapId} userBoxes={userBoxes} />
      </div>
    </APIProvider>
  );
}
