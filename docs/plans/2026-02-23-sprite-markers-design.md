# Enhanced Sprite Markers Design

## Problem

Map markers are plain sprite images with no visual context. Users can't distinguish rarity at a glance, markers feel static, and there's no visual feedback when selecting one.

## Design

### Switch to AdvancedMarker

Replace the basic Google Maps `Marker` (static image icon) with `AdvancedMarker` from `@vis.gl/react-google-maps`. This renders custom React/HTML content on the map, enabling CSS styling and animations.

**Requirement:** AdvancedMarker requires a Map ID from Google Cloud Console. The map component needs a `mapId` prop.

### Marker Structure

Each marker renders a circular container with the sprite inside:

```
<AdvancedMarker position={...} onClick={...}>
  <div class="marker-circle">  -- white bg, rarity border, bob animation
    <img src={spriteUrl} />     -- Pokemon sprite
  </div>
</AdvancedMarker>
```

### Circular Background + Rarity Border

White circle with 2-3px border colored by rarity tier (TCG-inspired):
- Common: `#9CA3AF` (gray)
- Uncommon: `#2DD4BF` (teal)
- Rare: `#F59E0B` (gold/amber)
- Ultra Rare: animated rainbow gradient border (CSS `conic-gradient` rotating via keyframes)

### Gentle Bobbing Animation

CSS `@keyframes float` that translates Y by ~4px on a 3s ease-in-out infinite loop. Each marker gets a random animation delay derived from the store ID hash so they don't bob in sync.

### Size Inflation on Select

- Default size: 48px
- Selected size: 64px
- Transition: `transform 200ms ease` (scale transform)
- The `selectedStore` ID is passed as a prop to each marker so it knows if it's active
- Returns to default when another marker is clicked or panel is closed

### Files Changed

- `src/components/map/pokeball-marker.tsx` — rewrite to use AdvancedMarker with custom HTML
- `src/components/map/store-map.tsx` — pass `selectedStoreId` to markers, add `mapId` to GoogleMap
- `src/app/globals.css` — add `@keyframes float` and `@keyframes rainbow-spin` animations
