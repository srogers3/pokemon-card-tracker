# Places API Cache & Expanded Store Search Design

## Overview

Add a persistent cache for Google Places API searches and expand search queries to cover all known Pokemon card retailers (Dollar General, Dollar Tree, Walgreens, CVS, Five Below, etc.). The cache ensures each geographic area is only searched once — all subsequent requests are served from the DB with zero API calls.

## Problem

- Current search uses only 3 generic queries ("Pokemon cards", "trading card store", "game store") due to `slice(0, 3)`
- Misses many retailers that sell Pokemon cards but aren't primarily game stores
- No time-based caching — the only "cache" is a heuristic check for >5 existing stores in the radius
- Every map pan to a new area triggers 3 API calls, with no way to know if the area was already searched

## Approach

Database `search_cache` table. Persistent, shared across all users, survives serverless cold starts.

## Schema Changes

### New table: `search_cache`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, default random |
| gridLat | double | Latitude rounded to nearest 0.05 (~5km) |
| gridLng | double | Longitude rounded to nearest 0.05 (~5km) |
| searchedAt | timestamp | When this cell was last queried |

- Unique constraint on `(gridLat, gridLng)`
- No TTL — cache is permanent until manually refreshed

### No changes to `stores` table

Stores continue to be upserted by `placeId` as they are today.

## Expanded Search Queries

### Generic searches (cast a wide net)
- `"Pokemon cards"`
- `"trading card store"`
- `"game store"`

### Known retailers (specific store names)
- `"GameStop"`
- `"Target"`
- `"Walmart"`
- `"Barnes Noble"`
- `"Dollar General"`
- `"Dollar Tree"`
- `"Five Below"`
- `"Walgreens"`
- `"CVS"`

**11 queries total.** The `slice(0, 3)` limit is removed entirely.

## Updated Search Logic

1. Round user's lat/lng to grid cell (nearest 0.05)
2. Check `search_cache` for that grid cell
3. **Cache hit** → return stores from DB (zero API calls)
4. **Cache miss** → run all 11 queries, upsert stores, insert `search_cache` entry
5. Return stores from DB

The old `existingStores.length > 5` heuristic is replaced entirely by the cache table lookup.

## Unchanged

- `isLikelyRetailStore()` filter — still excludes churches, hospitals, etc.
- `mapStoreType()` classification — still categorizes stores as big_box, lgs, grocery, pharmacy, other
- Store deduplication by `placeId`
- Photo resource name storage (not full URLs)
- Map UI, markers, store detail panel — no frontend changes

## Store Type Classification Update

`mapStoreType` may need a `"dollar"` or `"discount"` category for Dollar General/Dollar Tree/Five Below, or they can fall into `"other"`. Current categories: big_box, lgs, grocery, pharmacy, other. No schema enum change needed since `"other"` covers it.

## Future Considerations

- Admin "force refresh" action to re-query a cached area
- TTL-based refresh if store data becomes too stale
- Additional retailer queries as new stores start carrying cards
