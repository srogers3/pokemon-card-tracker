# Sightings Page Redesign — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the broken table-based sightings page with a mobile-friendly card feed featuring "Near You" and "All Recent" tabs.

**Architecture:** Client component wrapper with tabs that call server actions. "Near You" tab requests GPS and passes coordinates to a server action that filters by distance. Both tabs render the same `SightingCard` component. Server component handles auth/premium check and passes props down.

**Tech Stack:** Next.js App Router, Drizzle ORM, shadcn Tabs, Lucide icons, Tailwind CSS

---

### Task 1: Add `timeAgo` utility to `src/lib/utils.ts`

**Files:**
- Modify: `src/lib/utils.ts`

**Step 1: Add the `timeAgo` function**

Append to `src/lib/utils.ts`:

```typescript
/** Format a date as relative time ("2h ago", "Yesterday", "3 days ago"). */
export function timeAgo(date: Date): string {
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay === 1) return "Yesterday";
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}
```

**Step 2: Commit**

```bash
git add src/lib/utils.ts
git commit -m "feat: add timeAgo relative date utility"
```

---

### Task 2: Create server actions for sighting queries

**Files:**
- Create: `src/app/dashboard/sightings/actions.ts`

**Step 1: Create the server actions file**

Reference the existing query pattern in `src/app/dashboard/actions.ts` (lines 20-39) which uses `leftJoin` on products. The users table (`src/db/schema.ts` lines 116-130) has `email` but no displayName — use `email.split("@")[0]` like the leaderboard does (`src/app/dashboard/leaderboard/page.tsx` line 160).

```typescript
"use server";

import { db } from "@/db";
import { restockSightings, stores, products, users } from "@/db/schema";
import { desc, gte, and, isNotNull, eq } from "drizzle-orm";
import { getDistanceMeters } from "@/lib/utils";

export type SightingItem = {
  id: string;
  storeName: string;
  storeLocation: string;
  productName: string | null;
  status: "found" | "not_found";
  sightedAt: Date;
  verified: boolean;
  notes: string | null;
  reporterName: string;
  source: "admin" | "community";
};

const NEARBY_RADIUS_M = 40_234; // ~25 miles

async function querySightings(isPremium: boolean) {
  const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

  return db
    .select({
      id: restockSightings.id,
      storeId: restockSightings.storeId,
      storeName: stores.name,
      storeLocation: stores.locationLabel,
      storeLat: stores.latitude,
      storeLng: stores.longitude,
      productName: products.name,
      status: restockSightings.status,
      sightedAt: restockSightings.sightedAt,
      verified: restockSightings.verified,
      notes: restockSightings.notes,
      reporterEmail: users.email,
      source: restockSightings.source,
    })
    .from(restockSightings)
    .innerJoin(stores, eq(restockSightings.storeId, stores.id))
    .leftJoin(products, eq(restockSightings.productId, products.id))
    .innerJoin(users, eq(restockSightings.reportedBy, users.id))
    .where(
      isPremium ? undefined : gte(restockSightings.sightedAt, fortyEightHoursAgo)
    )
    .orderBy(desc(restockSightings.sightedAt))
    .limit(isPremium ? 200 : 50);
}

function toSightingItem(row: Awaited<ReturnType<typeof querySightings>>[number]): SightingItem {
  return {
    id: row.id,
    storeName: row.storeName,
    storeLocation: row.storeLocation,
    productName: row.productName,
    status: row.status,
    sightedAt: row.sightedAt,
    verified: row.verified,
    notes: row.notes,
    reporterName: row.reporterEmail.split("@")[0],
    source: row.source,
  };
}

export async function getRecentSightings(isPremium: boolean): Promise<SightingItem[]> {
  const rows = await querySightings(isPremium);
  return rows.map(toSightingItem);
}

export async function getNearbySightings(
  lat: number,
  lng: number,
  isPremium: boolean
): Promise<SightingItem[]> {
  const rows = await querySightings(isPremium);

  return rows
    .filter((row) => {
      if (row.storeLat == null || row.storeLng == null) return false;
      return getDistanceMeters(lat, lng, row.storeLat, row.storeLng) <= NEARBY_RADIUS_M;
    })
    .map(toSightingItem);
}
```

