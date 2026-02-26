# Map Creature Details & Star Upgrade System

## Overview

Show more creature information when a map pin is selected: a floating name label above the pin, a Cardboardex tab in the store detail panel, and a new star-based upgrade system that replaces the old report-status-based upgrades.

## Feature 1: Floating Creature Label

When a pin is selected, a speech-bubble appears above the enlarged pin.

- **Content:** Creature name if caught, "???" if uncaught
- **Style:** Frosted glass background, small text, downward-pointing caret toward the pin, thin rarity-colored border (gray/teal/amber/rainbow)
- **Animation:** Fade in on select, fade out on deselect (CSS transition)
- **Implementation:** Second `<AdvancedMarker>` at the same coordinates, rendered only when `isSelected` is true

## Feature 2: Cardboardex Tab in Store Detail Panel

A tab bar added to the top of `StoreDetailPanel` (below the sticky header).

- **Tabs:** `Store Info` | `Cardboardex`
- **Store Info:** All existing panel content (unchanged)
- **Default tab:** Store Info
- **Resets to Store Info** when selecting a different pin

### Cardboardex Tab Content

**Caught creature (full card view):**
- Large sprite image
- Creature name
- Type badge (shelf, logistics, checkout, etc.)
- Rarity badge (common/uncommon/rare/ultra_rare)
- Flavor text description
- Count owned + shiny count/indicator
- Star tier + upgrade percentage (if applicable)

**Uncaught creature:**
- Blacked-out silhouette sprite
- "???" instead of name
- Rarity tier hint (colored badge)
- Star info still visible
- Everything else hidden

**Pending box (unopened):**
- Same as uncaught — no spoilers

## Feature 3: Star Upgrade System

Replaces the old report-status-based upgrade chances (5%/20%/35%).

### Star Assignment

Deterministic per store per day using the same hash approach as wild creature selection but with a different seed. Every user sees the same star at a given store on a given day.

### Star Tiers

| Star   | Chance to appear | Upgrade boost |
|--------|-----------------|---------------|
| None   | ~83%            | 0%            |
| Green  | ~10%            | 20%           |
| Yellow | ~5%             | 40%           |
| Purple | ~2%             | 60%           |

### Visual on Pin

- Selected pins show a colored star icon (top-right corner of the enlarged pin)
- Non-selected pins show a tiny star dot to help users scan for star stores

### Box Opening Logic

At box open time, the star tier from the store determines upgrade chance instead of report status.

## Component Changes

### Modified Files

- **`src/lib/wild-creature.ts`** — Add `getStarTier(storeId)` function
- **`src/lib/boxes.ts`** — Replace report-status upgrade logic with star-tier-based upgrades
- **`src/components/map/cluster-marker.tsx`** — Accept `starTier` prop, render star indicator
- **`src/components/map/store-detail-panel.tsx`** — Add shadcn Tabs: Store Info | Cardboardex
- **`src/components/map/store-map.tsx`** — Compute star tiers, pass collection data
- **`src/app/dashboard/map/page.tsx`** — Fetch user's creature collection server-side

### New Files

- **`src/components/map/creature-label.tsx`** — Floating speech bubble above selected pin
- **`src/components/map/cardboardex-tab.tsx`** — Cardboardex tab content (caught/uncaught/pending states)
