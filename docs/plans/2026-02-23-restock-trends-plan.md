# Restock Trends Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Show restock frequency grades and day/time patterns in the store detail panel, computed from verified "found" sightings.

**Architecture:** New `src/lib/trends.ts` with pure `analyzeTrends()` function. New `getStoreTrends(storeId)` server action queries verified found sightings and runs analysis. `StoreDetailPanel` fetches trends on mount via `useEffect` and displays a compact trend card.

**Tech Stack:** Next.js 16 (App Router, server actions), React 19, Drizzle ORM + Neon PostgreSQL, TypeScript

---

### Task 1: Create `analyzeTrends` Function

**Files:**
- Create: `src/lib/trends.ts`

**Step 1: Create the trends analysis module**

```ts
export interface RestockTrend {
  grade: "hot" | "warm" | "cool" | "cold";
  avgDaysBetween: number | null;
  totalSightings: number;
  bestDay: string | null;
  bestTimeWindow: string | null;
  confidence: "low" | "medium" | "high";
}

const DAY_NAMES = ["Sundays", "Mondays", "Tuesdays", "Wednesdays", "Thursdays", "Fridays", "Saturdays"];

function getGrade(avgDays: number | null, total: number): "hot" | "warm" | "cool" | "cold" {
  if (total < 3 || avgDays === null) return "cold";
  if (avgDays < 3) return "hot";
  if (avgDays <= 7) return "warm";
  if (avgDays <= 14) return "cool";
  return "cold";
}

function getBarPercent(grade: "hot" | "warm" | "cool" | "cold"): number {
  switch (grade) {
    case "hot": return 90;
    case "warm": return 65;
    case "cool": return 35;
    case "cold": return 15;
  }
}

function getBestDay(dates: Date[]): string | null {
  const dayCounts = new Array(7).fill(0);
  for (const d of dates) {
    dayCounts[d.getDay()]++;
  }
  const maxCount = Math.max(...dayCounts);
  if (maxCount < 2) return null;
  const bestIdx = dayCounts.indexOf(maxCount);
  return DAY_NAMES[bestIdx];
}

function getBestTimeWindow(dates: Date[]): string | null {
  const buckets = { morning: 0, afternoon: 0, evening: 0 };
  for (const d of dates) {
    const h = d.getHours();
    if (h >= 6 && h < 12) buckets.morning++;
    else if (h >= 12 && h < 17) buckets.afternoon++;
    else if (h >= 17 && h < 21) buckets.evening++;
    // Outside ranges: ignored
  }
  const entries = Object.entries(buckets) as [string, number][];
  entries.sort((a, b) => b[1] - a[1]);
  if (entries[0][1] < 3) return null;
  return entries[0][0];
}

export function analyzeTrends(sightedDates: Date[]): RestockTrend {
  const total = sightedDates.length;

  if (total < 2) {
    return {
      grade: "cold",
      avgDaysBetween: null,
      totalSightings: total,
      bestDay: null,
      bestTimeWindow: null,
      confidence: "low",
    };
  }

  // Sort chronologically
  const sorted = [...sightedDates].sort((a, b) => a.getTime() - b.getTime());

  // Average days between sightings
  const firstMs = sorted[0].getTime();
  const lastMs = sorted[sorted.length - 1].getTime();
  const spanDays = (lastMs - firstMs) / (1000 * 60 * 60 * 24);
  const avgDays = spanDays / (total - 1);

  const grade = getGrade(avgDays, total);

  const confidence: "low" | "medium" | "high" =
    total < 3 ? "low" : total < 5 ? "medium" : "high";

  const bestDay = total >= 3 ? getBestDay(sorted) : null;
  const bestTimeWindow = total >= 5 ? getBestTimeWindow(sorted) : null;

  return {
    grade,
    avgDaysBetween: Math.round(avgDays * 10) / 10,
    totalSightings: total,
    bestDay,
    bestTimeWindow,
    confidence,
  };
}

export { getBarPercent };
```

**Step 2: Type check**

Run: `npx tsc --noEmit`
Expected: No errors.

**Step 3: Commit**

