# Tiered Box Opening Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Decouple box opening from sighting verification — premium/auto-verify users open boxes immediately on map page, free users open manually after 24h on collection page.

**Architecture:** Simplify `openBox()` to remove report-status-based rarity (star tier only). Add `openPendingBox()` server action with 24h timer check. Premium users get reveal modal on map page post-submit. Free users get countdown + open button on collection page. Unverified sightings shown with visual flag on map.

**Tech Stack:** Next.js Server Actions, Drizzle ORM, React client components, Tailwind CSS

---

### Task 1: Simplify openBox — Remove Report-Status Rarity Weights

**Files:**
- Modify: `src/lib/boxes.ts:16-20` (remove RARITY_WEIGHTS), `:60-63` (simplify signature), `:86` (remove corroborated fallback), `:109-111` (remove legacy rollRandomCreature), `:147-161` (remove rollRandomCreature function)

**Step 1: Remove RARITY_WEIGHTS and rollRandomCreature**

In `src/lib/boxes.ts`, remove the `RARITY_WEIGHTS` constant (lines 16-20), remove the `rollRandomCreature` function (lines 147-161), and remove the `rollRarity` function (lines 219-229) since nothing else uses them.

**Step 2: Simplify openBox signature**

Change `openBox` to drop the `corroborated` parameter:

```typescript
export async function openBox(
  sightingId: string,
  starTier: StarTier | null = null
): Promise<{ creatureName: string; isShiny: boolean; wasUpgrade: boolean; wildCreatureName: string | null } | null> {
```

**Step 3: Remove legacy fallback in openBox body**

In the `openBox` function, the `else` branch (lines 109-112) that calls `rollRandomCreature` for boxes without `wildCreatureId` should instead just use a random creature from `CREATURE_DATA`:

```typescript
} else {
  // Legacy boxes without wildCreatureId — pick random creature
  creature = CREATURE_DATA[Math.floor(Math.random() * CREATURE_DATA.length)];
}
```

Also remove the `corroborated` reference from line 86 (`rollRandomCreature(box.reportStatus as string, corroborated)`). Replace that fallback with the same random pick:

```typescript
if (!wildCreature) {
  creature = CREATURE_DATA[Math.floor(Math.random() * CREATURE_DATA.length)];
}
```

**Step 4: Commit**

```bash
git add src/lib/boxes.ts
git commit -m "refactor: simplify openBox to use star tier only for rarity"
```

---

### Task 2: Update All openBox Call Sites

**Files:**
- Modify: `src/app/dashboard/submit/actions.ts:96` — remove `false` param
- Modify: `src/lib/trust.ts:127-128` — remove `true` param
- Modify: `src/app/admin/verification/actions.ts:42` — remove `false` param

**Step 1: Update submit/actions.ts**

Line 96, change:
```typescript
await openBox(sighting.id, false, starTier);
```
to:
```typescript
await openBox(sighting.id, starTier);
```

**Step 2: Update trust.ts**

Lines 127-128, change:
```typescript
await openBox(match.id, true, starTier);
await openBox(sightingId, true, starTier);
```
to:
```typescript
await openBox(match.id, starTier);
await openBox(sightingId, starTier);
```

**Step 3: Update admin verification/actions.ts**

Line 42, change:
```typescript
await openBox(id, false, starTier);
```
to:
```typescript
await openBox(id, starTier);
```

**Step 4: Commit**

```bash
git add src/app/dashboard/submit/actions.ts src/lib/trust.ts src/app/admin/verification/actions.ts
git commit -m "refactor: update openBox call sites for simplified signature"
```

---

### Task 3: Premium/Auto-Verify Immediate Open on Submit

**Files:**
- Modify: `src/app/dashboard/submit/actions.ts` — add premium immediate open path

**Step 1: Add premium check to submitTip**

Currently the submit flow only opens boxes for auto-verify users (trust >= 50). We need to also open immediately for premium users.

After the `createBox` call (line 82) and `updateReporterStats` (line 85), restructure the logic:

