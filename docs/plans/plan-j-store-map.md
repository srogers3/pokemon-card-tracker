# Store Map Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a Pokemon Go-inspired interactive map as the primary logged-in experience, where users discover nearby stores and submit sighting reports directly from the map.

**Architecture:** Google Maps JavaScript API via `@vis.gl/react-google-maps` with Places API (New) for store discovery. Stores are upserted into the existing `stores` table (with new lat/lng/placeId columns) as users explore. The map replaces the dashboard home; the old sightings table moves to `/dashboard/sightings`.

**Tech Stack:** Next.js 16, `@vis.gl/react-google-maps`, Google Maps JavaScript API, Google Places API (New), Drizzle ORM, Neon PostgreSQL, Tailwind CSS 4

---

### Task 1: Install dependency and add environment variable

**Files:**
- Modify: `package.json`
- Modify: `.env.example:21` (add Google Maps key)

**Step 1: Install the Google Maps React library**

Run: `npm install @vis.gl/react-google-maps`

**Step 2: Add the env variable to `.env.example`**

Add after the `NEXT_PUBLIC_APP_URL` line in `.env.example`:

```
# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

The user must set `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` in their `.env.local` with a key that has Maps JavaScript API and Places API (New) enabled in Google Cloud Console.

**Step 3: Commit**

```bash
git add package.json package-lock.json .env.example
git commit -m "feat: add @vis.gl/react-google-maps and Google Maps env var"
```

---

### Task 2: Add lat/lng/placeId columns to stores schema and generate migration

**Files:**
- Modify: `src/db/schema.ts:1-9` (add `doublePrecision` import)
- Modify: `src/db/schema.ts:64-71` (add columns to stores table)
- Modify: `src/db/schema.ts:171-172` (Store type already inferred, no change needed)

**Step 1: Update the stores table schema**

In `src/db/schema.ts`, add `doublePrecision` to the pg-core import:

```typescript
import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  pgEnum,
  doublePrecision,
} from "drizzle-orm/pg-core";
```

Then add columns to the `stores` table definition, after the `specificLocation` field and before `createdAt`:

```typescript
export const stores = pgTable("stores", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  locationLabel: text("location_label").notNull(),
  storeType: storeTypeEnum("store_type").notNull(),
  specificLocation: text("specific_location"),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  placeId: text("place_id").unique(),
  photoUrl: text("photo_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

**Step 2: Generate the Drizzle migration**

Run: `npm run db:generate`
Expected: A new migration file appears in `drizzle/` adding the 4 columns.

**Step 3: Run the migration**

Run: `npm run db:migrate`
Expected: "Migration complete"

**Step 4: Commit**

```bash
git add src/db/schema.ts drizzle/
git commit -m "feat: add latitude, longitude, placeId, photoUrl to stores table"
```

---

### Task 3: Create the Google Places server action

**Files:**
- Create: `src/lib/places.ts`

**Step 1: Create the Places API integration**

Create `src/lib/places.ts`:

```typescript
"use server";

import { db } from "@/db";
import { stores } from "@/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!;

const SEARCH_QUERIES = [
  "Pokemon cards",
  "trading card store",
  "game store",
  "GameStop",
  "Target",
  "Walmart",
  "Barnes Noble",
];

// Map Google Places types to our store types
function mapStoreType(types: string[]): "big_box" | "lgs" | "grocery" | "pharmacy" | "other" {
  const typeSet = new Set(types);
  if (typeSet.has("department_store") || typeSet.has("shopping_mall")) return "big_box";
  if (typeSet.has("grocery_or_supermarket") || typeSet.has("supermarket")) return "grocery";
  if (typeSet.has("pharmacy") || typeSet.has("drugstore")) return "pharmacy";
  if (typeSet.has("store") || typeSet.has("book_store")) return "lgs";
  return "other";
}

interface PlaceResult {
  id: string;
  displayName: { text: string };
  formattedAddress: string;
  location: { latitude: number; longitude: number };
  types: string[];
  photos?: { name: string }[];
}

export async function searchNearbyStores(lat: number, lng: number, radius: number = 8000) {
  // First get existing stores in the area from DB
  const margin = radius / 111000; // rough degrees
  const existingStores = await db
    .select()
    .from(stores)
    .where(
      and(
        gte(stores.latitude, lat - margin),
        lte(stores.latitude, lat + margin),
        gte(stores.longitude, lng - margin),
        lte(stores.longitude, lng + margin)
      )
    );

  // If we already have stores in this area, return them without hitting the API
  if (existingStores.length > 5) {
    return existingStores;
  }

  // Search Places API for stores in this area
  const newPlaces: PlaceResult[] = [];

  // Use Places API (New) text search
  for (const query of SEARCH_QUERIES.slice(0, 3)) {
    try {
      const response = await fetch(
        "https://places.googleapis.com/v1/places:searchText",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
            "X-Goog-FieldMask":
              "places.id,places.displayName,places.formattedAddress,places.location,places.types,places.photos",
          },
          body: JSON.stringify({
            textQuery: query,
            locationBias: {
              circle: {
                center: { latitude: lat, longitude: lng },
                radius: radius,
              },
            },
            maxResultCount: 10,
          }),
        }
      );

      if (!response.ok) continue;
      const data = await response.json();
      if (data.places) {
        newPlaces.push(...data.places);
      }
    } catch {
      // Silently continue on API errors
      continue;
    }
  }

  // Deduplicate by placeId
  const uniquePlaces = new Map<string, PlaceResult>();
  for (const place of newPlaces) {
    if (!uniquePlaces.has(place.id)) {
      uniquePlaces.set(place.id, place);
    }
  }

  // Upsert into DB
  for (const place of uniquePlaces.values()) {
    const photoUrl = place.photos?.[0]
      ? `https://places.googleapis.com/v1/${place.photos[0].name}/media?maxHeightPx=200&key=${GOOGLE_MAPS_API_KEY}`
      : null;

    await db
      .insert(stores)
      .values({
        name: place.displayName.text,
        locationLabel: place.formattedAddress,
        storeType: mapStoreType(place.types),
        latitude: place.location.latitude,
        longitude: place.location.longitude,
        placeId: place.id,
        photoUrl: photoUrl,
      })
      .onConflictDoUpdate({
        target: stores.placeId,
        set: {
          name: place.displayName.text,
          locationLabel: place.formattedAddress,
          photoUrl: photoUrl,
        },
      });
  }

  // Return all stores in the area (existing + newly inserted)
  return db
    .select()
    .from(stores)
    .where(
      and(
        gte(stores.latitude, lat - margin),
        lte(stores.latitude, lat + margin),
        gte(stores.longitude, lng - margin),
        lte(stores.longitude, lng + margin)
      )
    );
}

