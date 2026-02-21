# Pokemon Card Tracker - Implementation Plan E: Stripe Integration

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a Next.js web app for tracking Pokemon card restock sightings at retail stores, with free/premium tiers, admin tools, and pattern analytics.

**Architecture:** Next.js 14 App Router with server components by default. Neon PostgreSQL via Drizzle ORM for data. Clerk for auth with DB-stored subscription tiers. Stripe for payments. Server actions and API routes for mutations.

**Tech Stack:** Next.js 14+, TypeScript, Tailwind CSS, shadcn/ui, Drizzle ORM, Neon PostgreSQL, Clerk, Stripe, Resend, Vercel

**Reference:** Design doc at `docs/plans/2026-02-21-pokemon-card-tracker-design.md`

**Prerequisites:** Plans A-D completed (project scaffolded, database ready, auth configured, admin and dashboard pages built).

---

## Phase 8: Stripe Integration

### Task 8.1: Stripe Checkout & Customer Portal

**Files:**
- Create: `src/app/api/stripe/checkout/route.ts`
- Create: `src/app/api/stripe/portal/route.ts`
- Create: `src/lib/stripe.ts`

**Step 1: Create Stripe client**

Create `src/lib/stripe.ts`:

```typescript
import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
});
```

Note: The executing agent should check for the latest Stripe API version and use that.

**Step 2: Create checkout route**

Create `src/app/api/stripe/checkout/route.ts`:

```typescript
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";

export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Reuse or create Stripe customer
  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { clerkUserId: userId },
    });
    customerId = customer.id;
    await db
      .update(users)
      .set({ stripeCustomerId: customerId })
      .where(eq(users.id, userId));
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [
      {
        price: process.env.STRIPE_PRICE_ID!,
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?upgraded=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/upgrade`,
  });

  return NextResponse.json({ url: session.url });
}
```

**Step 3: Create portal route**

Create `src/app/api/stripe/portal/route.ts`:

```typescript
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";

export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user?.stripeCustomerId) {
    return NextResponse.json(
      { error: "No subscription found" },
      { status: 404 }
    );
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
  });

  return NextResponse.json({ url: session.url });
}
```

**Step 4: Commit**

```bash
git add src/lib/stripe.ts src/app/api/stripe/
git commit -m "feat: add Stripe checkout and customer portal API routes"
```

### Task 8.2: Stripe Webhook

**Files:**
- Create: `src/app/api/webhooks/stripe/route.ts`

**Step 1: Create Stripe webhook handler**

Create `src/app/api/webhooks/stripe/route.ts`:

```typescript
import { stripe } from "@/lib/stripe";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.customer && session.subscription) {
        await db
          .update(users)
          .set({
            subscriptionTier: "premium",
            stripeSubscriptionId: session.subscription as string,
          })
          .where(eq(users.stripeCustomerId, session.customer as string));
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await db
        .update(users)
        .set({
          subscriptionTier: "free",
          stripeSubscriptionId: null,
        })
        .where(eq(users.stripeCustomerId, subscription.customer as string));
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const tier =
        subscription.status === "active" ? "premium" : "free";
      await db
        .update(users)
        .set({ subscriptionTier: tier })
        .where(eq(users.stripeCustomerId, subscription.customer as string));
      break;
    }
  }

  return NextResponse.json({ received: true });
}
```

**Step 2: Commit**

```bash
git add src/app/api/webhooks/stripe/
git commit -m "feat: add Stripe webhook handler for subscription sync"
```

### Task 8.3: Upgrade Page

**Files:**
- Create: `src/app/dashboard/upgrade/page.tsx`

**Step 1: Create upgrade page**

Create `src/app/dashboard/upgrade/page.tsx`:

```tsx
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function UpgradePage() {
  async function handleUpgrade() {
    const res = await fetch("/api/stripe/checkout", { method: "POST" });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center">Go Premium</h2>
      <Card>
        <CardHeader>
          <CardTitle>Premium Membership</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-2 text-sm">
            <li>Full sighting history (no 48h limit)</li>
            <li>Restock heatmaps by store and region</li>
            <li>Email alerts for products you want</li>
            <li>Submit community restock tips</li>
            <li>Advanced filters (date range, store, product)</li>
          </ul>
          <Button onClick={handleUpgrade} className="w-full">
            Subscribe Now
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds.

**Step 3: Commit**

```bash
git add src/app/dashboard/upgrade/
git commit -m "feat: add premium upgrade page with Stripe checkout"
```

---