```typescript
// Determine if box should open immediately
const isPremium = user.subscriptionTier === "premium";
const autoVerify = shouldAutoVerify(user.trustScore);

// Check for corroboration if not auto-verified (only for product-specific reports)
if (!autoVerify && productId) {
  const corroboratedUserId = await checkCorroboration(sighting.id, storeId, productId, sightedAt);
  if (corroboratedUserId) {
    await adjustTrustScore(userId, 10);
  }
}

if (autoVerify) {
  // Auto-verified — open box immediately
  const starTier = getStarTier(storeId);
  await openBox(sighting.id, starTier);
  await adjustTrustScore(userId, 5);
} else if (isPremium) {
  // Premium user — open box immediately (sighting still unverified)
  const starTier = getStarTier(storeId);
  await openBox(sighting.id, starTier);
}
```

Note: Move `autoVerify` computation earlier (it's already at line 60) and add `isPremium` check. The corroboration check should happen regardless since it verifies the *sighting*, not the box.

**Step 2: Return opened box data for map reveal**

Change `submitTip` to return data the map form needs to trigger the reveal modal. Change the return type:

```typescript
export async function submitTip(formData: FormData): Promise<{
  opened?: boolean;
  openings?: UnboxData[];
} | void> {
```

After opening the box (for premium or auto-verify), fetch the unviewed openings:

```typescript
if (autoVerify || isPremium) {
  const openings = await getUnviewedOpenings(userId);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/collection");
  return { opened: true, openings };
}

revalidatePath("/dashboard");
revalidatePath("/dashboard/collection");
```

Import `getUnviewedOpenings` from `@/lib/boxes`.

**Step 3: Commit**

```bash
git add src/app/dashboard/submit/actions.ts
git commit -m "feat: open boxes immediately for premium and auto-verify users"
```

---

### Task 4: Add openPendingBox Server Action for Free Users

**Files:**
- Create: `src/app/dashboard/collection/actions.ts`
- Modify: `src/lib/boxes.ts` — add `openPendingBox` function

**Step 1: Add openPendingBox to boxes.ts**

```typescript
const PENDING_BOX_DELAY_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function openPendingBox(
  boxId: string,
  userId: string
): Promise<{ creatureName: string; isShiny: boolean; wasUpgrade: boolean; wildCreatureName: string | null } | null> {
  const [box] = await db
    .select()
    .from(creatureBoxes)
    .where(
      and(
        eq(creatureBoxes.id, boxId),
        eq(creatureBoxes.userId, userId),
        eq(creatureBoxes.opened, false)
      )
    )
    .limit(1);

  if (!box) return null;

  // Check if 24 hours have passed
  const elapsed = Date.now() - new Date(box.createdAt).getTime();
  if (elapsed < PENDING_BOX_DELAY_MS) {
    return null;
  }

  // Use the sighting's store to get star tier
  const [sighting] = await db
    .select({ storeId: restockSightings.storeId })
    .from(restockSightings)
    .where(eq(restockSightings.id, box.sightingId))
    .limit(1);

  const starTier = sighting ? getStarTier(sighting.storeId) : null;

  return openBox(box.sightingId, starTier);
}
```

Add import for `restockSightings` from schema and `getStarTier` from wild-creature (already imported).

**Step 2: Create collection/actions.ts server action**

```typescript
"use server";

import { requireUser } from "@/lib/auth";
import { openPendingBox, getUnviewedOpenings } from "@/lib/boxes";
import { revalidatePath } from "next/cache";

export async function openPendingBoxAction(boxId: string) {
  const user = await requireUser();
  const result = await openPendingBox(boxId, user.id);

  if (!result) {
    throw new Error("Box cannot be opened yet");
  }

  revalidatePath("/dashboard/collection");

  // Return the unviewed openings for the reveal modal
  const openings = await getUnviewedOpenings(user.id);
  return { openings };
}
```

**Step 3: Commit**

```bash
git add src/lib/boxes.ts src/app/dashboard/collection/actions.ts
git commit -m "feat: add openPendingBox for free users after 24h delay"
```

---

### Task 5: Collection Page — Countdown Timer & Open Button

**Files:**
- Modify: `src/app/dashboard/collection/page.tsx` — add timer and open button to pending boxes
- Create: `src/components/pending-box-card.tsx` — client component for countdown + open

**Step 1: Create PendingBoxCard client component**

```typescript
"use client";

import { useState, useEffect, useTransition } from "react";
import { openPendingBoxAction } from "@/app/dashboard/collection/actions";

type PendingBoxProps = {
  boxId: string;
  createdAt: string;
  canOpenImmediately: boolean;
  onOpened: (openings: any[]) => void;
};

const DELAY_MS = 24 * 60 * 60 * 1000;

export function PendingBoxCard({ boxId, createdAt, canOpenImmediately, onOpened }: PendingBoxProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (canOpenImmediately) return;

    const update = () => {
      const elapsed = Date.now() - new Date(createdAt).getTime();
      setTimeLeft(Math.max(0, DELAY_MS - elapsed));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [createdAt, canOpenImmediately]);

  const canOpen = canOpenImmediately || timeLeft <= 0;

  const handleOpen = () => {
    startTransition(async () => {
      try {
        const result = await openPendingBoxAction(boxId);
        if (result?.openings) {
          onOpened(result.openings);
        }
      } catch {
        // Will show error state if needed
      }
    });
  };

  // Format countdown
  const hours = Math.floor(timeLeft / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

  return (
    <div className="relative">
      <button
        onClick={canOpen ? handleOpen : undefined}
        disabled={!canOpen || isPending}
        className={`w-12 h-12 rounded-lg flex items-center justify-center text-lg transition-all ${
          canOpen
            ? "bg-gold/20 hover:bg-gold/30 cursor-pointer egg-float border border-gold/40"
            : "bg-gold/10 cursor-default egg-float"
        }`}
        title={canOpen ? "Tap to open!" : `Opens in ${hours}h ${minutes}m`}
      >
        {isPending ? "..." : "📦"}
      </button>
      {!canOpen && (
        <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[9px] text-muted-foreground whitespace-nowrap">
          {hours}h {minutes}m
        </span>
      )}
      {canOpen && !isPending && (
        <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[9px] text-gold font-medium whitespace-nowrap">
          Open!
        </span>
      )}
    </div>
  );
}
```

**Step 2: Update collection page to use PendingBoxCard**

Convert the pending boxes section to use the new client component. The page itself needs to pass `createdAt` as a string and the user's subscription tier. Also, we need a wrapper client component to handle the reveal modal state on the collection page.

Create `src/components/collection-pending-section.tsx` as a client component:

```typescript
"use client";

import { useState } from "react";
import { PendingBoxCard } from "@/components/pending-box-card";
import { UnboxRevealModal } from "@/components/unbox-reveal-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type PendingBox = {
  id: string;
  createdAt: string;
  reportStatus: string;
};

export function CollectionPendingSection({
  pendingBoxes,
  isPremium,
}: {
  pendingBoxes: PendingBox[];
  isPremium: boolean;
}) {
  const [openings, setOpenings] = useState<any[]>([]);

  if (pendingBoxes.length === 0) return null;

  return (
    <>
      <Card className="mb-6 gold-glow">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            Pending Boxes ({pendingBoxes.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap pb-2">
            {pendingBoxes.map((box, idx) => (
              <PendingBoxCard
                key={box.id}
                boxId={box.id}
                createdAt={box.createdAt}
                canOpenImmediately={isPremium}
                onOpened={(newOpenings) => setOpenings(newOpenings)}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {isPremium
              ? "Premium: open your boxes anytime!"
              : "Boxes can be opened after 24 hours, or when your report is verified!"}
          </p>
        </CardContent>
      </Card>

      {openings.length > 0 && (
        <UnboxRevealModal
          openings={openings}
          onComplete={() => {
            setOpenings([]);
            window.location.reload();
          }}
        />
      )}
    </>
  );
}
```

**Step 3: Update collection/page.tsx**

Replace the inline pending boxes section (lines 86-111) with:

```typescript
import { CollectionPendingSection } from "@/components/collection-pending-section";
```

And in the JSX, replace the pending boxes card with:

```tsx
<CollectionPendingSection
  pendingBoxes={pendingBoxes.map((box) => ({
    id: box.id,
    createdAt: box.createdAt.toISOString(),
    reportStatus: box.reportStatus,
  }))}
  isPremium={user.subscriptionTier === "premium"}
/>
```

**Step 4: Commit**

```bash
git add src/components/pending-box-card.tsx src/components/collection-pending-section.tsx src/app/dashboard/collection/page.tsx
git commit -m "feat: add countdown timer and open button for pending boxes on collection page"
```

---

### Task 6: Map Page Reveal Modal for Premium/Auto-Verify Users

**Files:**
- Modify: `src/components/map/map-sighting-form.tsx` — handle opened box data from submitTip response and show reveal modal

**Step 1: Update map-sighting-form.tsx**

The `submitTip` server action now returns `{ opened, openings }` for premium/auto-verify users. After a successful submission, check if the response contains openings and display the reveal modal.

Add state for openings:
```typescript
const [revealOpenings, setRevealOpenings] = useState<any[] | null>(null);
```

In the form submit handler, after calling `submitTip(formData)`, capture the return value:
```typescript
const result = await submitTip(formData);
if (result?.opened && result.openings?.length) {
  setRevealOpenings(result.openings);
}
```

Render the modal at the bottom of the component:
```typescript
{revealOpenings && revealOpenings.length > 0 && (
  <UnboxRevealModal
    openings={revealOpenings}
    onComplete={() => {
      setRevealOpenings(null);
    }}
  />
)}
```

Import `UnboxRevealModal` from `@/components/unbox-reveal-modal`.

**Step 2: Commit**

```bash
git add src/components/map/map-sighting-form.tsx
git commit -m "feat: show reveal modal on map page for premium/auto-verify users"
```

---

### Task 7: Unverified Sighting Visual Flag on Map

**Files:**
- Modify: `src/components/map/store-detail-panel.tsx` — add unverified indicator to sighting list items

**Step 1: Add visual flag to sighting entries**

In the recent sightings list in `store-detail-panel.tsx`, add a visual indicator for unverified sightings. The sighting data already includes the `verified` field from the query.

For each sighting entry, if `s.verified === false`, add a small "?" badge or "(unverified)" label with muted styling:

```tsx
{!s.verified && (
  <span className="text-[10px] text-muted-foreground/60 ml-1">(unverified)</span>
)}
```

Also reduce opacity for unverified entries:
```tsx
<div className={cn("...", !s.verified && "opacity-60")}>
```

**Step 2: Commit**

```bash
git add src/components/map/store-detail-panel.tsx
git commit -m "feat: show unverified flag on sightings in store detail panel"
```

---

### Task 8: Trend Confidence Based on Verified Ratio

**Files:**
- Modify: `src/lib/trends.ts` — accept verified status, compute confidence from ratio

**Step 1: Update analyzeTrends signature**

Change `analyzeTrends` to accept an array of objects with date and verified status instead of just dates:

```typescript
type SightingInput = { date: Date; verified: boolean };

export function analyzeTrends(sightings: SightingInput[]): RestockTrend {
  const total = sightings.length;
  const sightedDates = sightings.map(s => s.date);
  const verifiedCount = sightings.filter(s => s.verified).length;
  const verifiedRatio = total > 0 ? verifiedCount / total : 0;

  // ... existing logic using sightedDates ...

  // Replace the simple count-based confidence with verified-ratio-based:
  const confidence: "low" | "medium" | "high" =
    total < 3 ? "low"
    : verifiedRatio >= 0.6 ? "high"
    : verifiedRatio >= 0.3 ? "medium"
    : "low";
```

**Step 2: Update all callers of analyzeTrends**

Search for all callers and update them to pass the new shape. This likely includes the cron job in `src/app/api/cron/` and any components that call `analyzeTrends`.

**Step 3: Commit**

```bash
git add src/lib/trends.ts
git commit -m "feat: trend confidence based on verified/unverified sighting ratio"
```

---

### Task 9: Build Verification & Final Cleanup

**Step 1: Run the build**

```bash
npm run build
```

Fix any TypeScript errors.

**Step 2: Run lint**

```bash
npm run lint
```

Fix any lint errors.

**Step 3: Final commit if fixes needed**

```bash
git add -A
git commit -m "fix: address build and lint errors from tiered box opening"
```
