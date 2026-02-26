# Dashboard Landing Page Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the map at `/dashboard` with a personal hub showing stats, collection progress, pending boxes, and badges. Move the map to `/dashboard/map`.

**Architecture:** Server Component page at `/dashboard/page.tsx` fetching user record, collection data, and badges in parallel. No new client components needed — purely server-rendered with links to deeper pages.

**Tech Stack:** Next.js App Router, Drizzle ORM, Tailwind CSS, shadcn/ui (Card, Badge), Lucide icons

---

### Task 1: Move map to `/dashboard/map`

**Files:**
- Create: `src/app/dashboard/map/page.tsx`
- Create: `src/app/dashboard/map/actions.ts`
- Modify: `src/app/dashboard/page.tsx`
- Modify: `src/app/dashboard/actions.ts`

**Step 1: Create the map route directory and page**

Create `src/app/dashboard/map/page.tsx` with the exact contents of the current `src/app/dashboard/page.tsx`:

```tsx
import { StoreMap } from "@/components/map/store-map";
import { getStoresWithSightings } from "./actions";
import { db } from "@/db";
import { products } from "@/db/schema";

export default async function MapPage() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID;
  if (!apiKey || !mapId) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-muted-foreground">
        Google Maps API key or Map ID not configured. Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY and NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID to your environment.
      </div>
    );
  }

  const [storesWithSightings, allProducts] = await Promise.all([
    getStoresWithSightings(),
    db.select().from(products),
  ]);

  return <StoreMap initialStores={storesWithSightings} products={allProducts} apiKey={apiKey} mapId={mapId} />;
}
```

**Step 2: Move the map actions file**

Create `src/app/dashboard/map/actions.ts` with the exact contents of `src/app/dashboard/actions.ts` (the `getStoresWithSightings`, `getStoreTrends`, and `markBoxViewedAction` functions).

**Step 3: Update imports in map components that reference the old actions path**

Search for any imports of `@/app/dashboard/actions` or `./actions` in map-related components and update them to `@/app/dashboard/map/actions`.

Run: `grep -r "dashboard/actions" src/components/`

Update any matches to point to `dashboard/map/actions`.

**Step 4: Clear out the old dashboard page**

Replace `src/app/dashboard/page.tsx` with a temporary placeholder:

```tsx
export default function DashboardPage() {
  return <div className="container mx-auto py-4 px-4">Dashboard landing — coming next.</div>;
}
```

**Step 5: Clean up the old actions file**

Replace `src/app/dashboard/actions.ts` — remove the map-specific functions (`getStoresWithSightings`, `getStoreTrends`). Keep `markBoxViewedAction` since it's used by the layout's unbox modal. The file should only contain:

```tsx
"use server";

import { requireUser } from "@/lib/auth";
import { markBoxViewed } from "@/lib/boxes";

export async function markBoxViewedAction(boxId: string) {
  const user = await requireUser();
  await markBoxViewed(user.id, boxId);
}
```

**Step 6: Verify the app builds**

Run: `npm run build`
Expected: Build succeeds with no import errors.

**Step 7: Commit**

```bash
git add src/app/dashboard/map/ src/app/dashboard/page.tsx src/app/dashboard/actions.ts
git commit -m "refactor: move map page to /dashboard/map"
```

---

### Task 2: Update navigation links

**Files:**
- Modify: `src/components/dashboard-nav.tsx`
- Modify: `src/components/site-header.tsx`

**Step 1: Update DashboardNav links**

In `src/components/dashboard-nav.tsx`, change the links array:

```tsx
const links = [
  { href: "/dashboard", label: "Home" },
  { href: "/dashboard/map", label: "Map" },
  { href: "/dashboard/sightings", label: "Sightings" },
  { href: "/dashboard/collection", label: "Collection" },
  { href: "/dashboard/leaderboard", label: "Leaderboard" },
  { href: "/dashboard/heatmap", label: "Heatmap", premium: true },
  { href: "/dashboard/alerts", label: "Alerts", premium: true },
];
```

**Step 2: Update SiteHeader mobile nav links**

In `src/components/site-header.tsx`, change the `dashboardLinks` array to match:

```tsx
const dashboardLinks = [
  { href: "/dashboard", label: "Home" },
  { href: "/dashboard/map", label: "Map" },
  { href: "/dashboard/sightings", label: "Sightings" },
  { href: "/dashboard/collection", label: "Collection" },
  { href: "/dashboard/leaderboard", label: "Leaderboard" },
  { href: "/dashboard/heatmap", label: "Heatmap", premium: true },
  { href: "/dashboard/alerts", label: "Alerts", premium: true },
];
```

**Step 3: Verify the app builds**

Run: `npm run build`
Expected: Build succeeds.

**Step 4: Commit**

```bash
git add src/components/dashboard-nav.tsx src/components/site-header.tsx
git commit -m "feat: update nav links for new dashboard landing + map route"
```

---

### Task 3: Build the dashboard landing page

**Files:**
- Modify: `src/app/dashboard/page.tsx`
- Modify: `src/app/dashboard/actions.ts` (add badge query)

**Step 1: Add a badge query to the dashboard actions**

In `src/app/dashboard/actions.ts`, add a function to fetch the current user's badges:

```tsx
"use server";

import { db } from "@/db";
import { reporterBadges } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { markBoxViewed } from "@/lib/boxes";

export async function markBoxViewedAction(boxId: string) {
  const user = await requireUser();
  await markBoxViewed(user.id, boxId);
}

export async function getUserBadges(userId: string) {
  return db
    .select({
      badgeType: reporterBadges.badgeType,
      earnedAt: reporterBadges.earnedAt,
    })
    .from(reporterBadges)
    .where(eq(reporterBadges.userId, userId))
    .orderBy(desc(reporterBadges.earnedAt));
}
```

