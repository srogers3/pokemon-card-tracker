# Pokemon Card Tracker - Implementation Plan F: Premium Features

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a Next.js web app for tracking Pokemon card restock sightings at retail stores, with free/premium tiers, admin tools, and pattern analytics.

**Architecture:** Next.js 14 App Router with server components by default. Neon PostgreSQL via Drizzle ORM for data. Clerk for auth with DB-stored subscription tiers. Stripe for payments. Server actions and API routes for mutations.

**Tech Stack:** Next.js 14+, TypeScript, Tailwind CSS, shadcn/ui, Drizzle ORM, Neon PostgreSQL, Clerk, Stripe, Resend, Vercel

**Reference:** Design doc at `docs/plans/2026-02-21-pokemon-card-tracker-design.md`

**Prerequisites:** Plans A-E completed (project scaffolded, database ready, auth configured, admin/dashboard pages built, Stripe integration working).

---

## Phase 9: Premium Features

### Task 9.1: Restock Heatmap

**Files:**
- Create: `src/app/dashboard/heatmap/page.tsx`
- Create: `src/components/heatmap-grid.tsx`

**Step 1: Create heatmap grid component**

Create `src/components/heatmap-grid.tsx`:

```tsx
"use client";

import { cn } from "@/lib/utils";

type HeatmapData = {
  dayOfWeek: number;
  hourOfDay: number;
  frequencyCount: number;
}[];

const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const hours = Array.from({ length: 24 }, (_, i) => i);

function getColor(count: number, max: number) {
  if (count === 0) return "bg-muted";
  const intensity = count / max;
  if (intensity < 0.25) return "bg-green-200 dark:bg-green-900";
  if (intensity < 0.5) return "bg-green-400 dark:bg-green-700";
  if (intensity < 0.75) return "bg-green-600 dark:bg-green-500";
  return "bg-green-800 dark:bg-green-300";
}

export function HeatmapGrid({ data }: { data: HeatmapData }) {
  const dataMap = new Map(
    data.map((d) => [`${d.dayOfWeek}-${d.hourOfDay}`, d.frequencyCount])
  );
  const max = Math.max(...data.map((d) => d.frequencyCount), 1);

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[700px]">
        {/* Hour labels */}
        <div className="flex gap-1 mb-1 ml-12">
          {hours.map((h) => (
            <div
              key={h}
              className="w-6 text-xs text-center text-muted-foreground"
            >
              {h % 3 === 0 ? `${h}` : ""}
            </div>
          ))}
        </div>
        {/* Grid rows */}
        {days.map((day, dayIdx) => (
          <div key={day} className="flex items-center gap-1 mb-1">
            <span className="w-10 text-xs text-muted-foreground text-right mr-1">
              {day}
            </span>
            {hours.map((hour) => {
              const count = dataMap.get(`${dayIdx}-${hour}`) ?? 0;
              return (
                <div
                  key={hour}
                  className={cn(
                    "w-6 h-6 rounded-sm",
                    getColor(count, max)
                  )}
                  title={`${day} ${hour}:00 — ${count} sighting${count !== 1 ? "s" : ""}`}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Step 2: Create heatmap page**

Create `src/app/dashboard/heatmap/page.tsx`:

```tsx
import { requirePremium } from "@/lib/auth";
import { db } from "@/db";
import { restockPatterns, stores } from "@/db/schema";
import { eq } from "drizzle-orm";
import { HeatmapGrid } from "@/components/heatmap-grid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function HeatmapPage() {
  await requirePremium();

  // Get all patterns grouped by store
  const patterns = await db
    .select({
      storeId: restockPatterns.storeId,
      storeName: stores.name,
      storeLocation: stores.locationLabel,
      dayOfWeek: restockPatterns.dayOfWeek,
      hourOfDay: restockPatterns.hourOfDay,
      frequencyCount: restockPatterns.frequencyCount,
    })
    .from(restockPatterns)
    .innerJoin(stores, eq(restockPatterns.storeId, stores.id))
    .orderBy(stores.name);

  // Group by store
  const storeMap = new Map<
    string,
    {
      name: string;
      location: string;
      data: { dayOfWeek: number; hourOfDay: number; frequencyCount: number }[];
    }
  >();

  for (const p of patterns) {
    if (!storeMap.has(p.storeId)) {
      storeMap.set(p.storeId, {
        name: p.storeName,
        location: p.storeLocation,
        data: [],
      });
    }
    storeMap.get(p.storeId)!.data.push({
      dayOfWeek: p.dayOfWeek,
      hourOfDay: p.hourOfDay,
      frequencyCount: p.frequencyCount,
    });
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Restock Heatmaps</h2>
      {storeMap.size === 0 ? (
        <p className="text-muted-foreground">
          Not enough data to generate heatmaps yet.
        </p>
      ) : (
        <div className="space-y-6">
          {Array.from(storeMap.entries()).map(([storeId, store]) => (
            <Card key={storeId}>
              <CardHeader>
                <CardTitle className="text-base">
                  {store.name} — {store.location}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <HeatmapGrid data={store.data} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
```

**Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds.

**Step 4: Commit**

```bash
git add src/app/dashboard/heatmap/ src/components/heatmap-grid.tsx
git commit -m "feat: add premium restock heatmap page"
```

### Task 9.2: Community Tip Submission (Premium)

**Files:**
- Create: `src/app/dashboard/submit/page.tsx`
- Create: `src/app/dashboard/submit/actions.ts`

**Step 1: Create submit tip action**

Create `src/app/dashboard/submit/actions.ts`:

```typescript
"use server";

import { db } from "@/db";
import { restockSightings } from "@/db/schema";
import { requirePremium } from "@/lib/auth";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function submitTip(formData: FormData) {
  await requirePremium();
  const { userId } = await auth();

  await db.insert(restockSightings).values({
    storeId: formData.get("storeId") as string,
    productId: formData.get("productId") as string,
    reportedBy: userId!,
    sightedAt: new Date(formData.get("sightedAt") as string),
    status: formData.get("status") as "in_stock" | "limited" | "out_of_stock",
    verified: false, // Community tips need admin verification
    source: "community",
    notes: (formData.get("notes") as string) || null,
  });

  revalidatePath("/dashboard/submit");
}
```

**Step 2: Create submit tip page**

Create `src/app/dashboard/submit/page.tsx`:

```tsx
import { requirePremium } from "@/lib/auth";
import { db } from "@/db";
import { stores, products } from "@/db/schema";
import { SightingForm } from "@/components/sighting-form";

export default async function SubmitTipPage() {
  await requirePremium();

  const [allStores, allProducts] = await Promise.all([
    db.select().from(stores).orderBy(stores.name),
    db.select().from(products).orderBy(products.name),
  ]);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Submit a Restock Tip</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Your tip will be reviewed by our team before becoming visible.
      </p>
      <SightingForm stores={allStores} products={allProducts} />
    </div>
  );
}
```

Note: This reuses the `SightingForm` component from Task 5.1, but the form action will need to be made configurable. The executing agent should refactor `SightingForm` to accept an action prop, or create a separate `CommunityTipForm` that calls `submitTip` instead.

**Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds.

**Step 4: Commit**

```bash
git add src/app/dashboard/submit/
git commit -m "feat: add premium community tip submission"
```

### Task 9.3: Email Alert Preferences (Premium)

**Files:**
- Create: `src/db/schema.ts` (add alertPreferences table)
- Create: `src/app/dashboard/alerts/page.tsx`
- Create: `src/app/dashboard/alerts/actions.ts`

**Step 1: Add alert preferences table to schema**

Add to `src/db/schema.ts`:

```typescript
export const alertPreferences = pgTable("alert_preferences", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  productId: uuid("product_id").references(() => products.id),
  region: text("region"), // matches store.locationLabel
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AlertPreference = typeof alertPreferences.$inferSelect;
export type NewAlertPreference = typeof alertPreferences.$inferInsert;
```

**Step 2: Generate and run migration**

```bash
npm run db:generate
```

**Step 3: Create alert actions**

Create `src/app/dashboard/alerts/actions.ts`:

```typescript
"use server";

import { db } from "@/db";
import { alertPreferences } from "@/db/schema";
import { requirePremium } from "@/lib/auth";
import { auth } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createAlert(formData: FormData) {
  await requirePremium();
  const { userId } = await auth();

  await db.insert(alertPreferences).values({
    userId: userId!,
    productId: (formData.get("productId") as string) || null,
    region: (formData.get("region") as string) || null,
  });

  revalidatePath("/dashboard/alerts");
}

export async function deleteAlert(id: string) {
  await requirePremium();
  const { userId } = await auth();

  await db
    .delete(alertPreferences)
    .where(
      and(eq(alertPreferences.id, id), eq(alertPreferences.userId, userId!))
    );

  revalidatePath("/dashboard/alerts");
}
```

**Step 4: Create alerts page**

Create `src/app/dashboard/alerts/page.tsx`:

```tsx
import { requirePremium } from "@/lib/auth";
import { db } from "@/db";
import { alertPreferences, products, stores } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createAlert, deleteAlert } from "./actions";

export default async function AlertsPage() {
  await requirePremium();
  const { userId } = await auth();

  const [allProducts, alerts, allStores] = await Promise.all([
    db.select().from(products).orderBy(products.name),
    db
      .select({
        id: alertPreferences.id,
        productName: products.name,
        region: alertPreferences.region,
      })
      .from(alertPreferences)
      .leftJoin(products, eq(alertPreferences.productId, products.id))
      .where(eq(alertPreferences.userId, userId!)),
    db
      .selectDistinct({ locationLabel: stores.locationLabel })
      .from(stores)
      .orderBy(stores.locationLabel),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold mb-4">Add Alert</h2>
        <form action={createAlert} className="space-y-4 max-w-md">
          <div>
            <Label htmlFor="productId">Product (optional)</Label>
            <Select name="productId">
              <SelectTrigger>
                <SelectValue placeholder="Any product" />
              </SelectTrigger>
              <SelectContent>
                {allProducts.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="region">Region (optional)</Label>
            <Select name="region">
              <SelectTrigger>
                <SelectValue placeholder="Any region" />
              </SelectTrigger>
              <SelectContent>
                {allStores.map((s) => (
                  <SelectItem key={s.locationLabel} value={s.locationLabel}>
                    {s.locationLabel}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit">Create Alert</Button>
        </form>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">
          Your Alerts ({alerts.length})
        </h2>
        {alerts.length === 0 ? (
          <p className="text-muted-foreground">No alerts configured yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Region</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alerts.map((alert) => (
                <TableRow key={alert.id}>
                  <TableCell>{alert.productName ?? "Any"}</TableCell>
                  <TableCell>{alert.region ?? "Any"}</TableCell>
                  <TableCell>
                    <form action={deleteAlert.bind(null, alert.id)}>
                      <Button variant="destructive" size="sm" type="submit">
                        Remove
                      </Button>
                    </form>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
```

**Step 5: Verify build**

Run: `npm run build`
Expected: Build succeeds.

**Step 6: Commit**

```bash
git add src/db/schema.ts drizzle/ src/app/dashboard/alerts/
git commit -m "feat: add premium email alert preferences"
```

---
