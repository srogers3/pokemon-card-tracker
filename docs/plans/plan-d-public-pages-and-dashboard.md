# Pokemon Card Tracker - Implementation Plan D: Public Pages and Dashboard

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a Next.js web app for tracking Pokemon card restock sightings at retail stores, with free/premium tiers, admin tools, and pattern analytics.

**Architecture:** Next.js 14 App Router with server components by default. Neon PostgreSQL via Drizzle ORM for data. Clerk for auth with DB-stored subscription tiers. Stripe for payments. Server actions and API routes for mutations.

**Tech Stack:** Next.js 14+, TypeScript, Tailwind CSS, shadcn/ui, Drizzle ORM, Neon PostgreSQL, Clerk, Stripe, Resend, Vercel

**Reference:** Design doc at `docs/plans/2026-02-21-pokemon-card-tracker-design.md`

**Prerequisites:** Plans A-C completed (project scaffolded, database ready, auth configured, admin CRUD pages built).

---

## Phase 6: Public Pages

### Task 6.1: Landing Page

**Files:**
- Modify: `src/app/page.tsx`
- Create: `src/components/site-header.tsx`

**Step 1: Create site header**

Create `src/components/site-header.tsx`:

```tsx
import Link from "next/link";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="border-b">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold">
          Pokemon Card Tracker
        </Link>
        <nav className="flex items-center gap-4">
          <SignedIn>
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                Dashboard
              </Button>
            </Link>
            <UserButton />
          </SignedIn>
          <SignedOut>
            <Link href="/sign-in">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/sign-up">
              <Button size="sm">Get Started</Button>
            </Link>
          </SignedOut>
        </nav>
      </div>
    </header>
  );
}
```

**Step 2: Create landing page**

Replace `src/app/page.tsx`:

```tsx
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { db } from "@/db";
import { restockSightings, stores, products } from "@/db/schema";
import { desc, eq, and, gte } from "drizzle-orm";

export default async function LandingPage() {
  const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

  const recentSightings = await db
    .select({
      storeName: stores.name,
      storeLocation: stores.locationLabel,
      productName: products.name,
      status: restockSightings.status,
      sightedAt: restockSightings.sightedAt,
    })
    .from(restockSightings)
    .innerJoin(stores, eq(restockSightings.storeId, stores.id))
    .innerJoin(products, eq(restockSightings.productId, products.id))
    .where(
      and(
        eq(restockSightings.verified, true),
        gte(restockSightings.sightedAt, fortyEightHoursAgo)
      )
    )
    .orderBy(desc(restockSightings.sightedAt))
    .limit(5);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main>
        {/* Hero */}
        <section className="py-20 px-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Never Miss a Restock
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            Track Pokemon card availability at retail stores near you. Get
            alerts when products restock and discover the best times to check.
          </p>
          <div className="mt-10 flex gap-4 justify-center">
            <Link href="/sign-up">
              <Button size="lg">Start Tracking — Free</Button>
            </Link>
            <Link href="/sign-in">
              <Button variant="outline" size="lg">
                Sign In
              </Button>
            </Link>
          </div>
        </section>

        {/* Recent Sightings */}
        {recentSightings.length > 0 && (
          <section className="py-12 px-4 bg-muted/50">
            <div className="container mx-auto">
              <h2 className="text-2xl font-bold mb-6 text-center">
                Recent Sightings
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto">
                {recentSightings.map((sighting, i) => (
                  <Card key={i}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">
                        {sighting.productName}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        {sighting.storeName} — {sighting.storeLocation}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(sighting.sightedAt).toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Features */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-2xl font-bold mb-8 text-center">
              Why Go Premium?
            </h2>
            <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Restock Heatmaps</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  See the best days and times to check each store based on
                  historical restock patterns.
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Email Alerts</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Get notified when products you want are spotted at stores in
                  your area.
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Full History</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Access all sighting data with advanced filters by store,
                  product, region, and date.
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
```

**Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds.

**Step 4: Commit**

```bash
git add src/app/page.tsx src/components/site-header.tsx
git commit -m "feat: add landing page with hero, recent sightings, and premium features"
```

---

## Phase 7: Free Dashboard & Product Catalog

### Task 7.1: Dashboard Layout

**Files:**
- Create: `src/app/dashboard/layout.tsx`
- Create: `src/components/dashboard-nav.tsx`

**Step 1: Create dashboard nav**

Create `src/components/dashboard-nav.tsx`:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Sightings" },
  { href: "/dashboard/products", label: "Products" },
  { href: "/dashboard/heatmap", label: "Heatmap", premium: true },
  { href: "/dashboard/alerts", label: "Alerts", premium: true },
  { href: "/dashboard/submit", label: "Submit Tip", premium: true },
];

