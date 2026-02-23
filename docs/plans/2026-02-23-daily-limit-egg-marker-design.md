# Daily Submission Limit, Egg Markers & Optional Product Design

## Problem

Users can spam submissions for the same store. There's no visual feedback when a store has already been reported today. Additionally, "empty shelves" reports shouldn't require selecting a specific product.

## Features

### 1. Per-Store Daily Rate Limit

Add `hasSubmittedToStoreToday(userId, storeId)` in `src/lib/trust.ts`. Queries `restockSightings` for any row where `reportedBy = userId`, `storeId = storeId`, and `createdAt >= today midnight`. Called in `submitTip` before insert — throws if already submitted.

### 2. Server-Side `hasSubmittedToday` Flag

`getStoresWithSightings` in `src/app/dashboard/actions.ts` gets `userId` via `auth()`. Runs one additional query: all distinct `storeId`s where user has a sighting with `createdAt >= today`. Each store entry gains `hasSubmittedToday: boolean`. Flows through `StoreMap` props to markers and panels.

### 3. Egg Marker for Already-Submitted Stores

`PokeballMarker` receives `hasSubmittedToday` prop. When true:
- Renders Lucky Egg sprite (`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/lucky-egg.png`) instead of the random Pokemon sprite
- Uses neutral gray border (`#9CA3AF`) — rarity system bypassed
- Float animation preserved

`StoreDetailPanel` receives `hasSubmittedToday` prop. When true:
- Replaces "Report Sighting" button/form with message: "Your Trainer already scouted this location today! Come back tomorrow — a new Pokemon might be waiting."

### 4. Optional Product for "not_found" Reports

**Migration**: `ALTER TABLE restock_sightings ALTER COLUMN product_id DROP NOT NULL`

**Schema**: Remove `.notNull()` from `restockSightings.productId`.

**Form**: `MapSightingForm` tracks selected status via `useState`. Product `<Select>` only appears when status is `"found"`. Hidden for `"not_found"`.

**Server action**: `submitTip` accepts null `productId`. Skips `checkCorroboration` when productId is null (no meaningful match without a product).

**Data query**: `getStoresWithSightings` changes `innerJoin` to `leftJoin` on products. `productName` falls back to `"General report"` when null.

## Files Changed

| File | Change |
|------|--------|
| `src/db/schema.ts` | Make `productId` nullable |
| `drizzle/0004_*.sql` | Migration for nullable product_id |
| `src/lib/trust.ts` | Add `hasSubmittedToStoreToday()` |
| `src/app/dashboard/submit/actions.ts` | Per-store rate limit check, handle null productId |
| `src/app/dashboard/actions.ts` | Query user's today submissions, add flag to return type, leftJoin |
| `src/app/dashboard/page.tsx` | No change needed (auth is already available server-side) |
| `src/components/map/store-map.tsx` | Pass `hasSubmittedToday` to PokeballMarker and StoreDetailPanel |
| `src/components/map/pokeball-marker.tsx` | Egg sprite when `hasSubmittedToday` |
| `src/components/map/store-detail-panel.tsx` | "Already scouted" message when `hasSubmittedToday` |
| `src/components/map/map-sighting-form.tsx` | Conditional product field based on status |
