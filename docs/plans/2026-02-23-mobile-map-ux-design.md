# Mobile Map UX Improvements

## Problem

On mobile, the map view has several UX issues:
1. Tapping a Pokemon sprite marker doesn't center the map on the store
2. The store detail bottom sheet can overflow and obscure content
3. The horizontal subnav tabs consume too much vertical space on mobile, reducing map visibility

## Design

### A. Center map on sprite tap

When a marker is clicked in `store-map.tsx`:
- Call `map.panTo({ lat, lng })` for the tapped store
- Follow with `map.panBy(0, -150)` to offset the marker upward so it's visible above the bottom panel

### B. Mobile hamburger navigation

**`site-header.tsx`:**
- Add a hamburger menu button visible only on mobile (`md:hidden`)
- Accept `isPremium` prop to filter premium links
- On click, render a dropdown overlay with the dashboard nav links in a vertical list
- Use `Menu` / `X` icons from lucide-react
- Close on link click or outside click

**`dashboard-nav.tsx`:**
- Add `hidden md:flex` to the nav element so it's desktop-only

**`dashboard/layout.tsx`:**
- Hide the nav wrapper `div` on mobile (`hidden md:block`)
- Pass `isPremium` to `SiteHeader`

### C. Compact store detail panel

**`store-detail-panel.tsx`:**
- Mobile: `max-h-[40vh]` by default (down from 60vh)
- When the report form is open, expand to `max-h-[70vh]`
- Add `transition-all duration-300` for smooth height change
- Desktop stays at `md:max-h-[70vh]`

### D. Map height

The map uses `h-[calc(100vh-64px)]`. With the nav hidden on mobile, this is correct. The flex-1 parent already handles the remaining space. No changes needed unless the nav wrapper padding causes issues — if so, conditionally hide the wrapper on mobile.