export function DashboardNav({ isPremium }: { isPremium: boolean }) {
  const pathname = usePathname();

  return (
    <nav className="flex gap-4 border-b pb-4 mb-6">
      {links.map((link) => {
        if (link.premium && !isPremium) return null;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary",
              pathname === link.href
                ? "text-primary"
                : "text-muted-foreground"
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
```

**Step 2: Create dashboard layout**

Create `src/app/dashboard/layout.tsx`:

```tsx
import { requireUser } from "@/lib/auth";
import { SiteHeader } from "@/components/site-header";
import { DashboardNav } from "@/components/dashboard-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="container mx-auto py-8 px-4">
        <DashboardNav isPremium={user.subscriptionTier === "premium"} />
        {children}
      </div>
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add src/app/dashboard/layout.tsx src/components/dashboard-nav.tsx
git commit -m "feat: add dashboard layout with tier-aware navigation"
```

### Task 7.2: Free Dashboard — Recent Sightings (48h)

**Files:**
- Create: `src/app/dashboard/page.tsx`

**Step 1: Create dashboard page**

Create `src/app/dashboard/page.tsx`:

```tsx
import { db } from "@/db";
import { restockSightings, stores, products } from "@/db/schema";
import { desc, eq, and, gte } from "drizzle-orm";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getCurrentUser } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const isPremium = user?.subscriptionTier === "premium";
  const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

  const sightings = await db
    .select({
      id: restockSightings.id,
      storeName: stores.name,
      storeLocation: stores.locationLabel,
      productName: products.name,
      sightedAt: restockSightings.sightedAt,
      status: restockSightings.status,
      notes: restockSightings.notes,
    })
    .from(restockSightings)
    .innerJoin(stores, eq(restockSightings.storeId, stores.id))
    .innerJoin(products, eq(restockSightings.productId, products.id))
    .where(
      and(
        eq(restockSightings.verified, true),
        isPremium ? undefined : gte(restockSightings.sightedAt, fortyEightHoursAgo)
      )
    )
    .orderBy(desc(restockSightings.sightedAt))
    .limit(isPremium ? 200 : 50);

  const statusVariant = (status: string) => {
    if (status === "in_stock") return "default" as const;
    if (status === "limited") return "secondary" as const;
    return "destructive" as const;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">
          {isPremium ? "All Sightings" : "Recent Sightings (Last 48h)"}
        </h2>
        {!isPremium && (
          <Link href="/dashboard/upgrade">
            <Button size="sm">Upgrade for Full History</Button>
          </Link>
        )}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>Store</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Sighted</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sightings.map((s) => (
            <TableRow key={s.id}>
              <TableCell className="font-medium">{s.productName}</TableCell>
              <TableCell>{s.storeName}</TableCell>
              <TableCell>{s.storeLocation}</TableCell>
              <TableCell>
                <Badge variant={statusVariant(s.status)}>{s.status}</Badge>
              </TableCell>
              <TableCell>
                {new Date(s.sightedAt).toLocaleString()}
              </TableCell>
            </TableRow>
          ))}
          {sightings.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                No sightings found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Premium teaser */}
      {!isPremium && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-base">Unlock More Features</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Premium members get full sighting history, restock heatmaps, email
            alerts, and the ability to submit community tips.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

**Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds.

**Step 3: Commit**

```bash
git add src/app/dashboard/page.tsx
git commit -m "feat: add dashboard with recent sightings and premium teaser"
```

### Task 7.3: Product Catalog

**Files:**
- Create: `src/app/dashboard/products/page.tsx`

**Step 1: Create product catalog page**

Create `src/app/dashboard/products/page.tsx`:

```tsx
import { db } from "@/db";
import { products, restockSightings } from "@/db/schema";
import { desc, eq, gte, count } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function ProductCatalogPage() {
  const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

  const allProducts = await db.select().from(products).orderBy(products.setName, products.name);

  // Get recent sighting counts per product
  const recentCounts = await db
    .select({
      productId: restockSightings.productId,
      sightingCount: count(),
    })
    .from(restockSightings)
    .where(
      gte(restockSightings.sightedAt, fortyEightHoursAgo)
    )
    .groupBy(restockSightings.productId);

  const countMap = new Map(
    recentCounts.map((r) => [r.productId, r.sightingCount])
  );

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Product Catalog</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {allProducts.map((product) => {
          const recentCount = countMap.get(product.id) ?? 0;
          return (
            <Card key={product.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{product.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">{product.setName}</Badge>
                  <Badge variant="secondary">{product.productType}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {recentCount > 0
                    ? `${recentCount} sighting${recentCount > 1 ? "s" : ""} in last 48h`
                    : "No recent sightings"}
                </p>
              </CardContent>
            </Card>
          );
        })}
        {allProducts.length === 0 && (
          <p className="text-muted-foreground col-span-full">
            No products being tracked yet.
          </p>
        )}
      </div>
    </div>
  );
}
```

**Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds.

**Step 3: Commit**

```bash
git add src/app/dashboard/products/
git commit -m "feat: add product catalog page with recent sighting counts"
```

---