**Step 2: Build the landing page**

Replace `src/app/dashboard/page.tsx` with:

```tsx
import { requireUser } from "@/lib/auth";
import { getUserCollection, getCardboardexCompletion } from "@/lib/boxes";
import { TOTAL_CREATURES } from "@/db/creature-data";
import { getUserBadges } from "./actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Map, Flame, Star, ClipboardList, CheckCircle } from "lucide-react";
import Link from "next/link";

const BADGE_LABELS: Record<string, string> = {
  first_report: "First Report",
  verified_10: "10 Verified",
  verified_50: "50 Verified",
  trusted_reporter: "Trusted Reporter",
  top_reporter: "Top Reporter",
  streak_7: "7-Day Streak",
  streak_30: "30-Day Streak",
  cardboardex_50: "50 Creatures",
  cardboardex_complete: "Cardboardex Complete",
};

export default async function DashboardPage() {
  const user = await requireUser();

  const [allBoxes, badges] = await Promise.all([
    getUserCollection(user.id),
    getUserBadges(user.id),
  ]);

  const openedBoxes = allBoxes.filter((b) => b.opened && b.creatureId);
  const pendingBoxes = allBoxes.filter((b) => !b.opened);
  const uniqueCaught = getCardboardexCompletion(openedBoxes);
  const accuracy =
    user.totalReports > 0
      ? Math.round((user.verifiedReports / user.totalReports) * 100)
      : 0;

  return (
    <div className="container mx-auto py-4 px-4 max-w-2xl">
      <h2 className="text-xl font-semibold mb-6">Welcome back</h2>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="flex items-center gap-2 rounded-lg border bg-card p-3">
          <Flame className="w-4 h-4 text-orange-500" />
          <div>
            <div className="text-xs text-muted-foreground">Streak</div>
            <div className="font-semibold">{user.currentStreak}d</div>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg border bg-card p-3">
          <Star className="w-4 h-4 text-yellow-500" />
          <div>
            <div className="text-xs text-muted-foreground">Trust</div>
            <div className="font-semibold">{user.trustScore}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg border bg-card p-3">
          <ClipboardList className="w-4 h-4 text-blue-500" />
          <div>
            <div className="text-xs text-muted-foreground">Reports</div>
            <div className="font-semibold">{user.totalReports}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg border bg-card p-3">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <div>
            <div className="text-xs text-muted-foreground">Accuracy</div>
            <div className="font-semibold">{accuracy}%</div>
          </div>
        </div>
      </div>

      {/* Quick Action */}
      <Link href="/dashboard/map" className="block mb-6">
        <Button className="w-full" size="lg">
          <Map className="w-4 h-4 mr-2" />
          Open Map
        </Button>
      </Link>

      {/* Pending Boxes */}
      {pendingBoxes.length > 0 && (
        <Card className="mb-6 gold-glow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">
                  You have{" "}
                  <span className="text-primary font-bold">
                    {pendingBoxes.length} {pendingBoxes.length === 1 ? "box" : "boxes"}
                  </span>{" "}
                  waiting to open!
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Boxes open when your report is verified.
                </p>
              </div>
              <Link href="/dashboard/collection">
                <Button variant="outline" size="sm">
                  View Collection
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Collection Progress */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Cardboardex</CardTitle>
            <Link
              href="/dashboard/collection"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              View all &rarr;
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">
              {uniqueCaught}/{TOTAL_CREATURES} discovered
            </span>
            <span className="font-medium">
              {Math.round((uniqueCaught / TOTAL_CREATURES) * 100)}%
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-primary to-accent rounded-full h-3 transition-all"
              style={{ width: `${(uniqueCaught / TOTAL_CREATURES) * 100}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Badges */}
      {badges.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Badges</CardTitle>
              <Link
                href="/dashboard/leaderboard"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Leaderboard &rarr;
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {badges.map((b) => (
                <Badge key={b.badgeType} variant="secondary">
                  {BADGE_LABELS[b.badgeType] ?? b.badgeType}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

**Step 3: Verify the app builds**

Run: `npm run build`
Expected: Build succeeds.

**Step 4: Commit**

```bash
git add src/app/dashboard/page.tsx src/app/dashboard/actions.ts
git commit -m "feat: add dashboard landing page with stats, progress, and badges"
```

---

### Task 4: Fix any broken action imports

**Files:**
- Potentially: any component importing from `@/app/dashboard/actions` for map functions

**Step 1: Search for stale imports**

Run: `grep -rn "from.*dashboard/actions" src/components/ src/app/dashboard/`

Check each result. Any import of `getStoresWithSightings`, `getStoreTrends`, or map-related functions should now point to `@/app/dashboard/map/actions` instead of `@/app/dashboard/actions`.

**Step 2: Fix any broken imports found**

Update the import paths.

**Step 3: Final build verification**

Run: `npm run build`
Expected: Build succeeds with zero errors.

**Step 4: Run dev server and smoke test**

Run: `npm run dev`

Verify:
- `/dashboard` shows the new landing page with stats bar, Open Map button, collection progress
- `/dashboard/map` shows the interactive map
- Nav links all work (Home, Map, Sightings, Collection, Leaderboard)
- Mobile hamburger menu links are updated

**Step 5: Commit if any fixes were needed**

```bash
git add -A
git commit -m "fix: update stale action imports after map route move"
```
