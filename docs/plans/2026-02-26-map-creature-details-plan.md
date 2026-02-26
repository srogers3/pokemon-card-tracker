# Map Creature Details & Star Upgrade System — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Show creature info on map pin selection (floating label + Cardboardex tab in store panel) and replace the report-status-based upgrade system with a visible star tier system.

**Architecture:** Add `getStarTier()` to wild-creature.ts using the same deterministic hash approach. Replace upgrade logic in boxes.ts. Add a floating `<CreatureLabel>` component above selected pins. Split the store detail panel into tabs (Store Info | Cardboardex) using shadcn Tabs. Pass user collection data from the server to the map.

**Tech Stack:** React, TypeScript, @vis.gl/react-google-maps (AdvancedMarker), shadcn/ui Tabs, Vitest, Drizzle ORM

---

### Task 1: Add `getStarTier()` to wild-creature.ts

**Files:**
- Modify: `src/lib/wild-creature.ts`
- Test: `src/lib/wild-creature.test.ts`

**Step 1: Write failing tests for `getStarTier`**

Add to `src/lib/wild-creature.test.ts`:

```typescript
import { simpleHash, getWildCreature, getStarTier } from "./wild-creature";
// ... existing imports ...

describe("getStarTier", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns null, 'green', 'yellow', or 'purple'", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-15"));
    const result = getStarTier("store-123");
    expect([null, "green", "yellow", "purple"]).toContain(result);
  });

  it("is deterministic for same store and date", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-15"));
    const a = getStarTier("store-123");
    const b = getStarTier("store-123");
    expect(a).toBe(b);
  });

  it("uses a different seed than getWildCreature (independent)", () => {
    vi.useFakeTimers();
    // Just verify it doesn't crash and returns valid values across many stores
    for (let i = 0; i < 100; i++) {
      vi.setSystemTime(new Date("2026-01-15"));
      const result = getStarTier(`store-${i}`);
      expect([null, "green", "yellow", "purple"]).toContain(result);
    }
  });

  it("distribution roughly matches expected rates over many stores", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-15"));
    const counts = { none: 0, green: 0, yellow: 0, purple: 0 };
    for (let i = 0; i < 10000; i++) {
      const result = getStarTier(`distribution-test-store-${i}`);
      if (result === null) counts.none++;
      else counts[result]++;
    }
    // ~83% none, ~10% green, ~5% yellow, ~2% purple (with generous margins)
    expect(counts.none).toBeGreaterThan(7000);
    expect(counts.green).toBeGreaterThan(500);
    expect(counts.yellow).toBeGreaterThan(200);
    expect(counts.purple).toBeGreaterThan(50);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/wild-creature.test.ts`
Expected: FAIL — `getStarTier` is not exported

**Step 3: Implement `getStarTier`**

Add to `src/lib/wild-creature.ts` after the `getWildCreature` function:

```typescript
export type StarTier = "green" | "yellow" | "purple";

// Star thresholds: ~83% none, ~10% green, ~5% yellow, ~2% purple
const STAR_THRESHOLDS: { tier: StarTier; cumulative: number }[] = [
  { tier: "purple", cumulative: 0.02 },
  { tier: "yellow", cumulative: 0.07 },
  { tier: "green", cumulative: 0.17 },
];

export const STAR_UPGRADE_CHANCE: Record<StarTier, number> = {
  green: 0.20,
  yellow: 0.40,
  purple: 0.60,
};

export function getStarTier(storeId: string): StarTier | null {
  const today = new Date().toISOString().split("T")[0];
  const seed = storeId + today + "star";
  const hash = simpleHash(seed);
  const roll = (hash % 1000) / 1000;

  for (const { tier, cumulative } of STAR_THRESHOLDS) {
    if (roll < cumulative) return tier;
  }
  return null;
}
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/wild-creature.test.ts`
Expected: All PASS

**Step 5: Commit**

