# Submission Flow Upgrade Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** After submitting a sighting, immediately update the StoreDetailPanel to show "Already scouted" and animate the map pin from creature sprite to cardboard box — no page refresh needed.

**Architecture:** Add a callback chain from MapSightingForm up through StoreDetailPanel to StoreMap. StoreMap updates its `storeData` state to flip `hasSubmittedToday` for the submitted store, which triggers re-renders of both the panel and the pin. ClusterMarker gets a `justSubmitted` prop to play a shrink-and-morph CSS animation.

**Tech Stack:** React useState/useEffect, CSS keyframes (inline styles matching existing pattern)

---

### Task 1: Add onSubmitSuccess callback to MapSightingForm

**Files:**
- Modify: `src/components/map/map-sighting-form.tsx`

**Step 1: Add prop and call it on success**

Add `onSubmitSuccess: () => void` to the props interface. Call it after `submitTip` succeeds, before `onCancel()`.

```tsx
export function MapSightingForm({
  storeId,
  products,
  userLatitude,
  userLongitude,
  onCancel,
  onSubmitSuccess,
}: {
  storeId: string;
  products: Product[];
  userLatitude: number | null;
  userLongitude: number | null;
  onCancel: () => void;
  onSubmitSuccess: () => void;
}) {
  // ... existing code ...

  async function handleSubmit(formData: FormData) {
    formData.set("storeId", storeId);
    if (userLatitude !== null && userLongitude !== null) {
      formData.set("userLatitude", userLatitude.toString());
      formData.set("userLongitude", userLongitude.toString());
    }
    await submitTip(formData);
    onSubmitSuccess();
    formRef.current?.reset();
    onCancel();
  }
  // ... rest unchanged ...
}
```

**Step 2: Verify build**

Run: `npm run build`
Expected: Build will fail because StoreDetailPanel doesn't pass the new required prop yet. That's fine — we fix it in Task 2.

**Step 3: Commit**

```bash
git add src/components/map/map-sighting-form.tsx
git commit -m "feat: add onSubmitSuccess callback to MapSightingForm"
```

---

### Task 2: Thread callback through StoreDetailPanel

**Files:**
- Modify: `src/components/map/store-detail-panel.tsx`

**Step 1: Add prop and pass to form**

Add `onSightingSubmitted: () => void` to the component props. Pass it to `MapSightingForm` as `onSubmitSuccess`.

```tsx
export function StoreDetailPanel({
  store,
  sightings,
  products,
  hasSubmittedToday,
  userLocation,
  onClose,
  onSightingSubmitted,
}: {
  store: Store;
  sightings: Sighting[];
  products: Product[];
  hasSubmittedToday: boolean;
  userLocation: { lat: number; lng: number } | null;
  onClose: () => void;
  onSightingSubmitted: () => void;
}) {
```

In the JSX where `MapSightingForm` is rendered (~line 171), add the prop:

```tsx
<MapSightingForm
  storeId={store.id}
  products={products}
  userLatitude={userLocation?.lat ?? null}
  userLongitude={userLocation?.lng ?? null}
  onCancel={() => setShowForm(false)}
  onSubmitSuccess={onSightingSubmitted}
/>
```

**Step 2: Verify build**

Run: `npm run build`
Expected: Build will fail because StoreMap doesn't pass the new required prop yet. That's fine — we fix it in Task 3.

**Step 3: Commit**

```bash
git add src/components/map/store-detail-panel.tsx
git commit -m "feat: thread onSightingSubmitted callback through StoreDetailPanel"
```

---

### Task 3: Handle submission in StoreMap and update state

**Files:**
- Modify: `src/components/map/store-map.tsx`

**Step 1: Add state and handler**

In `MapContent`, add state for tracking recently submitted store:

```tsx
const [recentlySubmittedId, setRecentlySubmittedId] = useState<string | null>(null);
```

Add handler function:

```tsx
const handleSightingSubmitted = useCallback((storeId: string) => {
  setStoreData((prev) =>
    prev.map((sd) =>
      sd.store.id === storeId ? { ...sd, hasSubmittedToday: true } : sd
    )
  );
  setSelectedStore((prev) =>
    prev && prev.store.id === storeId ? { ...prev, hasSubmittedToday: true } : prev
  );
  setRecentlySubmittedId(storeId);
}, []);
```

**Step 2: Pass props down**

Pass `onSightingSubmitted` to `StoreDetailPanel` (~line 309):

