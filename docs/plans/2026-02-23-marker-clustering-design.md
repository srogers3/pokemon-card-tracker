# Marker Clustering with Pokeball Icons Design

## Problem

When many stores are close together, sprite markers overlap and become unreadable. Need clustering that groups nearby markers and shows them individually when zoomed in enough.

## Design

### Library

`@googlemaps/markerclusterer` — Google's official clustering library. Handles cluster lifecycle, zoom transitions, and click-to-zoom. Uses a custom `Renderer` to control cluster marker appearance.

### Cluster Tiers

| Count | Ball        | Visual                          |
|-------|-------------|---------------------------------|
| 2     | Pokeball    | Red top / white bottom, classic |
| 3-5   | Great Ball  | Blue top / red stripe           |
| 6+    | Ultra Ball  | Black top / yellow accent       |

### Cluster Marker Appearance

- Frosted glass circle (matching sprite markers) — 56px diameter
- Pokeball tier icon centered inside (~28px)
- Count badge in bottom-right corner — small teal circle with white bold number

### Behavior

- Zoomed out: clusters show Pokeball tier icon + count badge
- Zoom in: clusters split into individual sprite markers
- Click a cluster: map zooms to fit the contained markers
- Selected sprite is excluded from clustering — always visible

### Files

- **Install:** `@googlemaps/markerclusterer`
- **Create:** `src/components/map/cluster-renderer.ts` — custom Renderer class with Pokeball SVGs and frosted glass styling
- **Modify:** `src/components/map/pokeball-marker.tsx` — add `setMarkerRef` callback prop to expose AdvancedMarker ref
- **Modify:** `src/components/map/store-map.tsx` — collect marker refs, create MarkerClusterer instance, exclude selected marker from clustering

### Pokeball SVGs

Inline SVG data URIs for the three ball types. Simple flat designs — red/white split for Pokeball, blue/red for Great Ball, black/yellow for Ultra Ball. Each is a circle with a horizontal line through the middle and a small circle at center.
