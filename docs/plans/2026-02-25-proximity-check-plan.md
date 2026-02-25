# Proximity Check Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Require users to be within 800m of a store to submit sighting reports, with an env var override for testing.

**Architecture:** Server-side Haversine distance check in `submitTip` action. Client-side UX gating in map components to prevent showing the form when too far. Dashboard community tip form removed entirely — all submissions go through the map.

**Tech Stack:** Next.js server actions, browser Geolocation API (already in use), Haversine formula

---

### Task 1: Add Haversine distance utility

**Files:**
- Modify: `src/lib/utils.ts`

**Step 1: Add the distance function**

In `src/lib/utils.ts`, add after the existing `cn()` function:

```typescript
const EARTH_RADIUS_M = 6_371_000;

/** Haversine distance between two lat/lng points, in meters. */
export function getDistanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Maximum distance (meters) a user can be from a store to submit a tip. */
export const MAX_TIP_DISTANCE_M = 800;
```

**Step 2: Commit**

```bash
git add src/lib/utils.ts
git commit -m "feat: add Haversine distance utility for proximity checking"
```

---

### Task 2: Add server-side proximity check to `submitTip`

**Files:**
- Modify: `src/app/dashboard/submit/actions.ts:1-76`

**Step 1: Add proximity validation to `submitTip`**

In `src/app/dashboard/submit/actions.ts`, add imports at the top (after existing imports):

```typescript
import { getDistanceMeters, MAX_TIP_DISTANCE_M } from "@/lib/utils";
import { stores } from "@/db/schema";
import { eq } from "drizzle-orm";
```

Then, after the `alreadyReported` check (line 30) and before `const productId` (line 32), add the proximity check:

```typescript
  // Proximity check (skip if BYPASS_PROXIMITY_CHECK is set)
  if (!process.env.BYPASS_PROXIMITY_CHECK) {
    const userLat = parseFloat(formData.get("userLatitude") as string);
    const userLng = parseFloat(formData.get("userLongitude") as string);
    if (isNaN(userLat) || isNaN(userLng)) {
      throw new Error("Location is required to submit a report");
    }

    const [store] = await db
      .select({ latitude: stores.latitude, longitude: stores.longitude })
      .from(stores)
      .where(eq(stores.id, storeId))
      .limit(1);

    if (!store?.latitude || !store?.longitude) {
      throw new Error("Store location not available");
    }

    const distance = getDistanceMeters(userLat, userLng, store.latitude, store.longitude);
    if (distance > MAX_TIP_DISTANCE_M) {
      throw new Error("You must be near this store to submit a report");
    }
  }
```

Note: `stores` is already imported via `@/db/schema` (the `restockSightings` import). Add `stores` to the existing destructured import. Similarly, `eq` may already be available from drizzle-orm — check existing imports and add if missing.

Also remove the `revalidatePath("/dashboard/submit")` call at line 73, since we're removing that page.

**Step 2: Verify the build compiles**

Run: `npm run build`
Expected: No TypeScript errors related to the changes.

**Step 3: Commit**

```bash
git add src/app/dashboard/submit/actions.ts
git commit -m "feat: add server-side proximity check to submitTip action"
```

---

### Task 3: Pass user coordinates from MapSightingForm

**Files:**
- Modify: `src/components/map/map-sighting-form.tsx:1-99`

**Step 1: Accept and pass user location**

Add `userLatitude` and `userLongitude` to the component props:

```typescript
export function MapSightingForm({
  storeId,
  products,
  userLatitude,
  userLongitude,
  onCancel,
}: {
  storeId: string;
  products: Product[];
  userLatitude: number | null;
  userLongitude: number | null;
  onCancel: () => void;
}) {
```

In the `handleSubmit` function, add the coordinates to the form data (after `formData.set("storeId", storeId)`):

```typescript
    if (userLatitude !== null && userLongitude !== null) {
      formData.set("userLatitude", userLatitude.toString());
      formData.set("userLongitude", userLongitude.toString());
    }
```

**Step 2: Commit**

```bash
git add src/components/map/map-sighting-form.tsx
git commit -m "feat: pass user coordinates through map sighting form"
```

---

### Task 4: Thread user location through StoreDetailPanel

**Files:**
- Modify: `src/components/map/store-detail-panel.tsx:22-169`
- Modify: `src/components/map/store-map.tsx:305-312`

**Step 1: Add location props to StoreDetailPanel**

