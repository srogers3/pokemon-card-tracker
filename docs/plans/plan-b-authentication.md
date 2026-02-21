# Pokemon Card Tracker - Implementation Plan B: Authentication

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a Next.js web app for tracking Pokemon card restock sightings at retail stores, with free/premium tiers, admin tools, and pattern analytics.

**Architecture:** Next.js 14 App Router with server components by default. Neon PostgreSQL via Drizzle ORM for data. Clerk for auth with DB-stored subscription tiers. Stripe for payments. Server actions and API routes for mutations.

**Tech Stack:** Next.js 14+, TypeScript, Tailwind CSS, shadcn/ui, Drizzle ORM, Neon PostgreSQL, Clerk, Stripe, Resend, Vercel

**Reference:** Design doc at `docs/plans/2026-02-21-pokemon-card-tracker-design.md`

**Prerequisites:** Plan A completed (project scaffolded, dependencies installed, database schema defined).

---

## Phase 3: Authentication (Clerk)

### Task 3.1: Set Up Clerk Provider and Middleware

**Files:**
- Modify: `src/app/layout.tsx`
- Create: `src/middleware.ts`

**Step 1: Wrap app in ClerkProvider**

Modify `src/app/layout.tsx` to wrap the `{children}` in `<ClerkProvider>`:

```tsx
import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Pokemon Card Tracker",
  description: "Track Pokemon card restocks at retail stores",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>{children}</body>
      </html>
    </ClerkProvider>
  );
}
```

**Step 2: Create Clerk middleware**

Create `src/middleware.ts`:

```typescript
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
```

**Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds (Clerk keys not needed for build).

**Step 4: Commit**

```bash
git add src/app/layout.tsx src/middleware.ts
git commit -m "feat: configure Clerk auth provider and middleware"
```

### Task 3.2: Create Auth Pages

**Files:**
- Create: `src/app/sign-in/[[...sign-in]]/page.tsx`
- Create: `src/app/sign-up/[[...sign-up]]/page.tsx`

**Step 1: Create sign-in page**

Create `src/app/sign-in/[[...sign-in]]/page.tsx`:

```tsx
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignIn />
    </div>
  );
}
```

**Step 2: Create sign-up page**

Create `src/app/sign-up/[[...sign-up]]/page.tsx`:

```tsx
import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignUp />
    </div>
  );
}
```

**Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds.

**Step 4: Commit**

```bash
git add src/app/sign-in/ src/app/sign-up/
git commit -m "feat: add Clerk sign-in and sign-up pages"
```

### Task 3.3: Create Clerk Webhook for User Sync

**Files:**
- Create: `src/app/api/webhooks/clerk/route.ts`

**Step 1: Create webhook handler**

Create `src/app/api/webhooks/clerk/route.ts`:

```typescript
import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) {
    throw new Error("Missing CLERK_WEBHOOK_SECRET");
  }

  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(WEBHOOK_SECRET);
  let event: WebhookEvent;

  try {
    event = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as WebhookEvent;
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  if (event.type === "user.created") {
    const { id, email_addresses } = event.data;
    const email = email_addresses[0]?.email_address;
    if (email) {
      await db.insert(users).values({
        id,
        email,
        subscriptionTier: "free",
      });
    }
  }

  if (event.type === "user.deleted") {
    const { id } = event.data;
    if (id) {
      await db.delete(users).where(eq(users.id, id));
    }
  }

  return new Response("OK", { status: 200 });
}
```

**Step 2: Install svix**

```bash
npm install svix
```

**Step 3: Add CLERK_WEBHOOK_SECRET to .env.example**

Add `CLERK_WEBHOOK_SECRET=whsec_...` to `.env.example`.

**Step 4: Commit**

```bash
git add src/app/api/webhooks/clerk/route.ts .env.example package.json package-lock.json
git commit -m "feat: add Clerk webhook for user sync to database"
```

### Task 3.4: Create Subscription Tier Helper

**Files:**
- Create: `src/lib/auth.ts`

**Step 1: Create auth helper**

Create `src/lib/auth.ts`:

```typescript
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getCurrentUser() {
  const { userId } = await auth();
  if (!userId) return null;

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return user ?? null;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}

export async function requirePremium() {
  const user = await requireUser();
  if (user.subscriptionTier !== "premium") {
    throw new Error("Premium subscription required");
  }
  return user;
}

export async function requireAdmin() {
  const { userId, sessionClaims } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (role !== "admin") throw new Error("Admin access required");

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) throw new Error("User not found");
  return user;
}
```

**Step 2: Commit**

```bash
git add src/lib/auth.ts
git commit -m "feat: add auth helpers for subscription tier and admin checks"
```

---