```bash
git add src/lib/wild-creature.ts src/lib/wild-creature.test.ts
git commit -m "feat: add deterministic star tier system to wild-creature"
```

---

### Task 2: Replace upgrade logic in boxes.ts with star-tier-based upgrades

**Files:**
- Modify: `src/lib/boxes.ts`
- Modify: `src/lib/boxes.test.ts`

**Step 1: Write failing tests for star-tier-based upgrade**

Update `src/lib/boxes.test.ts`. The `rollUpgradeTier` tests stay as-is (that function is unchanged). Add/update tests for the new star-based behavior. Since `openBox` requires DB access, we focus on testing the pure functions. The key change is that `UPGRADE_CHANCE` is removed and replaced by `STAR_UPGRADE_CHANCE` from wild-creature.ts, but the `openBox` function signature changes to accept `starTier`.

Actually, `openBox` is called from a server action and needs the star tier passed in. Update the test for `rollRandomCreature` to still work (it's unchanged). The `UPGRADE_CHANCE` constant just gets removed.

No new pure-function tests needed here — the logic change is in `openBox` which is DB-dependent. The key verification is that the old `UPGRADE_CHANCE` constant is removed and `STAR_UPGRADE_CHANCE` from wild-creature.ts is used instead.

**Step 2: Update `openBox` in boxes.ts**

In `src/lib/boxes.ts`:

1. Remove the `UPGRADE_CHANCE` constant (lines 31-35)
2. Add import: `import { STAR_UPGRADE_CHANCE, type StarTier } from "./wild-creature";`
3. Change `openBox` signature to accept `starTier: StarTier | null` instead of using report status for upgrade chance:

```typescript
export async function openBox(
  sightingId: string,
  corroborated: boolean = false,
  starTier: StarTier | null = null
): Promise<{ creatureName: string; isShiny: boolean; wasUpgrade: boolean; wildCreatureName: string | null } | null> {
```

4. Replace the upgrade chance lookup (line 99) from:
```typescript
const upgradeChance = UPGRADE_CHANCE[poolKey] ?? UPGRADE_CHANCE["not_found"];
```
to:
```typescript
const upgradeChance = starTier ? (STAR_UPGRADE_CHANCE[starTier] ?? 0) : 0;
```

**Step 3: Run all tests**

Run: `npx vitest run src/lib/boxes.test.ts`
Expected: All PASS (pure function tests are unaffected, openBox is DB-dependent)

**Step 4: Update callers of `openBox`**

Search for all callers of `openBox` and update them to pass `starTier`. The caller is likely in a server action. Find it with:

```bash
grep -rn "openBox(" src/app/
```

Update each caller to compute and pass the star tier. Example pattern:

```typescript
import { getStarTier } from "@/lib/wild-creature";
// ... in the action:
const starTier = getStarTier(storeId);
const result = await openBox(sightingId, corroborated, starTier);
```

The caller needs access to `storeId` — trace through the sighting to find the store.

**Step 5: Commit**

```bash
git add src/lib/boxes.ts src/lib/boxes.test.ts src/app/
git commit -m "feat: replace report-status upgrades with star-tier-based upgrades"
```

---

### Task 3: Add star indicator to ClusterMarker

**Files:**
- Modify: `src/components/map/cluster-marker.tsx`

**Step 1: Update ClusterMarker props**

Add `starTier` prop to the component:

```typescript
import { getWildCreature, simpleHash, type StarTier } from "@/lib/wild-creature";

// In the props type:
starTier: StarTier | null;
```

**Step 2: Add star indicator visual**

Inside the marker's inner `<div>` (after the sprite `<img>`), add a star indicator when `starTier` is not null:

```typescript
const STAR_COLORS: Record<string, string> = {
  green: "#22C55E",
  yellow: "#EAB308",
  purple: "#A855F7",
};
```

Render a small colored star dot. For non-selected pins, render a tiny 8px circle in the top-right. For selected (enlarged) pins, render a larger star icon.

```tsx
{starTier && (
  <div
    style={{
      position: "absolute",
      top: isSelected ? -4 : -2,
      right: isSelected ? -4 : -2,
      width: isSelected ? 20 : 10,
      height: isSelected ? 20 : 10,
      borderRadius: "50%",
      backgroundColor: STAR_COLORS[starTier],
      border: "2px solid white",
      boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: isSelected ? 12 : 0,
      transition: "all 200ms ease",
      zIndex: 10,
    }}
  >
    {isSelected && "★"}
  </div>
)}
```

The outer scale wrapper needs `position: relative` to support this absolute positioning.

**Step 3: Commit**

```bash
git add src/components/map/cluster-marker.tsx
git commit -m "feat: add star tier indicator to map pins"
```

---

### Task 4: Create CreatureLabel floating speech bubble

**Files:**
- Create: `src/components/map/creature-label.tsx`

**Step 1: Create the component**

```tsx
"use client";

import { AdvancedMarker } from "@vis.gl/react-google-maps";
import type { StarTier } from "@/lib/wild-creature";

const RARITY_BORDER_COLORS: Record<string, string> = {
  common: "#9CA3AF",
  uncommon: "#2DD4BF",
  rare: "#F59E0B",
  ultra_rare: "conic-gradient(from 0deg, #ef4444, #f59e0b, #22c55e, #3b82f6, #a855f7, #ef4444)",
};

const STAR_COLORS: Record<string, string> = {
  green: "#22C55E",
  yellow: "#EAB308",
  purple: "#A855F7",
};

export function CreatureLabel({
  position,
  creatureName,
  isCaught,
  rarity,
  starTier,
  visible,
}: {
  position: { lat: number; lng: number };
  creatureName: string;
  isCaught: boolean;
  rarity: string;
  starTier: StarTier | null;
  visible: boolean;
}) {
  const borderColor = RARITY_BORDER_COLORS[rarity] ?? "#9CA3AF";
  const isRainbow = rarity === "ultra_rare";
  const displayName = isCaught ? creatureName : "???";

  return (
    <AdvancedMarker
      position={position}
      zIndex={visible ? 1001 : -1}
    >
      <div
        style={{
          transform: "translateY(-90px)",
          opacity: visible ? 1 : 0,
          transition: "opacity 300ms ease-in-out",
          pointerEvents: "none",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* Speech bubble */}
        <div
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.85)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            borderRadius: 8,
            padding: "4px 10px",
            border: isRainbow ? "none" : `2px solid ${borderColor}`,
            background: isRainbow
              ? "linear-gradient(white, white) padding-box, conic-gradient(from 0deg, #ef4444, #f59e0b, #22c55e, #3b82f6, #a855f7, #ef4444) border-box"
              : undefined,
            borderColor: isRainbow ? "transparent" : undefined,
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
            whiteSpace: "nowrap",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          {starTier && (
            <span style={{ color: STAR_COLORS[starTier], fontSize: 12 }}>★</span>
          )}
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: isCaught ? "#1a1a2e" : "#6b7280",
              fontStyle: isCaught ? "normal" : "italic",
            }}
          >
            {displayName}
          </span>
        </div>
        {/* Downward caret */}
        <div
          style={{
            width: 0,
            height: 0,
            borderLeft: "6px solid transparent",
            borderRight: "6px solid transparent",
            borderTop: `6px solid ${isRainbow ? "#3b82f6" : borderColor}`,
            marginTop: -1,
          }}
        />
      </div>
    </AdvancedMarker>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/map/creature-label.tsx
git commit -m "feat: add floating creature label component for selected pins"
```

---

### Task 5: Create CardboardexTab component

**Files:**
- Create: `src/components/map/cardboardex-tab.tsx`

**Step 1: Create the component**

This component shows creature info in three states: caught (full card), uncaught (silhouette + ???), and pending (same as uncaught).

```tsx
"use client";

import { Badge } from "@/components/ui/badge";
import { getSpriteUrl } from "@/db/creature-data";
import type { CreatureEntry } from "@/db/creature-data";
import type { StarTier } from "@/lib/wild-creature";
import { STAR_UPGRADE_CHANCE } from "@/lib/wild-creature";
import { cn } from "@/lib/utils";

const RARITY_COLORS: Record<string, string> = {
  common: "bg-gray-100 text-gray-700 border-gray-300",
  uncommon: "bg-teal-50 text-teal-700 border-teal-300",
  rare: "bg-amber-50 text-amber-700 border-amber-300",
  ultra_rare: "bg-purple-50 text-purple-700 border-purple-300",
};

const TYPE_LABELS: Record<string, string> = {
  shelf: "Shelf",
  logistics: "Logistics",
  checkout: "Checkout",
  scalper: "Scalper",
  hype: "Hype",
  clearance: "Clearance",
  backroom: "Backroom",
  corporate: "Corporate",
};

const STAR_STYLES: Record<string, { color: string; label: string }> = {
  green: { color: "#22C55E", label: "Green Star" },
  yellow: { color: "#EAB308", label: "Yellow Star" },
  purple: { color: "#A855F7", label: "Purple Star" },
};

export function CardboardexTab({
  creature,
  isCaught,
  catchCount,
  shinyCount,
  starTier,
  hasPendingBox,
}: {
  creature: CreatureEntry;
  isCaught: boolean;
  catchCount: number;
  shinyCount: number;
  starTier: StarTier | null;
  hasPendingBox: boolean;
}) {
  const showDetails = isCaught && !hasPendingBox;
  const rarityClass = RARITY_COLORS[creature.rarityTier] ?? RARITY_COLORS.common;

  return (
    <div className="p-4 space-y-4">
      {/* Sprite */}
      <div className="flex justify-center">
        <div className={cn(
          "w-24 h-24 rounded-xl flex items-center justify-center",
          showDetails ? "bg-card border border-primary/20" : "bg-muted/50 border border-dashed border-border"
        )}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={getSpriteUrl(creature.id)}
            alt={showDetails ? creature.name : "???"}
            className={cn("w-20 h-20", !showDetails && "brightness-0 opacity-30")}
            style={{ imageRendering: "pixelated" }}
          />
        </div>
      </div>

      {/* Name + badges */}
      <div className="text-center space-y-2">
        <h4 className="text-lg font-semibold">
          {showDetails ? creature.name : "???"}
        </h4>
        <div className="flex items-center justify-center gap-2">
          <Badge variant="outline" className={cn("text-xs border", rarityClass)}>
            {creature.rarityTier.replace("_", " ")}
          </Badge>
          {showDetails && (
            <Badge variant="outline" className="text-xs">
              {TYPE_LABELS[creature.type] ?? creature.type}
            </Badge>
          )}
        </div>
      </div>

      {/* Star tier */}
      {starTier && (
        <div className="flex items-center justify-center gap-2 text-sm">
          <span style={{ color: STAR_STYLES[starTier].color, fontSize: 16 }}>★</span>
          <span className="font-medium">{STAR_STYLES[starTier].label}</span>
          <span className="text-muted-foreground">
            — {Math.round(STAR_UPGRADE_CHANCE[starTier] * 100)}% upgrade chance
          </span>
        </div>
      )}

      {/* Description (caught only) */}
      {showDetails && (
        <p className="text-sm text-muted-foreground text-center italic">
          {creature.description}
        </p>
      )}

      {/* Collection stats (caught only) */}
      {showDetails && (
        <div className="flex gap-3 text-sm">
          <div className="bg-muted/50 rounded-lg px-3 py-2 flex-1 text-center">
            <div className="font-semibold">{catchCount}</div>
            <div className="text-muted-foreground text-xs">Caught</div>
          </div>
          {shinyCount > 0 && (
            <div className="bg-muted/50 rounded-lg px-3 py-2 flex-1 text-center">
              <div className="font-semibold">✨ {shinyCount}</div>
              <div className="text-muted-foreground text-xs">Shiny</div>
            </div>
          )}
        </div>
      )}

      {/* Uncaught message */}
      {!showDetails && !hasPendingBox && (
        <p className="text-xs text-muted-foreground text-center">
          Report a sighting at this store to discover this creature!
        </p>
      )}

      {/* Pending box message */}
      {hasPendingBox && (
        <div className="text-center space-y-1">
          <p className="text-2xl">📦</p>
          <p className="text-xs text-muted-foreground">
            You have a pending box from this store — details revealed when it opens!
          </p>
        </div>
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/map/cardboardex-tab.tsx
git commit -m "feat: add CardboardexTab component for creature details"
```

---

### Task 6: Add tabs to StoreDetailPanel

**Files:**
- Modify: `src/components/map/store-detail-panel.tsx`

**Step 1: Add imports and new props**

Add to `src/components/map/store-detail-panel.tsx`:

```typescript
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CardboardexTab } from "./cardboardex-tab";
import type { CreatureEntry } from "@/db/creature-data";
import type { StarTier } from "@/lib/wild-creature";
```

Add new props to the component:

```typescript
wildCreature: CreatureEntry;
starTier: StarTier | null;
isCreatureCaught: boolean;
creatureCatchCount: number;
creatureShinyCount: number;
hasPendingBox: boolean;
```

**Step 2: Wrap panel content in Tabs**

Inside the component, after the sticky header `<div>`, wrap the existing `<div className="p-4 space-y-4">` content in a `<Tabs>` structure:

```tsx
<Tabs defaultValue="store-info" className="flex-1">
  <div className="px-4 pt-2">
    <TabsList className="w-full">
      <TabsTrigger value="store-info" className="flex-1">Store Info</TabsTrigger>
      <TabsTrigger value="cardboardex" className="flex-1">Cardboardex</TabsTrigger>
    </TabsList>
  </div>

  <TabsContent value="store-info">
    {/* All existing panel content (quick stats, restock intel, sightings, report form) */}
    <div className="p-4 space-y-4">
      {/* ... existing content ... */}
    </div>
  </TabsContent>

  <TabsContent value="cardboardex">
    <CardboardexTab
      creature={wildCreature}
      isCaught={isCreatureCaught}
      catchCount={creatureCatchCount}
      shinyCount={creatureShinyCount}
      starTier={starTier}
      hasPendingBox={hasPendingBox}
    />
  </TabsContent>
</Tabs>
```

**Step 3: Commit**

```bash
git add src/components/map/store-detail-panel.tsx
git commit -m "feat: add Cardboardex tab to store detail panel"
```

---

### Task 7: Wire everything together in StoreMap and MapPage

**Files:**
- Modify: `src/app/dashboard/map/page.tsx`
- Modify: `src/components/map/store-map.tsx`

**Step 1: Fetch user collection in MapPage**

In `src/app/dashboard/map/page.tsx`, add:

```typescript
import { requireUser } from "@/lib/auth";
import { getUserCollection } from "@/lib/boxes";
```

Fetch the user and their collection alongside existing data:

```typescript
const [user, storesWithSightings, allProducts] = await Promise.all([
  requireUser(),
  getStoresWithSightings(),
  db.select().from(products),
]);
const userBoxes = await getUserCollection(user.id);
```

Pass `userBoxes` as a new prop to `<StoreMap>`.

**Step 2: Update StoreMap to accept and use collection data**

In `src/components/map/store-map.tsx`:

1. Add to `StoreMapProps`:
```typescript
userBoxes: {
  creatureId: number | null;
  wildCreatureId: number | null;
  isShiny: boolean;
  opened: boolean;
}[];
```

2. Import `getStarTier`, `CreatureLabel`, `CREATURE_DATA`:
```typescript
import { getWildCreature, getStarTier } from "@/lib/wild-creature";
import { CreatureLabel } from "./creature-label";
import { CREATURE_DATA } from "@/db/creature-data";
```

3. In `MapContent`, build a `caughtMap` from `userBoxes` (same logic as collection page):
```typescript
const caughtMap = useMemo(() => {
  const map = new Map<number, { count: number; shinyCount: number }>();
  for (const box of userBoxes.filter(b => b.opened && b.creatureId)) {
    const existing = map.get(box.creatureId!) ?? { count: 0, shinyCount: 0 };
    existing.count++;
    if (box.isShiny) existing.shinyCount++;
    map.set(box.creatureId!, existing);
  }
  return map;
}, [userBoxes]);
```

4. Build a set of pending wildCreatureIds:
```typescript
const pendingWildIds = useMemo(() => {
  return new Set(
    userBoxes.filter(b => !b.opened && b.wildCreatureId).map(b => b.wildCreatureId!)
  );
}, [userBoxes]);
```

5. Pass `starTier` to each `<ClusterMarker>`:
```tsx
<ClusterMarker
  key={sd.store.id}
  store={sd.store}
  isSelected={selectedStore?.store.id === sd.store.id}
  hasSubmittedToday={sd.hasSubmittedToday}
  justSubmitted={recentlySubmittedId === sd.store.id}
  setMarkerRef={setMarkerRef}
  onClick={handleSelectStore}
  starTier={getStarTier(sd.store.id)}
/>
```

6. Render `<CreatureLabel>` for the selected store:
```tsx
{selectedStore && selectedStore.store.latitude && selectedStore.store.longitude && (() => {
  const wild = getWildCreature(selectedStore.store.id);
  const caught = caughtMap.get(wild.id);
  return (
    <CreatureLabel
      position={{ lat: selectedStore.store.latitude, lng: selectedStore.store.longitude }}
      creatureName={wild.name}
      isCaught={!!caught}
      rarity={wild.rarity}
      starTier={getStarTier(selectedStore.store.id)}
      visible={true}
    />
  );
})()}
```

7. Pass creature data to `<StoreDetailPanel>`:
```tsx
{selectedStore && (() => {
  const wild = getWildCreature(selectedStore.store.id);
  const creatureEntry = CREATURE_DATA.find(c => c.id === wild.id)!;
  const caught = caughtMap.get(wild.id);
  return (
    <StoreDetailPanel
      store={selectedStore.store}
      sightings={selectedStore.sightings}
      products={products}
      hasSubmittedToday={selectedStore.hasSubmittedToday}
      userLocation={gpsLocation}
      onClose={() => setSelectedStore(null)}
      onSightingSubmitted={() => handleSightingSubmitted(selectedStore.store.id)}
      wildCreature={creatureEntry}
      starTier={getStarTier(selectedStore.store.id)}
      isCreatureCaught={!!caught}
      creatureCatchCount={caught?.count ?? 0}
      creatureShinyCount={caught?.shinyCount ?? 0}
      hasPendingBox={pendingWildIds.has(wild.id)}
    />
  );
})()}
```

**Step 3: Run the build to check for type errors**

Run: `npx next build`
Expected: Build succeeds (or fix any type errors)

**Step 4: Commit**

```bash
git add src/app/dashboard/map/page.tsx src/components/map/store-map.tsx
git commit -m "feat: wire creature details and star tiers into map UI"
```

---

### Task 8: Run all tests and verify

**Step 1: Run full test suite**

Run: `npx vitest run`
Expected: All tests pass

**Step 2: Run build**

Run: `npx next build`
Expected: Build succeeds

**Step 3: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "fix: address test/build issues from creature details feature"
```