In `src/components/map/store-detail-panel.tsx`, add to the props interface and destructuring:

```typescript
export function StoreDetailPanel({
  store,
  sightings,
  products,
  hasSubmittedToday,
  userLocation,
  onClose,
}: {
  store: Store;
  sightings: Sighting[];
  products: Product[];
  hasSubmittedToday: boolean;
  userLocation: { lat: number; lng: number } | null;
  onClose: () => void;
}) {
```

Add proximity awareness. Import the distance utility at the top:

```typescript
import { cn } from "@/lib/utils";
import { getDistanceMeters, MAX_TIP_DISTANCE_M } from "@/lib/utils";
```

(Merge with the existing `cn` import — just add `getDistanceMeters, MAX_TIP_DISTANCE_M` to the existing import from `@/lib/utils`.)

After the `const [trend, setTrend]` line, add:

```typescript
  const isTooFar = !userLocation || !store.latitude || !store.longitude
    ? true
    : getDistanceMeters(userLocation.lat, userLocation.lng, store.latitude, store.longitude) > MAX_TIP_DISTANCE_M;
```

Replace the report sighting section (the block starting at `{hasSubmittedToday ? (` around line 145) with:

```typescript
        {hasSubmittedToday ? (
          <div className="bg-muted/50 rounded-lg p-4 text-center space-y-1">
            <p className="text-2xl">📦</p>
            <p className="font-semibold text-sm">You already scouted this location today!</p>
            <p className="text-xs text-muted-foreground">Come back tomorrow — a new creature might be lurking.</p>
          </div>
        ) : isTooFar ? (
          <div className="bg-muted/50 rounded-lg p-4 text-center space-y-1">
            <p className="text-2xl">📍</p>
            <p className="font-semibold text-sm">You&apos;re too far from this store</p>
            <p className="text-xs text-muted-foreground">Get within 0.5 miles to submit a report.</p>
          </div>
        ) : showForm ? (
          <MapSightingForm
            storeId={store.id}
            products={products}
            userLatitude={userLocation?.lat ?? null}
            userLongitude={userLocation?.lng ?? null}
            onCancel={() => setShowForm(false)}
          />
        ) : (
          <Button
            variant="accent"
            className="w-full"
            onClick={() => setShowForm(true)}
          >
            Report Sighting
          </Button>
        )}
```

**Step 2: Pass userLocation from StoreMap**

In `src/components/map/store-map.tsx`, find the `<StoreDetailPanel>` usage (around line 305-312) and add the `userLocation` prop:

```typescript
      {selectedStore && (
        <StoreDetailPanel
          store={selectedStore.store}
          sightings={selectedStore.sightings}
          products={products}
          hasSubmittedToday={selectedStore.hasSubmittedToday}
          userLocation={userLocation}
          onClose={() => setSelectedStore(null)}
        />
      )}
```

**Step 3: Verify the build compiles**

Run: `npm run build`
Expected: No TypeScript errors.

**Step 4: Commit**

```bash
git add src/components/map/store-detail-panel.tsx src/components/map/store-map.tsx
git commit -m "feat: gate report button on proximity, show too-far message"
```

---

### Task 5: Remove dashboard community tip form

**Files:**
- Delete: `src/components/community-tip-form.tsx`

**Step 1: Verify no imports of CommunityTipForm exist in `src/`**

The only import is in the file itself (self-export). Confirmed by grep — no other files in `src/` import `CommunityTipForm`.

**Step 2: Delete the file**

```bash
rm src/components/community-tip-form.tsx
```

**Step 3: Commit**

```bash
git add src/components/community-tip-form.tsx
git commit -m "refactor: remove unused CommunityTipForm component"
```

---

### Task 6: Add env var to `.env.example`

**Files:**
- Modify: `.env.example`

**Step 1: Add the bypass variable**

Add to the end of `.env.example` (or in a logical grouping):

```
# Proximity Check
# Set to "true" to skip proximity validation for sighting submissions (dev/testing)
# BYPASS_PROXIMITY_CHECK=true
```

**Step 2: Commit**

```bash
git add .env.example
git commit -m "docs: add BYPASS_PROXIMITY_CHECK to .env.example"
```

---

### Task 7: Build verification

**Step 1: Run the build**

Run: `npm run build`
Expected: Clean build with no errors.

**Step 2: Run lint**

Run: `npm run lint`
Expected: No new lint errors.

**Step 3: Commit any fixes if needed**

Only if the build or lint revealed issues.
