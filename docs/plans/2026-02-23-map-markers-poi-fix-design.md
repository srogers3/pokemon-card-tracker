# Fix Map Markers & Hide Default POIs

**Date:** 2026-02-23
**Status:** Approved

## Problem

1. Custom Pokeball markers are not rendering — `AdvancedMarker` with custom SVG children requires a valid Map ID configured in Google Cloud Console. The hardcoded `mapId="store-map"` doesn't exist there.
2. Default Google Maps POI labels (churches, restaurants, etc.) clutter the map. Inline `styles` to hide them are ignored when `mapId` is set.
3. Google Places API returns irrelevant places (churches, schools) for broad queries like "game store".

## Solution: Approach A (Self-contained, no Cloud Console dependency)

### 1. `store-map.tsx` — Remove Map ID, add inline styles

- Remove `mapId="store-map"` from `GoogleMap`
- Add JSON map styles to suppress default POI labels/icons
- Keep roads, transit, and landscape visible

### 2. `pokeball-marker.tsx` — Switch to Marker with SVG data URLs

- Replace `AdvancedMarker` with `Marker`
- Convert Pokeball SVG into data URL icons (hot/active/inactive states)
- Lose hover animation but retain visual state differentiation via color

### 3. `places.ts` — Filter out irrelevant place types

- Add exclusion list for non-retail place types (churches, schools, hospitals, parks, etc.)
- Filter results after API fetch, before database upsert

### What stays the same

- Store search queries and logic
- Store detail panel, sighting form
- User location blue dot
- All map interactions (pan, zoom, search, recenter)