```bash
git add src/lib/trends.ts
git commit -m "feat: add restock trend analysis function"
```

---

### Task 2: Add `getStoreTrends` Server Action

**Files:**
- Modify: `src/app/dashboard/actions.ts`

**Step 1: Add the server action**

Add these imports at the top of `src/app/dashboard/actions.ts`:

```ts
import { analyzeTrends } from "@/lib/trends";
```

Then add this function at the end of the file:

```ts
export async function getStoreTrends(storeId: string) {
  const sightings = await db
    .select({ sightedAt: restockSightings.sightedAt })
    .from(restockSightings)
    .where(
      and(
        eq(restockSightings.storeId, storeId),
        eq(restockSightings.status, "found"),
        eq(restockSightings.verified, true)
      )
    );

  const dates = sightings.map((s) => new Date(s.sightedAt));
  return analyzeTrends(dates);
}
```

**Step 2: Type check**

Run: `npx tsc --noEmit`
Expected: No errors.

**Step 3: Commit**

```bash
git add src/app/dashboard/actions.ts
git commit -m "feat: add getStoreTrends server action"
```

---

### Task 3: Add Trend Display to StoreDetailPanel

**Files:**
- Modify: `src/components/map/store-detail-panel.tsx`

**Step 1: Add imports and state**

Add to the existing imports at the top:

```ts
import { useEffect } from "react";
import { getStoreTrends } from "@/app/dashboard/actions";
import type { RestockTrend } from "@/lib/trends";
import { getBarPercent } from "@/lib/trends";
```

Update the `useState` import line from:

```ts
import { useState } from "react";
```

to:

```ts
import { useState, useEffect } from "react";
```

(Remove the separate `useEffect` import if you added it — combine into one.)

**Step 2: Add trend state and fetching**

Inside the `StoreDetailPanel` component, after `const [showForm, setShowForm] = useState(false);`, add:

```ts
  const [trend, setTrend] = useState<RestockTrend | null>(null);

  useEffect(() => {
    getStoreTrends(store.id).then(setTrend);
  }, [store.id]);
```

**Step 3: Add the trend display JSX**

Insert this block between the "Quick stats" `</div>` (after line 69) and the `{/* Recent sightings */}` comment (line 71):

```tsx
        {/* Restock Intel */}
        {trend && (
          <div className="bg-muted/50 rounded-lg px-3 py-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Restock Intel</span>
              {trend.confidence === "low" ? (
                <span className="text-xs text-muted-foreground">Not enough data</span>
              ) : (
                <span className="text-sm font-semibold">
                  {trend.grade === "hot" && "🔥 Hot"}
                  {trend.grade === "warm" && "🌤️ Warm"}
                  {trend.grade === "cool" && "🌙 Cool"}
                  {trend.grade === "cold" && "🧊 Cold"}
                </span>
              )}
            </div>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
                style={{ width: `${trend.confidence === "low" ? 0 : getBarPercent(trend.grade)}%` }}
              />
            </div>
            {trend.confidence === "low" ? (
              <p className="text-xs text-muted-foreground">Need 3+ verified reports to show patterns</p>
            ) : (
              <div className="text-xs text-muted-foreground space-y-0.5">
                {trend.avgDaysBetween !== null && (
                  <p>Restocks every ~{Math.round(trend.avgDaysBetween)} days</p>
                )}
                {(trend.bestDay || trend.bestTimeWindow) && (
                  <p>
                    {[trend.bestDay, trend.bestTimeWindow].filter(Boolean).join(", ")}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
```

**Step 4: Type check**

Run: `npx tsc --noEmit`
Expected: No errors.

**Step 5: Commit**

```bash
git add src/components/map/store-detail-panel.tsx
git commit -m "feat: show restock trend intel in store detail panel"
```

---

### Task 4: Final Build Verification

**Step 1: Full type check**

Run: `npx tsc --noEmit`
Expected: No type errors.

**Step 2: Build**

Run: `npm run build`
Expected: Build succeeds (may fail at static generation due to missing DB env — that's pre-existing and OK as long as compilation passes).

**Step 3: Commit any fixups if needed**

If build revealed issues, fix and commit.
