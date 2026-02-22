# Store Map Design

## Overview

Add a Pokemon Go-inspired interactive map as the primary logged-in experience. Users discover nearby stores selling Pokemon cards, view recent restock activity, and submit sighting reports directly from the map.

## Approach

Google Maps JavaScript API via `@vis.gl/react-google-maps` + Google Places API (New) for store discovery. Stores are upserted into the DB as users explore different areas, building the store catalog organically.

## Architecture & Data Model

### New Dependencies

- `@vis.gl/react-google-maps` - Google's official React wrapper
- Google Cloud API key with Maps JavaScript API + Places API (New) enabled

### Schema Changes (`stores` table)

Add columns:
- `latitude` (double, nullable) - GPS latitude
- `longitude` (double, nullable) - GPS longitude
- `placeId` (text, nullable, unique) - Google Places ID for deduplication
- `photoUrl` (text, nullable) - Store photo from Places API

Keep existing `locationLabel` and `specificLocation` for display.

### New Server Action

- `searchNearbyStores(lat, lng, radius)` - calls Google Places API for relevant store types, upserts results into `stores` table by `placeId`, returns store list
- Search queries: "Pokemon cards", "trading card store", "GameStop", "Target", "Walmart", "Barnes Noble", "card shop"

### User Geolocation

- Browser `navigator.geolocation` on page load
- Fallback: search bar to enter city/zip
- Cache last-known location in localStorage for faster reload

## Routing & Page Flow

### Auth-based Root Redirect

- `/` when **not logged in** → existing marketing/signup page (no change)
- `/` when **logged in** → redirect to `/dashboard` (the map)

### Dashboard Restructure

- `/dashboard` → **Map page** (new, full-screen map)
- `/dashboard/sightings` → current sightings table (moved from `/dashboard`)
- Nav order: Map | Sightings | Submit | Collection | Leaderboard

## Map UI

### Map Component

- Full-screen Google Map taking most of the viewport
- User location shown as pulsing blue dot
- "Recenter" button to snap back to user's location

### Pokeball Markers

Custom SVG markers shaped like Pokeballs with activity-based states:
- **Red/white Pokeball** - store has recent sightings (last 48h)
- **Gray Pokeball** - store exists but no recent activity
- **Gold Pokeball** - store has a verified hot tip right now
- Marker clustering when zoomed out (grouped into number badges)

### Store Detail Panel

Bottom sheet / side panel that slides up on pin tap:
- Store name, address, type
- Recent sightings list (last few tips with timestamps)
- "Report Sighting" button
- Quick stats: total tips, last verified sighting time

### Inline Sighting Report

- Form appears in the store detail panel (no page navigation)
- Fields: product select, notes, datetime
- Submitting still creates a Pokemon egg (no gamification changes)

## Google Places Integration

### Store Discovery Flow

1. Map loads → query DB for stores with coordinates in visible bounds
2. If user pans to new area → server action calls Places API for nearby stores
3. Results upserted into `stores` table by `placeId`
4. New markers appear on map

### Caching & Rate Limiting

- Cache Places results per geographic region to avoid re-querying same areas
- Debounce searches on map pan (only trigger on significant movement)
- Server-side rate limiting to stay within free tier

### Existing Store Migration

One-time migration script to geocode existing stores using `locationLabel` to populate lat/lng.

## Error Handling

- **Geolocation denied**: Show search bar for city/zip, banner prompting to enable location
- **No stores in area**: Friendly empty state, suggest zooming out
- **API failures**: Existing DB stores still render, Places failures fail silently, toast on submission errors
- **Mobile**: Bottom sheet pattern, touch-friendly map, responsive panel sizing
