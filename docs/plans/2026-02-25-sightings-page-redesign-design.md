# Sightings Page Redesign

**Date:** 2026-02-25
**Approach:** Two-Tab Card Feed

## Problem

The current `/dashboard/sightings` page has several issues:
1. **Bug:** `innerJoin` on products excludes all "not found" sightings (null productId)
2. **Bug:** `verified: true` filter hides unverified test/community submissions
3. **Not mobile-friendly:** Table layout doesn't work on small screens
4. **Lacks location awareness:** No "near you" functionality
5. **Minimal information:** Missing reporter name, verified status, relative timestamps

## Design

### Page Structure

Replace the current server-only table with a client component wrapper containing two tabs:

- **"Near You"** — sightings within 25 miles of user's GPS location
- **"All Recent"** — global sightings feed

Both tabs use the same card-based layout. Free users see last 48h (50 max), premium users see full history (200 max).

### Card Design

Each sighting renders as a compact card:

- **Header row:** Store name (bold) + relative time ("2h ago", "Yesterday")
- **Status badge:** Green "Found" or red "Not Found", positioned top-right
- **Product line:** Product name if status=found, omitted for not_found reports
- **Location:** Store location label
- **Notes:** Optional, muted italic, truncated to 2 lines
- **Footer:** Reporter display name + verified checkmark icon if verified

Visual treatment:
- shadcn Card with left-border color accent (green=found, red=not found)
- Single column on mobile, 2-column grid on md: breakpoint
- Compact padding on mobile

### Tab Bar

- Two pill-style tabs using shadcn Tabs component
- "Near You" with location dot icon, "All Recent" with globe icon
- Sticky at top when scrolling

### Empty States

- GPS denied: "Enable location to see sightings near you" + retry button
- No nearby results: "No recent sightings nearby. Be the first to report!"
- No global results: "No sightings yet."

### Premium Upsell

Subtle card at bottom for free users (existing behavior, restyled to match cards).

## Data Flow

### New Server Actions (`src/app/dashboard/sightings/actions.ts`)

**`getNearbySightings(lat, lng, isPremium)`**
- Fetch stores, filter by distance in JS (25-mile radius)
- leftJoin sightings on products (fixes null productId bug)
- Join users table for reporter displayName
- Time filter: 48h free, unlimited premium
- Limit: 50 free, 200 premium

**`getRecentSightings(isPremium)`**
- Global query, no location filter
- Same joins, shape, and filters as above

### Query Fixes

- `innerJoin` on products changed to `leftJoin` — includes "not found" reports
- `verified: true` filter removed — all sightings shown, verified ones get checkmark badge
- Join on `users` table to get reporter `displayName`

### Client Component

`SightingsPageClient` handles:
- GPS request via `navigator.geolocation` on mount
- Tab state management
- Calling server actions with location data
- Loading skeletons while fetching
- Graceful GPS denial fallback

## Files Changed

- `src/app/dashboard/sightings/page.tsx` — slim server component wrapper (auth + premium check)
- `src/app/dashboard/sightings/actions.ts` — new file with server actions
- `src/components/sightings-feed.tsx` — new client component (tabs + card feed)
- `src/components/sighting-card.tsx` — new card component

## No Schema Changes

No database migrations needed. Only query changes (leftJoin, remove verified filter, add users join).
