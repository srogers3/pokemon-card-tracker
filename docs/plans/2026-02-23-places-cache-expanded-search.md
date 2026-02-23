# Places API Cache & Expanded Store Search Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Cache Google Places API searches per geographic grid cell so each area is only queried once, and expand search queries to cover all major Pokemon card retailers.

**Architecture:** Add a `search_cache` table that tracks searched grid cells. On search, check cache first — hit returns DB stores, miss fires all 11 queries then inserts cache entry. Grid cells are ~5km squares (0.05 degree rounding).

**Tech Stack:** Drizzle ORM, Neon Postgres, Google Places API v1 (Text Search)

---

### Task 1: Add `searchCache` table to schema

**Files:**
- Modify: `src/db/schema.ts` (add new table after `pokemonEggs` table, around line 173)

**Step 1: Add the search_cache table definition**

Add after the `pokemonEggs` table and before the type exports:

```typescript
export const searchCache = pgTable("search_cache", {
  id: uuid("id").defaultRandom().primaryKey(),
  gridLat: doublePrecision("grid_lat").notNull(),
  gridLng: doublePrecision("grid_lng").notNull(),
  searchedAt: timestamp("searched_at").defaultNow().notNull(),
}, (table) => [
  {
    name: "search_cache_grid_unique",
    columns: [table.gridLat, table.gridLng],
    unique: true,
  },
]);
```

**Step 2: Add type exports**

Add alongside the other type exports at the bottom of the file:

```typescript
export type SearchCache = typeof searchCache.$inferSelect;
```

**Step 3: Commit**

```bash
git add src/db/schema.ts
git commit -m "feat: add search_cache table to schema"
```

---

### Task 2: Generate and run the migration

**Step 1: Generate the migration**

Run: `npm run db:generate`

This creates a new SQL migration file in `drizzle/` for the `search_cache` table.

**Step 2: Verify the generated SQL**

Read the new migration file in `drizzle/` and confirm it creates the `search_cache` table with the unique constraint on `(grid_lat, grid_lng)`.

**Step 3: Run the migration**

Run: `npm run db:migrate`

Expected: "Migration complete"

**Step 4: Commit**

```bash
git add drizzle/
git commit -m "chore: add search_cache migration"
```

---

### Task 3: Update `places.ts` — expand search queries and add cache logic

**Files:**
- Modify: `src/lib/places.ts` (the entire search logic)

**Step 1: Update imports**

Add `searchCache` to the schema import and add `eq` to the drizzle-orm import at the top of the file:

```typescript
import { stores, searchCache } from "@/db/schema";
import { and, gte, lte, eq } from "drizzle-orm";
```

**Step 2: Replace SEARCH_QUERIES array (lines 10-18)**

Replace the existing array with:

```typescript
const SEARCH_QUERIES = [
  // Generic searches
  "Pokemon cards",
  "trading card store",
  "game store",
  // Known retailers
  "GameStop",
  "Target",
  "Walmart",
  "Barnes Noble",
  "Dollar General",
  "Dollar Tree",
  "Five Below",
  "Walgreens",
  "CVS",
];
```

**Step 3: Add grid rounding helper**

Add after `mapStoreType` function (after line 50):

```typescript
function toGridCell(lat: number, lng: number): { gridLat: number; gridLng: number } {
  return {
    gridLat: Math.round(lat / 0.05) * 0.05,
    gridLng: Math.round(lng / 0.05) * 0.05,
  };
}
```

**Step 4: Rewrite `searchNearbyStores` function (lines 61-168)**

Replace the entire function with:

```typescript
export async function searchNearbyStores(lat: number, lng: number, radius: number = 8000) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const margin = radius / 111000;
  const { gridLat, gridLng } = toGridCell(lat, lng);

  // Check if this grid cell has already been searched
  const cached = await db
    .select()
    .from(searchCache)
    .where(and(eq(searchCache.gridLat, gridLat), eq(searchCache.gridLng, gridLng)))
    .limit(1);

  if (cached.length > 0) {
    // Cache hit — return stores from DB
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

  // Cache miss — query Places API for all search terms
  const newPlaces: PlaceResult[] = [];

  for (const query of SEARCH_QUERIES) {
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
            "Referer": process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
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

      if (!response.ok) {
        continue;
      }
      const data = await response.json();
      if (data.places) {
        newPlaces.push(...data.places);
      }
    } catch {
      continue;
    }
  }

  // Deduplicate by place ID
  const uniquePlaces = new Map<string, PlaceResult>();
  for (const place of newPlaces) {
    if (!uniquePlaces.has(place.id)) {
      uniquePlaces.set(place.id, place);
    }
  }

  // Upsert stores
  for (const place of uniquePlaces.values()) {
    if (!isLikelyRetailStore(place.types)) continue;

    const photoUrl = place.photos?.[0]?.name ?? null;

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

  // Mark this grid cell as searched
  await db
    .insert(searchCache)
    .values({ gridLat, gridLng })
    .onConflictDoNothing();

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
```

**Step 5: Commit**

```bash
git add src/lib/places.ts
git commit -m "feat: add grid-based search cache and expand store queries"
```

---

### Task 4: Build verification

**Step 1: Run the build**

Run: `npm run build`

Expected: Build succeeds with no type errors.

**Step 2: If build fails, fix any type errors**

Common issues to check:
- The unique constraint syntax for drizzle — may need to use `uniqueIndex` import instead of inline object
- The `eq` import from drizzle-orm

**Step 3: Commit any fixes**

```bash
git add -A
git commit -m "fix: address build errors in search cache implementation"
```
