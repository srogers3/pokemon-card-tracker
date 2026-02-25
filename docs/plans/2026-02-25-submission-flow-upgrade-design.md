# Submission Flow Upgrade Design

## Problem

After submitting a sighting, the StoreDetailPanel still shows "Report Sighting" and the map pin stays as the creature sprite. Both only update on page refresh because `storeData` in `store-map.tsx` is plain `useState` that never gets updated client-side after submission.

## Solution

### Data Flow

```
MapSightingForm (submit success)
  -> onSubmitSuccess()
    -> StoreDetailPanel passes through
      -> StoreMap.handleSightingSubmitted(storeId)
        -> setStoreData: hasSubmittedToday = true for that store
        -> setRecentlySubmittedId(storeId) for pin animation
```

### Changes by File

**`map-sighting-form.tsx`**
- Add `onSubmitSuccess: () => void` prop
- Call `onSubmitSuccess()` after successful `submitTip()`, before `onCancel()`

**`store-detail-panel.tsx`**
- Add `onSightingSubmitted: () => void` prop
- Pass to `MapSightingForm` as `onSubmitSuccess`
- Panel re-renders naturally when parent flips `hasSubmittedToday` to true

**`store-map.tsx`**
- Add `recentlySubmittedId` state
- `handleSightingSubmitted(storeId)`: updates `storeData` (flip `hasSubmittedToday`), sets `recentlySubmittedId`, updates `selectedStore`
- Pass `onSightingSubmitted` to `StoreDetailPanel`
- Pass `justSubmitted` prop to `ClusterMarker`

**`cluster-marker.tsx`**
- Add `justSubmitted: boolean` prop
- When `justSubmitted`: play shrink-and-morph animation (creature scales to 0, box scales from 0)
- Border color always stays as the creature's rarity color (even after submission)
- Two-phase CSS keyframe animation (~600ms total)

### Animation Detail

Two-phase shrink & morph on the inner `<img>`:
1. Phase 1 (0-300ms): Creature sprite scales 1 -> 0
2. Phase 2 (300-600ms): Box image scales 0 -> 1

Border color remains the creature's rarity color at all times.