**Step 2: Commit**

```bash
git add src/app/dashboard/sightings/actions.ts
git commit -m "feat: add server actions for sightings feed with leftJoin fix"
```

---

### Task 3: Create `SightingCard` component

**Files:**
- Create: `src/components/sighting-card.tsx`

**Step 1: Create the card component**

Reference existing Badge variants in the codebase (`variant="found"` and `variant="notFound"` used in current sightings page line 80). Use Lucide icons `CheckCircle2` for verified and `MapPin` for location.

```tsx
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import { timeAgo } from "@/lib/utils";
import type { SightingItem } from "@/app/dashboard/sightings/actions";

export function SightingCard({ sighting }: { sighting: SightingItem }) {
  const isFound = sighting.status === "found";

  return (
    <Card className={`p-3 border-l-4 ${isFound ? "border-l-green-500" : "border-l-red-500"}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm truncate">{sighting.storeName}</span>
            <span className="text-xs text-muted-foreground shrink-0">
              {timeAgo(new Date(sighting.sightedAt))}
            </span>
          </div>
          <p className="text-xs text-muted-foreground truncate">{sighting.storeLocation}</p>
        </div>
        <Badge variant={isFound ? "found" : "notFound"} className="shrink-0">
          {isFound ? "Found" : "Not Found"}
        </Badge>
      </div>

      {sighting.productName && (
        <p className="text-sm mt-1.5">{sighting.productName}</p>
      )}

      {sighting.notes && (
        <p className="text-xs text-muted-foreground italic mt-1 line-clamp-2">
          {sighting.notes}
        </p>
      )}

      <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
        <span>{sighting.reporterName}</span>
        {sighting.verified && (
          <CheckCircle2 className="size-3.5 text-green-500" />
        )}
      </div>
    </Card>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/sighting-card.tsx
git commit -m "feat: add SightingCard component for mobile-friendly feed"
```

---

### Task 4: Create `SightingsFeed` client component

**Files:**
- Create: `src/components/sightings-feed.tsx`

**Step 1: Create the client component with tabs and GPS logic**

Uses shadcn Tabs (`src/components/ui/tabs.tsx` exports `Tabs, TabsList, TabsTrigger, TabsContent`). GPS pattern: `navigator.geolocation.getCurrentPosition` on mount, same as map components use.

```tsx
"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SightingCard } from "@/components/sighting-card";
import { getRecentSightings, getNearbySightings } from "@/app/dashboard/sightings/actions";
import type { SightingItem } from "@/app/dashboard/sightings/actions";
import { MapPin, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
      ))}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <p className="text-center text-muted-foreground py-12 text-sm">{message}</p>
  );
}