export async function getStoresInBounds(
  south: number,
  west: number,
  north: number,
  east: number
) {
  return db
    .select()
    .from(stores)
    .where(
      and(
        gte(stores.latitude, south),
        lte(stores.latitude, north),
        gte(stores.longitude, west),
        lte(stores.longitude, east)
      )
    );
}
```

**Step 2: Commit**

```bash
git add src/lib/places.ts
git commit -m "feat: add Google Places search and store upsert server action"
```

---

### Task 4: Create the Pokeball marker SVG component

**Files:**
- Create: `src/components/map/pokeball-marker.tsx`

**Step 1: Create the marker component**

Create `src/components/map/pokeball-marker.tsx`:

```tsx
"use client";

import { AdvancedMarker } from "@vis.gl/react-google-maps";
import type { Store } from "@/db/schema";

type MarkerState = "active" | "inactive" | "hot";

function getMarkerState(lastSightingAt: Date | null): MarkerState {
  if (!lastSightingAt) return "inactive";
  const hoursSince = (Date.now() - new Date(lastSightingAt).getTime()) / (1000 * 60 * 60);
  if (hoursSince <= 4) return "hot";
  if (hoursSince <= 48) return "active";
  return "inactive";
}

const markerColors: Record<MarkerState, { top: string; band: string }> = {
  active: { top: "#EF4444", band: "#1F2937" },   // Red pokeball
  inactive: { top: "#9CA3AF", band: "#6B7280" },  // Gray pokeball
  hot: { top: "#D4A843", band: "#92710A" },        // Gold pokeball
};

