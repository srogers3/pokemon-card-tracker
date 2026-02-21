# Pokemon Card Tracker - Implementation Plan A: Scaffolding and Database

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a Next.js web app for tracking Pokemon card restock sightings at retail stores, with free/premium tiers, admin tools, and pattern analytics.

**Architecture:** Next.js 14 App Router with server components by default. Neon PostgreSQL via Drizzle ORM for data. Clerk for auth with DB-stored subscription tiers. Stripe for payments. Server actions and API routes for mutations.

**Tech Stack:** Next.js 14+, TypeScript, Tailwind CSS, shadcn/ui, Drizzle ORM, Neon PostgreSQL, Clerk, Stripe, Resend, Vercel

**Reference:** Design doc at `docs/plans/2026-02-21-pokemon-card-tracker-design.md`

**Prerequisites:** None — this is the first plan to execute.

---

## Phase 1: Project Scaffolding

### Task 1.1: Initialize Next.js Project

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.mjs`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`

**Step 1: Scaffold Next.js with create-next-app**

```bash
cd C:/git/pokemon-card-tracker/.claude/worktrees/elegant-khorana
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

Accept defaults. This creates the full project skeleton.

**Step 2: Verify it builds**

Run: `npm run build`
Expected: Successful build with no errors.

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js project with TypeScript and Tailwind"
```

### Task 1.2: Install Core Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install all project dependencies**

```bash
npm install drizzle-orm @neondatabase/serverless dotenv @clerk/nextjs stripe resend
npm install -D drizzle-kit @types/node
```

**Step 2: Verify install succeeded**

Run: `npm ls drizzle-orm @clerk/nextjs stripe resend`
Expected: All packages listed without errors.

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: install core dependencies (drizzle, clerk, stripe, resend)"
```

### Task 1.3: Initialize shadcn/ui

**Files:**
- Create: `components.json`
- Create: `src/lib/utils.ts`
- Create: `src/components/ui/` (directory)

**Step 1: Initialize shadcn**

```bash
npx shadcn@latest init
```

When prompted: use default style, default base color, CSS variables = yes.

**Step 2: Add commonly needed components**

```bash
npx shadcn@latest add button card badge input label select textarea table tabs dialog dropdown-menu separator sheet toast
```

**Step 3: Verify a component exists**

Check that `src/components/ui/button.tsx` was created.

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: initialize shadcn/ui with core components"
```

### Task 1.4: Set Up Environment Variables Template

**Files:**
- Create: `.env.example`
- Create: `.env.local` (gitignored)
- Modify: `.gitignore`

**Step 1: Create .env.example**

```env
# Database (Neon)
DATABASE_URL=postgresql://user:pass@host/dbname?sslmode=require

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_PRICE_ID=price_...

# Resend
RESEND_API_KEY=re_...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Step 2: Copy to .env.local**

```bash
cp .env.example .env.local
```

**Step 3: Verify .env.local is in .gitignore**

Check `.gitignore` contains `.env*.local`. Next.js scaffolding should have added this already.

**Step 4: Commit**

```bash
git add .env.example .gitignore
git commit -m "feat: add environment variables template"
```

---

## Phase 2: Database Schema & ORM

### Task 2.1: Configure Drizzle ORM

**Files:**
- Create: `drizzle.config.ts`
- Create: `src/db/index.ts`

**Step 1: Create Drizzle config**

Create `drizzle.config.ts`:

```typescript
import { defineConfig } from "drizzle-kit";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

**Step 2: Create database client**

Create `src/db/index.ts`:

```typescript
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });
```

**Step 3: Commit**

```bash
git add drizzle.config.ts src/db/index.ts
git commit -m "feat: configure Drizzle ORM with Neon PostgreSQL"
```

### Task 2.2: Define Database Schema

**Files:**
- Create: `src/db/schema.ts`

**Step 1: Write the full schema**

Create `src/db/schema.ts`:

```typescript
import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  pgEnum,
} from "drizzle-orm/pg-core";

// Enums
export const storeTypeEnum = pgEnum("store_type", [
  "big_box",
  "lgs",
  "grocery",
  "pharmacy",
  "other",
]);

export const productTypeEnum = pgEnum("product_type", [
  "etb",
  "booster_box",
  "tin",
  "blister",
  "collection_box",
  "other",
]);

export const stockStatusEnum = pgEnum("stock_status", [
  "in_stock",
  "limited",
  "out_of_stock",
]);

export const sightingSourceEnum = pgEnum("sighting_source", [
  "admin",
  "community",
]);

export const subscriptionTierEnum = pgEnum("subscription_tier", [
  "free",
  "premium",
]);

// Tables
export const stores = pgTable("stores", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  locationLabel: text("location_label").notNull(),
  storeType: storeTypeEnum("store_type").notNull(),
  specificLocation: text("specific_location"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const products = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  setName: text("set_name").notNull(),
  productType: productTypeEnum("product_type").notNull(),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const restockSightings = pgTable("restock_sightings", {
  id: uuid("id").defaultRandom().primaryKey(),
  storeId: uuid("store_id")
    .notNull()
    .references(() => stores.id),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id),
  reportedBy: text("reported_by").notNull(),
  sightedAt: timestamp("sighted_at").notNull(),
  status: stockStatusEnum("status").notNull(),
  verified: boolean("verified").default(false).notNull(),
  source: sightingSourceEnum("source").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: text("id").primaryKey(), // Clerk user ID
  email: text("email").notNull(),
  subscriptionTier: subscriptionTierEnum("subscription_tier")
    .default("free")
    .notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const restockPatterns = pgTable("restock_patterns", {
  id: uuid("id").defaultRandom().primaryKey(),
  storeId: uuid("store_id")
    .notNull()
    .references(() => stores.id),
  productId: uuid("product_id").references(() => products.id),
  dayOfWeek: integer("day_of_week").notNull(), // 0-6
  hourOfDay: integer("hour_of_day").notNull(), // 0-23
  frequencyCount: integer("frequency_count").notNull().default(0),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
});

// Type exports
export type Store = typeof stores.$inferSelect;
export type NewStore = typeof stores.$inferInsert;
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type RestockSighting = typeof restockSightings.$inferSelect;
export type NewRestockSighting = typeof restockSightings.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type RestockPattern = typeof restockPatterns.$inferSelect;
```

**Step 2: Generate migration**

Run: `npx drizzle-kit generate`
Expected: Migration SQL files created in `drizzle/` directory.

**Step 3: Commit**

```bash
git add src/db/schema.ts drizzle/
git commit -m "feat: define database schema with Drizzle (stores, products, sightings, users, patterns)"
```

### Task 2.3: Add Database Migration Script

**Files:**
- Create: `src/db/migrate.ts`
- Modify: `package.json` (add scripts)

**Step 1: Create migration runner**

Create `src/db/migrate.ts`:

```typescript
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql);
  await migrate(db, { migrationsFolder: "drizzle" });
  console.log("Migration complete");
}

main().catch(console.error);
```

**Step 2: Add npm scripts**

Add to `package.json` scripts:

```json
{
  "db:generate": "drizzle-kit generate",
  "db:migrate": "npx tsx src/db/migrate.ts",
  "db:push": "drizzle-kit push",
  "db:studio": "drizzle-kit studio"
}
```

**Step 3: Install tsx**

```bash
npm install -D tsx
```

**Step 4: Commit**

```bash
git add src/db/migrate.ts package.json package-lock.json
git commit -m "feat: add database migration scripts"
```

---
