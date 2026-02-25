# Proximity Check for Sighting Submissions

## Summary

Require users to be within 800 meters of a store to submit a sighting report. All submissions funneled through the map interface. Environment variable override for testing.

## Decisions

- **Radius:** 0.5 miles (~800m)
- **Enforcement:** Server-side (Haversine distance in `submitTip`), with client-side UX gating
- **Override:** `BYPASS_PROXIMITY_CHECK=true` env var skips the check entirely
- **Dashboard form:** Removed. All community submissions go through the map sighting form
- **Admin sightings:** Unaffected (no proximity check)

## Server Action Changes

`submitTip` in `src/app/dashboard/submit/actions.ts`:

- Accept `userLatitude` and `userLongitude` fields (required unless bypass active)
- Fetch store lat/lng from DB
- Calculate Haversine distance; reject if > 800m
- Skip check when `BYPASS_PROXIMITY_CHECK=true`

## Distance Utility

Add `getDistanceMeters(lat1, lng1, lat2, lng2)` to `src/lib/utils.ts`. Standard Haversine formula returning distance in meters.

## Client UX Changes

`src/components/map/map-sighting-form.tsx`:

- Check user's geolocation against store location before showing the report form
- If too far: display message "You need to be near this store to submit a report"
- If geolocation unavailable/denied: explain location is required
- Pass coordinates as hidden form fields on submission

## Removals

- `src/app/dashboard/submit/` (page + actions)
- `src/components/community-tip-form.tsx`
- Navigation links to dashboard submit page (redirect to map)

## Unchanged

- Admin sighting creation (`createAdminSighting`)
- Map geolocation flow (already exists, just read from it)
- Store schema (already has lat/lng)
- Sighting schema (user coordinates not persisted)