```tsx
{selectedStore && (
  <StoreDetailPanel
    store={selectedStore.store}
    sightings={selectedStore.sightings}
    products={products}
    hasSubmittedToday={selectedStore.hasSubmittedToday}
    userLocation={gpsLocation}
    onClose={() => setSelectedStore(null)}
    onSightingSubmitted={() => handleSightingSubmitted(selectedStore.store.id)}
  />
)}
```

Pass `justSubmitted` to `ClusterMarker` (~line 261):

```tsx
{storeData.map((sd) => (
  <ClusterMarker
    key={sd.store.id}
    store={sd.store}
    isSelected={selectedStore?.store.id === sd.store.id}
    hasSubmittedToday={sd.hasSubmittedToday}
    justSubmitted={recentlySubmittedId === sd.store.id}
    setMarkerRef={setMarkerRef}
    onClick={() => {
      // ... existing click handler ...
    }}
  />
))}
```

**Step 3: Verify build**

Run: `npm run build`
Expected: PASS — all props are now connected.

**Step 4: Commit**

```bash
git add src/components/map/store-map.tsx
git commit -m "feat: update storeData state on sighting submission"
```

---

### Task 4: Add shrink-and-morph animation to ClusterMarker

**Files:**
- Modify: `src/components/map/cluster-marker.tsx`

**Step 1: Add justSubmitted prop and animation logic**

Add `justSubmitted` to the props interface:

```tsx
export function ClusterMarker({
  store,
  onClick,
  isSelected,
  hasSubmittedToday,
  justSubmitted,
  setMarkerRef,
}: {
  store: Store;
  onClick: () => void;
  isSelected: boolean;
  hasSubmittedToday: boolean;
  justSubmitted: boolean;
  setMarkerRef?: (marker: google.maps.marker.AdvancedMarkerElement | null, id: string) => void;
}) {
```

**Step 2: Update border color logic**

Border color always uses the creature's rarity — remove the gray override for `hasSubmittedToday`:

```tsx
const wild = getWildCreature(store.id);
const spriteUrl = hasSubmittedToday ? BOX_EMOJI_URL : wild.spriteUrl;
const spriteName = hasSubmittedToday ? "Box" : wild.name;
const borderColor = RARITY_BORDER_COLORS[wild.rarity] ?? "#9CA3AF";
const isRainbow = borderColor === "rainbow";
```

**Step 3: Add animation state**

Add `useState` and `useEffect` imports (update import line):

```tsx
import { useCallback, useState, useEffect } from "react";
```

Add animation state inside the component:

```tsx
const [animPhase, setAnimPhase] = useState<"idle" | "shrink" | "grow">("idle");

useEffect(() => {
  if (!justSubmitted) return;
  setAnimPhase("shrink");
  const growTimer = setTimeout(() => setAnimPhase("grow"), 300);
  const doneTimer = setTimeout(() => setAnimPhase("idle"), 600);
  return () => {
    clearTimeout(growTimer);
    clearTimeout(doneTimer);
  };
}, [justSubmitted]);
```

**Step 4: Apply animation to the img element**

Update the `<img>` style to include the scale animation:

```tsx
<img
  src={spriteUrl}
  alt={spriteName}
  width={spriteSize}
  height={spriteSize}
  style={{
    imageRendering: "pixelated",
    transition: "width 200ms ease, height 200ms ease",
    transform:
      animPhase === "shrink" ? "scale(0)" :
      animPhase === "grow" ? "scale(1)" : undefined,
    ...(animPhase !== "idle" && {
      transition: "transform 300ms ease-in-out, width 200ms ease, height 200ms ease",
    }),
  }}
/>
```

**Step 5: Verify build**

Run: `npm run build`
Expected: PASS

**Step 6: Commit**

```bash
git add src/components/map/cluster-marker.tsx
git commit -m "feat: add shrink-and-morph animation on sighting submission"
```

---

### Task 5: Manual verification and final commit

**Step 1: Run dev server and test**

Run: `npm run dev`

Test flow:
1. Open map, click a store pin — should see creature sprite and "Report Sighting" button
2. Submit a sighting
3. Verify: pin animates (creature shrinks, box grows in), border color stays the rarity color
4. Verify: StoreDetailPanel immediately shows "Already scouted" — no refresh needed
5. Close and reopen the panel — should still show "Already scouted"

**Step 2: Run lint**

Run: `npm run lint`
Expected: PASS

**Step 3: Run build**

Run: `npm run build`
Expected: PASS
