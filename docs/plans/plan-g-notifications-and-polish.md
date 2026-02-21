# Pokemon Card Tracker - Implementation Plan G: Notifications and Polish

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a Next.js web app for tracking Pokemon card restock sightings at retail stores, with free/premium tiers, admin tools, and pattern analytics.

**Architecture:** Next.js 14 App Router with server components by default. Neon PostgreSQL via Drizzle ORM for data. Clerk for auth with DB-stored subscription tiers. Stripe for payments. Server actions and API routes for mutations.

**Tech Stack:** Next.js 14+, TypeScript, Tailwind CSS, shadcn/ui, Drizzle ORM, Neon PostgreSQL, Clerk, Stripe, Resend, Vercel

**Reference:** Design doc at `docs/plans/2026-02-21-pokemon-card-tracker-design.md`

**Prerequisites:** Plans A-F completed (all core features built including premium features and alert preferences).

---

## Phase 10: Email Notifications & Cron

### Task 10.1: Resend Email Notifications

**Files:**
- Create: `src/lib/email.ts`

**Step 1: Create email sending utility**

Create `src/lib/email.ts`:

```typescript
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendRestockAlert({
  to,
  productName,
  storeName,
  storeLocation,
  status,
}: {
  to: string;
  productName: string;
  storeName: string;
  storeLocation: string;
  status: string;
}) {
  await resend.emails.send({
    from: "Pokemon Card Tracker <noreply@yourdomain.com>",
    to,
    subject: `Restock Alert: ${productName} at ${storeName}`,
    html: `
      <h2>Restock Spotted!</h2>
      <p><strong>${productName}</strong> was spotted at <strong>${storeName}</strong> (${storeLocation}).</p>
      <p>Status: <strong>${status}</strong></p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard">View Dashboard</a></p>
    `,
  });
}
```

**Step 2: Add email trigger to sighting verification**

Modify `src/app/admin/verification/actions.ts` — after the `verifySighting` update, query matching alert preferences and send emails:

```typescript
// Add to verifySighting, after the update:
import { alertPreferences, users as usersTable, restockSightings, stores, products } from "@/db/schema";
import { sendRestockAlert } from "@/lib/email";
import { and, eq, or, isNull } from "drizzle-orm";

// After setting verified = true, get the sighting details and notify subscribers
const [sighting] = await db
  .select({
    productId: restockSightings.productId,
    productName: products.name,
    storeName: stores.name,
    storeLocation: stores.locationLabel,
    status: restockSightings.status,
  })
  .from(restockSightings)
  .innerJoin(stores, eq(restockSightings.storeId, stores.id))
  .innerJoin(products, eq(restockSightings.productId, products.id))
  .where(eq(restockSightings.id, id))
  .limit(1);

if (sighting) {
  const matchingAlerts = await db
    .select({
      email: usersTable.email,
    })
    .from(alertPreferences)
    .innerJoin(usersTable, eq(alertPreferences.userId, usersTable.id))
    .where(
      and(
        or(
          eq(alertPreferences.productId, sighting.productId),
          isNull(alertPreferences.productId)
        ),
        or(
          eq(alertPreferences.region, sighting.storeLocation),
          isNull(alertPreferences.region)
        )
      )
    );

  for (const alert of matchingAlerts) {
    await sendRestockAlert({
      to: alert.email,
      productName: sighting.productName,
      storeName: sighting.storeName,
      storeLocation: sighting.storeLocation,
      status: sighting.status,
    });
  }
}
```

**Step 3: Commit**

```bash
git add src/lib/email.ts src/app/admin/verification/actions.ts
git commit -m "feat: add Resend email notifications on sighting verification"
```

### Task 10.2: Cron Job for Heatmap Refresh

**Files:**
- Create: `src/app/api/cron/refresh-patterns/route.ts`
- Create: `vercel.json` (cron config)

**Step 1: Create cron route handler**

Create `src/app/api/cron/refresh-patterns/route.ts`:

```typescript
import { db } from "@/db";
import { restockSightings, restockPatterns } from "@/db/schema";
import { sql, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Clear existing patterns
  await db.delete(restockPatterns);

  // Recompute from verified sightings
  await db.execute(sql`
    INSERT INTO restock_patterns (id, store_id, product_id, day_of_week, hour_of_day, frequency_count, last_updated)
    SELECT
      gen_random_uuid(),
      store_id,
      product_id,
      EXTRACT(DOW FROM sighted_at)::int,
      EXTRACT(HOUR FROM sighted_at)::int,
      COUNT(*)::int,
      NOW()
    FROM restock_sightings
    WHERE verified = true
    GROUP BY store_id, product_id, EXTRACT(DOW FROM sighted_at), EXTRACT(HOUR FROM sighted_at)
  `);

  return NextResponse.json({ success: true });
}
```

**Step 2: Create vercel.json with cron config**

Create `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/refresh-patterns",
      "schedule": "0 4 * * *"
    }
  ]
}
```

**Step 3: Add CRON_SECRET to .env.example**

Add `CRON_SECRET=your-cron-secret` to `.env.example`.

**Step 4: Commit**

```bash
git add src/app/api/cron/ vercel.json .env.example
git commit -m "feat: add daily cron job for restock pattern heatmap refresh"
```

---

## Phase 11: Final Polish

### Task 11.1: Error Handling and Loading States

**Files:**
- Create: `src/app/dashboard/loading.tsx`
- Create: `src/app/dashboard/error.tsx`
- Create: `src/app/admin/loading.tsx`
- Create: `src/app/admin/error.tsx`

**Step 1: Create loading states**

Create `src/app/dashboard/loading.tsx`:

```tsx
export default function DashboardLoading() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-muted-foreground">Loading...</div>
    </div>
  );
}
```

Create `src/app/admin/loading.tsx` with the same content.

**Step 2: Create error boundaries**

Create `src/app/dashboard/error.tsx`:

```tsx
"use client";

import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-4">
      <h2 className="text-lg font-semibold">Something went wrong</h2>
      <p className="text-sm text-muted-foreground">{error.message}</p>
      <Button onClick={reset}>Try Again</Button>
    </div>
  );
}
```

Create `src/app/admin/error.tsx` with the same content.

**Step 3: Commit**

```bash
git add src/app/dashboard/loading.tsx src/app/dashboard/error.tsx src/app/admin/loading.tsx src/app/admin/error.tsx
git commit -m "feat: add loading states and error boundaries"
```

### Task 11.2: Final Build Verification

**Step 1: Run full build**

```bash
npm run build
```

Expected: Clean build with no errors.

**Step 2: Review for any missed imports or type errors**

Fix anything that came up during the build.

**Step 3: Final commit if needed**

```bash
git add -A
git commit -m "fix: resolve build issues"
```