function PokeballSvg({ state }: { state: MarkerState }) {
  const colors = markerColors[state];
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
      {/* Top half */}
      <path d="M18 2 A16 16 0 0 1 34 18 H22 A4 4 0 0 0 14 18 H2 A16 16 0 0 1 18 2Z" fill={colors.top} />
      {/* Bottom half */}
      <path d="M2 18 H14 A4 4 0 0 0 22 18 H34 A16 16 0 0 1 2 18Z" fill="white" />
      {/* Band */}
      <rect x="2" y="16.5" width="32" height="3" rx="1.5" fill={colors.band} />
      {/* Center circle outer */}
      <circle cx="18" cy="18" r="5" fill={colors.band} />
      {/* Center circle inner */}
      <circle cx="18" cy="18" r="3" fill="white" />
      {/* Outline */}
      <circle cx="18" cy="18" r="17" fill="none" stroke={colors.band} strokeWidth="1" />
      {state === "hot" && (
        <circle cx="18" cy="18" r="17" fill="none" stroke="#D4A843" strokeWidth="2" opacity="0.6">
          <animate attributeName="r" values="17;20;17" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.6;0;0.6" dur="2s" repeatCount="indefinite" />
        </circle>
      )}
    </svg>
  );
}

export function PokeballMarker({
  store,
  lastSightingAt,
  onClick,
}: {
  store: Store;
  lastSightingAt: Date | null;
  onClick: () => void;
}) {
  if (!store.latitude || !store.longitude) return null;

  const state = getMarkerState(lastSightingAt);

  return (
    <AdvancedMarker
      position={{ lat: store.latitude, lng: store.longitude }}
      onClick={onClick}
      title={store.name}
    >
      <div className="cursor-pointer transition-transform hover:scale-110">
        <PokeballSvg state={state} />
      </div>
    </AdvancedMarker>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/map/pokeball-marker.tsx
git commit -m "feat: add Pokeball marker component with activity-based states"
```

---

### Task 5: Create the store detail panel component

**Files:**
- Create: `src/components/map/store-detail-panel.tsx`

**Step 1: Create the panel component**

Create `src/components/map/store-detail-panel.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, MapPin, Clock } from "lucide-react";
import type { Store, Product } from "@/db/schema";
import { MapSightingForm } from "./map-sighting-form";

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
    <div className="absolute bottom-0 left-0 right-0 z-10 max-h-[60vh] overflow-y-auto bg-card rounded-t-2xl shadow-lg border-t border-border/50 md:absolute md:right-4 md:bottom-4 md:left-auto md:w-96 md:rounded-2xl md:border md:max-h-[70vh]">
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
```

**Step 2: Commit**

```bash
git add src/components/map/store-detail-panel.tsx
git commit -m "feat: add store detail panel with sightings and report button"
```

---

### Task 6: Create the inline map sighting form

**Files:**
- Create: `src/components/map/map-sighting-form.tsx`
- Modify: `src/app/dashboard/submit/actions.ts:66-68` (add revalidation for map path)

**Step 1: Create the inline form component**

Create `src/components/map/map-sighting-form.tsx`:

```tsx
"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { submitTip } from "@/app/dashboard/submit/actions";
import type { Product } from "@/db/schema";

export function MapSightingForm({
  storeId,
  products,
  onCancel,
}: {
  storeId: string;
  products: Product[];
  onCancel: () => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(formData: FormData) {
    formData.set("storeId", storeId);
    await submitTip(formData);
    formRef.current?.reset();
    onCancel();
  }

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-3">
      <h4 className="text-sm font-semibold">Report Sighting</h4>

      <input type="hidden" name="storeId" value={storeId} />

      <div>
        <Label htmlFor="map-productId" className="text-xs">Product</Label>
        <Select name="productId" required>
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Select a product" />
          </SelectTrigger>
          <SelectContent>
            {products.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="map-status" className="text-xs">Stock Status</Label>
        <Select name="status" required>
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="found">Yes — Found cards!</SelectItem>
            <SelectItem value="not_found">No — Shelves were empty</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="map-sightedAt" className="text-xs">When</Label>
        <Input
          type="datetime-local"
          name="sightedAt"
          id="map-sightedAt"
          className="h-9"
          required
          defaultValue={new Date().toISOString().slice(0, 16)}
        />
      </div>

      <div>
        <Label htmlFor="map-notes" className="text-xs">Notes (optional)</Label>
        <Textarea name="notes" id="map-notes" rows={2} className="text-sm" />
      </div>

      <div className="flex gap-2">
        <Button type="submit" variant="accent" size="sm" className="flex-1">
          Submit
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
```

**Step 2: Update submitTip to revalidate the map page**

In `src/app/dashboard/submit/actions.ts`, add at the end of the `submitTip` function (after the existing `revalidatePath` calls):

```typescript
  revalidatePath("/dashboard/map");
```

Wait — the map IS `/dashboard` now. The existing `revalidatePath("/dashboard")` already covers it. No change needed.

**Step 3: Commit**

```bash
git add src/components/map/map-sighting-form.tsx
git commit -m "feat: add inline map sighting form for reporting from store panel"
```

---

### Task 7: Create the main map page component

**Files:**
- Create: `src/components/map/store-map.tsx`

**Step 1: Create the map client component**

This is the main client component that ties together the Google Map, markers, and panels.

Create `src/components/map/store-map.tsx`:

```tsx
"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { APIProvider, Map, useMap } from "@vis.gl/react-google-maps";
import { PokeballMarker } from "./pokeball-marker";
import { StoreDetailPanel } from "./store-detail-panel";
import { searchNearbyStores, getStoresInBounds } from "@/lib/places";
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

// Default center (US center) if no geolocation
const DEFAULT_CENTER = { lat: 39.8283, lng: -98.5795 };
const DEFAULT_ZOOM = 4;
const LOCATED_ZOOM = 13;

function MapContent({
  initialStores,
  products,
}: {
  initialStores: StoreWithSightings[];
  products: Product[];
}) {
  const map = useMap();
  const [storeData, setStoreData] = useState<StoreWithSightings[]>(initialStores);
  const [selectedStore, setSelectedStore] = useState<StoreWithSightings | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const lastSearchCenter = useRef<{ lat: number; lng: number } | null>(null);

  // Request user geolocation on mount
  useEffect(() => {
    // Check localStorage for cached location
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
        // Trigger store search at user location
        handleSearchArea(loc.lat, loc.lng);
      },
      () => {
        setLocationDenied(true);
      }
    );
  }, [map]);

  const handleSearchArea = useCallback(
    async (lat: number, lng: number) => {
      // Don't re-search if center hasn't moved significantly
      if (lastSearchCenter.current) {
        const dist = Math.abs(lat - lastSearchCenter.current.lat) + Math.abs(lng - lastSearchCenter.current.lng);
        if (dist < 0.05) return;
      }
      lastSearchCenter.current = { lat, lng };

      const newStores = await searchNearbyStores(lat, lng);
      // Merge with existing data — the server returns Store objects,
      // we need to wrap them in StoreWithSightings format.
      // For newly discovered stores, sightings will be empty.
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

  // Handle map idle (pan/zoom finished) — load stores in view
  const handleIdle = useCallback(() => {
    if (!map) return;
    const center = map.getCenter();
    if (center) {
      handleSearchArea(center.lat(), center.lng());
    }
  }, [map, handleSearchArea]);

  useEffect(() => {
    if (!map) return;
    const listener = map.addListener("idle", handleIdle);
    return () => listener.remove();
  }, [map, handleIdle]);

  const handleRecenter = () => {
    if (userLocation && map) {
      map.panTo(userLocation);
      map.setZoom(LOCATED_ZOOM);
    }
  };

  const handleCitySearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || !map) return;

    // Use geocoding to convert city name to coordinates
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
      <Map
        defaultCenter={userLocation || DEFAULT_CENTER}
        defaultZoom={userLocation ? LOCATED_ZOOM : DEFAULT_ZOOM}
        mapId="store-map"
        gestureHandling="greedy"
        disableDefaultUI={true}
        zoomControl={true}
        className="w-full h-full"
      >
        {/* User location dot */}
        {userLocation && (
          <AdvancedMarkerUserDot lat={userLocation.lat} lng={userLocation.lng} />
        )}

        {/* Store markers */}
        {storeData.map((sd) => (
          <PokeballMarker
            key={sd.store.id}
            store={sd.store}
            lastSightingAt={sd.lastSightingAt}
            onClick={() => setSelectedStore(sd)}
          />
        ))}
      </Map>

      {/* Search bar (shown when location denied or always as overlay) */}
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

      {/* Recenter button */}
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

      {/* Store detail panel */}
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

// Pulsing blue dot for user location
function AdvancedMarkerUserDot({ lat, lng }: { lat: number; lng: number }) {
  const { AdvancedMarker } = require("@vis.gl/react-google-maps");
  return (
    <AdvancedMarker position={{ lat, lng }}>
      <div className="relative">
        <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-md" />
        <div className="absolute inset-0 w-4 h-4 bg-blue-500 rounded-full animate-ping opacity-40" />
      </div>
    </AdvancedMarker>
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
```

**Note:** The `AdvancedMarkerUserDot` uses a dynamic require to avoid import duplication. The actual implementation may need adjustment — if the `AdvancedMarker` import doesn't work via require, change it to a top-level import and use it directly. Test it.

**Step 2: Commit**

```bash
git add src/components/map/store-map.tsx
git commit -m "feat: add main StoreMap component with geolocation, search, and markers"
```

---

### Task 8: Create the server action for fetching store sighting data

**Files:**
- Create: `src/app/dashboard/actions.ts`

**Step 1: Create the data-fetching action**

Create `src/app/dashboard/actions.ts`:

```typescript
"use server";

import { db } from "@/db";
import { stores, restockSightings, products } from "@/db/schema";
import { eq, desc, gte, and, isNotNull } from "drizzle-orm";

export async function getStoresWithSightings() {
  const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

  // Get all stores that have coordinates
  const allStores = await db
    .select()
    .from(stores)
    .where(
      and(isNotNull(stores.latitude), isNotNull(stores.longitude))
    );

  // Get recent sightings grouped by store
  const recentSightings = await db
    .select({
      id: restockSightings.id,
      storeId: restockSightings.storeId,
      productName: products.name,
      status: restockSightings.status,
      sightedAt: restockSightings.sightedAt,
      verified: restockSightings.verified,
    })
    .from(restockSightings)
    .innerJoin(products, eq(restockSightings.productId, products.id))
    .where(gte(restockSightings.sightedAt, fortyEightHoursAgo))
    .orderBy(desc(restockSightings.sightedAt));

  // Group sightings by store
  const sightingsByStore = new Map<string, typeof recentSightings>();
  for (const s of recentSightings) {
    const existing = sightingsByStore.get(s.storeId) ?? [];
    existing.push(s);
    sightingsByStore.set(s.storeId, existing);
  }

  return allStores.map((store) => {
    const storeSightings = sightingsByStore.get(store.id) ?? [];
    return {
      store,
      lastSightingAt: storeSightings.length > 0 ? storeSightings[0].sightedAt : null,
      sightings: storeSightings.map((s) => ({
        id: s.id,
        productName: s.productName,
        status: s.status,
        sightedAt: s.sightedAt,
        verified: s.verified,
      })),
    };
  });
}
```

**Step 2: Commit**

```bash
git add src/app/dashboard/actions.ts
git commit -m "feat: add getStoresWithSightings server action for map data"
```

---

### Task 9: Move current dashboard to /dashboard/sightings and create new map dashboard

**Files:**
- Move: `src/app/dashboard/page.tsx` → `src/app/dashboard/sightings/page.tsx`
- Create: `src/app/dashboard/page.tsx` (new map page)
- Modify: `src/components/dashboard-nav.tsx:7-15` (update nav links)

**Step 1: Move the sightings page**

```bash
mkdir -p src/app/dashboard/sightings
mv src/app/dashboard/page.tsx src/app/dashboard/sightings/page.tsx
```

**Step 2: Create the new map dashboard page**

Create `src/app/dashboard/page.tsx`:

```tsx
import { StoreMap } from "@/components/map/store-map";
import { getStoresWithSightings } from "./actions";
import { db } from "@/db";
import { products } from "@/db/schema";

export default async function MapPage() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-muted-foreground">
        Google Maps API key not configured. Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your environment.
      </div>
    );
  }

  const [storesWithSightings, allProducts] = await Promise.all([
    getStoresWithSightings(),
    db.select().from(products),
  ]);

  return <StoreMap initialStores={storesWithSightings} products={allProducts} apiKey={apiKey} />;
}
```

**Step 3: Update the dashboard nav**

In `src/components/dashboard-nav.tsx`, update the `links` array:

```typescript
const links = [
  { href: "/dashboard", label: "Map" },
  { href: "/dashboard/sightings", label: "Sightings" },
  { href: "/dashboard/products", label: "Products" },
  { href: "/dashboard/submit", label: "Submit Tip" },
  { href: "/dashboard/collection", label: "Collection" },
  { href: "/dashboard/leaderboard", label: "Leaderboard" },
  { href: "/dashboard/heatmap", label: "Heatmap", premium: true },
  { href: "/dashboard/alerts", label: "Alerts", premium: true },
];
```

**Step 4: Commit**

```bash
git add src/app/dashboard/page.tsx src/app/dashboard/sightings/page.tsx src/components/dashboard-nav.tsx
git commit -m "feat: map becomes dashboard home, sightings table moves to /dashboard/sightings"
```

---

### Task 10: Update the dashboard layout for the map page

**Files:**
- Modify: `src/app/dashboard/layout.tsx:1-21`

**Step 1: Update the layout**

The map page needs a full-screen layout without the container padding. Update `src/app/dashboard/layout.tsx`:

```tsx
import { requireUser } from "@/lib/auth";
import { SiteHeader } from "@/components/site-header";
import { DashboardNav } from "@/components/dashboard-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <div className="px-4 pt-4">
        <DashboardNav isPremium={user.subscriptionTier === "premium"} />
      </div>
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}
```

The map page (`/dashboard`) renders full-width. Subpages like `/dashboard/sightings` will need their own container. Add a wrapping `<div className="container mx-auto py-4 px-4">` inside the sightings page if it doesn't look right.

**Step 2: Commit**

```bash
git add src/app/dashboard/layout.tsx
git commit -m "feat: update dashboard layout for full-width map support"
```

---

### Task 11: Add auth-based redirect from root to dashboard

**Files:**
- Modify: `src/app/page.tsx:1-10` (add auth check and redirect)

**Step 1: Add auth redirect to the landing page**

In `src/app/page.tsx`, add an auth check at the top of the component. Import `auth` from Clerk and `redirect` from Next.js:

```tsx
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { db } from "@/db";
import { restockSightings, stores, products } from "@/db/schema";
import { desc, eq, and, gte } from "drizzle-orm";

export default async function LandingPage() {
  const { userId } = await auth();
  if (userId) {
    redirect("/dashboard");
  }

  const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
  // ... rest of the existing code unchanged
```

**Step 2: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: redirect logged-in users from landing page to dashboard map"
```

---

### Task 12: Add the pulsing location dot CSS animation

**Files:**
- Modify: `src/app/globals.css:199` (add after existing utilities)

**Step 1: Add the user location pulse animation**

The `animate-ping` utility from Tailwind handles the blue dot pulsing. No additional CSS needed — Tailwind already includes it. Verify this works when testing.

If needed, add a custom `map-pulse` animation in `globals.css`:

```css
  .user-location-pulse {
    animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
  }
```

This step may be a no-op if Tailwind's `animate-ping` works. Skip the commit if no changes.

---

### Task 13: Build and verify

**Step 1: Run the build**

Run: `npm run build`
Expected: Build succeeds with no TypeScript errors.

**Step 2: Fix any issues**

Address any type errors, missing imports, or build failures. Common things to check:
- `AdvancedMarker` import in `pokeball-marker.tsx` — may need `import { AdvancedMarker } from "@vis.gl/react-google-maps"`
- The `AdvancedMarkerUserDot` in `store-map.tsx` — replace the `require` with a proper import
- Any type mismatches between server action return types and client component props
- The `google.maps.Geocoder` usage requires `@types/google.maps` — install if needed: `npm install -D @types/google.maps`

**Step 3: Commit fixes**

```bash
git add -A
git commit -m "fix: resolve build errors in map implementation"
```

---

### Task 14: Manual smoke test

**Step 1: Start dev server**

Run: `npm run dev`

**Step 2: Test the flow**

1. Visit `/` while logged out → should see marketing page
2. Visit `/` while logged in → should redirect to `/dashboard` (map)
3. Map should load and request geolocation
4. If geolocation granted, map centers on user location and Pokeball markers appear
5. If denied, search bar appears — type a city and search
6. Click a Pokeball marker → store detail panel slides up
7. Click "Report Sighting" → inline form appears
8. Fill and submit → form closes, egg created (check `/dashboard/collection`)
9. Nav links all work: Map, Sightings, Products, Submit Tip, Collection, Leaderboard
10. `/dashboard/sightings` shows the old sightings table

**Step 3: Final commit if needed**

```bash
git add -A
git commit -m "fix: map smoke test adjustments"
```