export function SightingsFeed({ isPremium }: { isPremium: boolean }) {
  const [recentSightings, setRecentSightings] = useState<SightingItem[] | null>(null);
  const [nearbySightings, setNearbySightings] = useState<SightingItem[] | null>(null);
  const [locationStatus, setLocationStatus] = useState<"loading" | "granted" | "denied" | "error">("loading");

  // Fetch global sightings on mount
  useEffect(() => {
    getRecentSightings(isPremium).then(setRecentSightings);
  }, [isPremium]);

  // Request GPS and fetch nearby sightings
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationStatus("denied");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationStatus("granted");
        getNearbySightings(position.coords.latitude, position.coords.longitude, isPremium)
          .then(setNearbySightings);
      },
      () => {
        setLocationStatus("denied");
      }
    );
  }, [isPremium]);

  function retryLocation() {
    setLocationStatus("loading");
    setNearbySightings(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationStatus("granted");
        getNearbySightings(position.coords.latitude, position.coords.longitude, isPremium)
          .then(setNearbySightings);
      },
      () => {
        setLocationStatus("denied");
      }
    );
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="nearby">
        <TabsList className="sticky top-0 z-10 w-full">
          <TabsTrigger value="nearby" className="flex-1 gap-1.5">
            <MapPin className="size-4" />
            Near You
          </TabsTrigger>
          <TabsTrigger value="all" className="flex-1 gap-1.5">
            <Globe className="size-4" />
            All Recent
          </TabsTrigger>
        </TabsList>

        <TabsContent value="nearby">
          {locationStatus === "loading" && <LoadingSkeleton />}
          {locationStatus === "denied" && (
            <div className="text-center py-12 space-y-3">
              <p className="text-sm text-muted-foreground">Enable location to see sightings near you.</p>
              <Button variant="outline" size="sm" onClick={retryLocation}>
                Try Again
              </Button>
            </div>
          )}
          {locationStatus === "granted" && nearbySightings === null && <LoadingSkeleton />}
          {locationStatus === "granted" && nearbySightings !== null && nearbySightings.length === 0 && (
            <EmptyState message="No recent sightings nearby. Be the first to report!" />
          )}
          {nearbySightings && nearbySightings.length > 0 && (
            <div className="grid gap-3 md:grid-cols-2">
              {nearbySightings.map((s) => (
                <SightingCard key={s.id} sighting={s} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="all">
          {recentSightings === null && <LoadingSkeleton />}
          {recentSightings !== null && recentSightings.length === 0 && (
            <EmptyState message="No sightings yet." />
          )}
          {recentSightings && recentSightings.length > 0 && (
            <div className="grid gap-3 md:grid-cols-2">
              {recentSightings.map((s) => (
                <SightingCard key={s.id} sighting={s} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {!isPremium && (
        <Card className="card-hover border-gold/30 gold-glow">
          <CardHeader>
            <CardTitle className="text-base">Unlock More Features</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Premium members get full sighting history, restock heatmaps, and email alerts.{" "}
            <Link href="/dashboard/upgrade" className="text-gold font-medium hover:underline">
              Upgrade now
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/sightings-feed.tsx
git commit -m "feat: add SightingsFeed client component with tabs and GPS"
```

---

### Task 5: Replace `page.tsx` with slim server wrapper

**Files:**
- Modify: `src/app/dashboard/sightings/page.tsx`

**Step 1: Rewrite the page as a thin server component**

The page does auth + premium check and renders the client feed. The current file (`src/app/dashboard/sightings/page.tsx`) is 110 lines — replace entirely.

```tsx
import { getCurrentUser } from "@/lib/auth";
import { SightingsFeed } from "@/components/sightings-feed";

export default async function SightingsPage() {
  const user = await getCurrentUser();
  const isPremium = user?.subscriptionTier === "premium";

  return (
    <div className="container mx-auto py-4 px-4 max-w-2xl">
      <h2 className="text-xl font-semibold mb-4">Sightings</h2>
      <SightingsFeed isPremium={isPremium} />
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/dashboard/sightings/page.tsx
git commit -m "feat: replace sightings table page with card feed layout"
```

---

### Task 6: Verify build and test in browser

**Step 1: Run the build to check for type errors**

```bash
npm run build
```

Expected: Build succeeds with no type errors.

**Step 2: Start dev server and test in browser**

```bash
npm run dev
```

Test:
1. Navigate to `/dashboard/sightings`
2. Confirm "Near You" tab requests GPS and shows nearby sightings (or denied state)
3. Switch to "All Recent" tab — confirm all sightings show including "not found" reports
4. Verify cards display: store name, location, product (when found), status badge, relative time, reporter name, verified checkmark
5. Resize to mobile width — confirm single-column layout, no horizontal scroll
6. Verify test submissions appear (previously hidden by innerJoin + verified filter)

**Step 3: Commit any fixups**

```bash
git add -A
git commit -m "fix: address build/runtime issues from sightings redesign"
```
