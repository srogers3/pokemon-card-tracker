# Gamification & Trust System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add trust scoring, corroboration, badges, and a public leaderboard to incentivize quality user-generated sighting reports. Make reporting free for all users.

**Architecture:** Trust scores live on the users table. Corroboration runs inline when a sighting is submitted — matches against recent unverified sightings. Badge checks run after any trust score change. Leaderboard is a server component with a direct DB query.

**Tech Stack:** Next.js 14+, TypeScript, Tailwind CSS, shadcn/ui, Drizzle ORM, Neon PostgreSQL

**Reference:** Design doc at `docs/plans/2026-02-21-gamification-trust-system-design.md`

**Prerequisites:** Plans A-G completed.

---

## Phase 12: Schema Changes & Trust Engine

### Task 12.1: Add Trust Columns and Badge Table to Schema

**Files:**
- Modify: `src/db/schema.ts`

**Step 1: Add badge type enum and trust columns to users table**

In `src/db/schema.ts`, add a new enum and modify the `users` table:

```typescript
export const badgeTypeEnum = pgEnum("badge_type", [
  "first_report",
  "verified_10",
  "verified_50",
  "trusted_reporter",
  "top_reporter",
  "streak_7",
  "streak_30",
]);
```

Add columns to the `users` table:

```typescript
// Add these columns to the existing users table definition:
trustScore: integer("trust_score").default(0).notNull(),
totalReports: integer("total_reports").default(0).notNull(),
verifiedReports: integer("verified_reports").default(0).notNull(),
currentStreak: integer("current_streak").default(0).notNull(),
lastReportDate: timestamp("last_report_date"),
```

Add column to the `restockSightings` table:

```typescript
// Add this column to the existing restockSightings table:
corroboratedBy: uuid("corroborated_by"),
```

Add new `reporterBadges` table after the `alertPreferences` table:

```typescript
export const reporterBadges = pgTable("reporter_badges", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  badgeType: badgeTypeEnum("badge_type").notNull(),
  earnedAt: timestamp("earned_at").defaultNow().notNull(),
});
```

Add type exports:

```typescript
export type ReporterBadge = typeof reporterBadges.$inferSelect;
```

**Step 2: Push schema changes to database**

```bash
npm run db:push
```

**Step 3: Commit**

```bash
git add src/db/schema.ts
git commit -m "feat: add trust scoring columns, badge table, and corroboration tracking"
```

### Task 12.2: Create Trust Engine Utility

**Files:**
- Create: `src/lib/trust.ts`

**Step 1: Create trust engine with scoring, corroboration, and badge logic**

Create `src/lib/trust.ts`:

```typescript
import { db } from "@/db";
import { users, restockSightings, reporterBadges } from "@/db/schema";
import { eq, and, gte, lte, ne, sql } from "drizzle-orm";

const CORROBORATION_WINDOW_HOURS = 4;
const TRUST_THRESHOLD_AUTO_VERIFY = 50;
const POINTS_CORROBORATED = 10;
const POINTS_ADMIN_VERIFIED = 5;
const POINTS_FLAGGED = -15;
const MAX_REPORTS_PER_DAY = 10;

export function shouldAutoVerify(trustScore: number): boolean {
  return trustScore >= TRUST_THRESHOLD_AUTO_VERIFY;
}

export async function canSubmitReport(userId: string): Promise<boolean> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [result] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(restockSightings)
    .where(
      and(
        eq(restockSightings.reportedBy, userId),
        gte(restockSightings.createdAt, today)
      )
    );

  return (result?.count ?? 0) < MAX_REPORTS_PER_DAY;
}

export async function checkCorroboration(sightingId: string, storeId: string, productId: string, sightedAt: Date): Promise<string | null> {
  const windowStart = new Date(sightedAt.getTime() - CORROBORATION_WINDOW_HOURS * 60 * 60 * 1000);
  const windowEnd = new Date(sightedAt.getTime() + CORROBORATION_WINDOW_HOURS * 60 * 60 * 1000);

  const [match] = await db
    .select({ id: restockSightings.id, reportedBy: restockSightings.reportedBy })
    .from(restockSightings)
    .where(
      and(
        eq(restockSightings.storeId, storeId),
        eq(restockSightings.productId, productId),
        eq(restockSightings.verified, false),
        ne(restockSightings.id, sightingId),
        gte(restockSightings.sightedAt, windowStart),
        lte(restockSightings.sightedAt, windowEnd)
      )
    )
    .limit(1);

  if (!match) return null;

  // Corroboration found — verify both sightings
  await db.update(restockSightings).set({ verified: true, corroboratedBy: sightingId }).where(eq(restockSightings.id, match.id));
  await db.update(restockSightings).set({ verified: true, corroboratedBy: match.id }).where(eq(restockSightings.id, sightingId));

  // Award points to the other reporter
  await adjustTrustScore(match.reportedBy, POINTS_CORROBORATED);

  return match.reportedBy;
}

export async function adjustTrustScore(userId: string, points: number): Promise<void> {
  await db
    .update(users)
    .set({ trustScore: sql`GREATEST(0, trust_score + ${points})` })
    .where(eq(users.id, userId));

  if (points > 0) {
    await db
      .update(users)
      .set({ verifiedReports: sql`verified_reports + 1` })
      .where(eq(users.id, userId));
  }

  await checkAndAwardBadges(userId);
}

export async function updateReporterStats(userId: string): Promise<void> {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

  const [user] = await db
    .select({ currentStreak: users.currentStreak, lastReportDate: users.lastReportDate })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) return;

  let newStreak = 1;
  if (user.lastReportDate) {
    const lastDate = new Date(user.lastReportDate);
    lastDate.setHours(0, 0, 0, 0);
    if (lastDate.getTime() === yesterday.getTime()) {
      newStreak = user.currentStreak + 1;
    } else if (lastDate.getTime() === today.getTime()) {
      newStreak = user.currentStreak; // Already reported today
    }
  }

  await db
    .update(users)
    .set({
      totalReports: sql`total_reports + 1`,
      currentStreak: newStreak,
      lastReportDate: now,
    })
    .where(eq(users.id, userId));
}

async function checkAndAwardBadges(userId: string): Promise<void> {
  const [user] = await db
    .select({
      trustScore: users.trustScore,
      totalReports: users.totalReports,
      verifiedReports: users.verifiedReports,
      currentStreak: users.currentStreak,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) return;

  const existingBadges = await db
    .select({ badgeType: reporterBadges.badgeType })
    .from(reporterBadges)
    .where(eq(reporterBadges.userId, userId));

  const earned = new Set(existingBadges.map((b) => b.badgeType));

  const toAward: string[] = [];
  if (user.totalReports >= 1 && !earned.has("first_report")) toAward.push("first_report");
  if (user.verifiedReports >= 10 && !earned.has("verified_10")) toAward.push("verified_10");
  if (user.verifiedReports >= 50 && !earned.has("verified_50")) toAward.push("verified_50");
  if (user.trustScore >= TRUST_THRESHOLD_AUTO_VERIFY && !earned.has("trusted_reporter")) toAward.push("trusted_reporter");
  if (user.currentStreak >= 7 && !earned.has("streak_7")) toAward.push("streak_7");
  if (user.currentStreak >= 30 && !earned.has("streak_30")) toAward.push("streak_30");

  if (toAward.length > 0) {
    await db.insert(reporterBadges).values(
      toAward.map((badge) => ({
        userId,
        badgeType: badge as any,
      }))
    );
  }
}
```

**Step 2: Commit**

```bash
git add src/lib/trust.ts
git commit -m "feat: add trust engine with scoring, corroboration, and badge logic"
```

---

## Phase 13: Integrate Trust Engine into Sighting Flow

### Task 13.1: Make Reporting Free and Add Trust Integration

**Files:**
- Modify: `src/app/dashboard/submit/page.tsx`
- Modify: `src/app/dashboard/submit/actions.ts`
- Modify: `src/components/dashboard-nav.tsx`

**Step 1: Change submit page from premium to all authenticated users**

In `src/app/dashboard/submit/page.tsx`, change `requirePremium` to `requireUser`:

```typescript
import { requireUser } from "@/lib/auth";
// ... rest of imports stay the same

export default async function SubmitTipPage() {
  await requireUser();
  // ... rest stays the same
}
```

**Step 2: Update submit action with trust integration**

Replace `src/app/dashboard/submit/actions.ts`:

```typescript
"use server";

import { db } from "@/db";
import { users, restockSightings } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import {
  shouldAutoVerify,
  canSubmitReport,
  checkCorroboration,
  adjustTrustScore,
  updateReporterStats,
} from "@/lib/trust";

export async function submitTip(formData: FormData) {
  const user = await requireUser();
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // Rate limit check
  const canSubmit = await canSubmitReport(userId);
  if (!canSubmit) throw new Error("Daily report limit reached (max 10)");

  const storeId = formData.get("storeId") as string;
  const productId = formData.get("productId") as string;
  const sightedAt = new Date(formData.get("sightedAt") as string);
  const autoVerify = shouldAutoVerify(user.trustScore);

  // Insert the sighting
  const [sighting] = await db
    .insert(restockSightings)
    .values({
      storeId,
      productId,
      reportedBy: userId,
      sightedAt,
      status: formData.get("status") as "in_stock" | "limited" | "out_of_stock",
      verified: autoVerify,
      source: "community",
      notes: (formData.get("notes") as string) || null,
    })
    .returning();

  // Update reporter stats (totalReports, streak)
  await updateReporterStats(userId);

  // Check for corroboration if not already auto-verified
  if (!autoVerify) {
    const corroboratedUserId = await checkCorroboration(sighting.id, storeId, productId, sightedAt);
    if (corroboratedUserId) {
      // Award points to this reporter too
      await adjustTrustScore(userId, 10);
    }
  } else {
    // Auto-verified by trust score — award admin-level points
    await adjustTrustScore(userId, 5);
  }

  revalidatePath("/dashboard/submit");
  revalidatePath("/dashboard");
}
```

**Step 3: Update dashboard nav to make Submit Tip visible to all users**

In `src/components/dashboard-nav.tsx`, change the Submit Tip link from premium to always visible:

```typescript
const links = [
  { href: "/dashboard", label: "Sightings" },
  { href: "/dashboard/products", label: "Products" },
  { href: "/dashboard/submit", label: "Submit Tip" },
  { href: "/dashboard/leaderboard", label: "Leaderboard" },
  { href: "/dashboard/heatmap", label: "Heatmap", premium: true },
  { href: "/dashboard/alerts", label: "Alerts", premium: true },
];
```

**Step 4: Commit**

```bash
git add src/app/dashboard/submit/page.tsx src/app/dashboard/submit/actions.ts src/components/dashboard-nav.tsx
git commit -m "feat: make reporting free for all users with trust scoring integration"
```

### Task 13.2: Add Trust Score Update to Admin Verification

**Files:**
- Modify: `src/app/admin/verification/actions.ts`

**Step 1: Award points when admin verifies a sighting**

In `src/app/admin/verification/actions.ts`, add trust score update after verifying. Add this import at the top:

```typescript
import { adjustTrustScore } from "@/lib/trust";
```

Then in the `verifySighting` function, after the line `await db.update(restockSightings).set({ verified: true })...`, add:

```typescript
// Award trust points to the reporter
const [verifiedSighting] = await db
  .select({ reportedBy: restockSightings.reportedBy })
  .from(restockSightings)
  .where(eq(restockSightings.id, id))
  .limit(1);

if (verifiedSighting) {
  await adjustTrustScore(verifiedSighting.reportedBy, 5);
}
```

**Step 2: Commit**

```bash
git add src/app/admin/verification/actions.ts
git commit -m "feat: award trust points on admin verification"
```

---

## Phase 14: Leaderboard & Profile Pages

### Task 14.1: Leaderboard Page

**Files:**
- Create: `src/app/dashboard/leaderboard/page.tsx`

**Step 1: Create leaderboard page**

Create `src/app/dashboard/leaderboard/page.tsx`:

```tsx
import { db } from "@/db";
import { users, reporterBadges } from "@/db/schema";
import { desc, gt, sql, eq } from "drizzle-orm";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";

const BADGE_LABELS: Record<string, string> = {
  first_report: "First Report",
  verified_10: "10 Verified",
  verified_50: "50 Verified",
  trusted_reporter: "Trusted",
  top_reporter: "Top Reporter",
  streak_7: "7-Day Streak",
  streak_30: "30-Day Streak",
};

export default async function LeaderboardPage() {
  const currentUser = await getCurrentUser();

  const topReporters = await db
    .select({
      id: users.id,
      email: users.email,
      trustScore: users.trustScore,
      totalReports: users.totalReports,
      verifiedReports: users.verifiedReports,
      currentStreak: users.currentStreak,
      accuracy: sql<number>`
        CASE WHEN total_reports > 0
          THEN ROUND(verified_reports::numeric / total_reports * 100)
          ELSE 0
        END
      `.as("accuracy"),
    })
    .from(users)
    .where(gt(users.totalReports, 0))
    .orderBy(desc(users.trustScore))
    .limit(25);

  // Fetch badges for all top reporters
  const allBadges = await db
    .select({
      userId: reporterBadges.userId,
      badgeType: reporterBadges.badgeType,
    })
    .from(reporterBadges);

  const badgeMap = new Map<string, string[]>();
  for (const b of allBadges) {
    if (!badgeMap.has(b.userId)) badgeMap.set(b.userId, []);
    badgeMap.get(b.userId)!.push(b.badgeType);
  }

  const trustLevel = (score: number) => {
    if (score >= 100) return "Top Reporter";
    if (score >= 50) return "Trusted";
    if (score >= 10) return "Contributor";
    return "Newcomer";
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Leaderboard</h2>

      {/* Current user stats */}
      {currentUser && currentUser.totalReports > 0 && (
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Your Stats</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-6 text-sm">
            <div>
              <span className="text-muted-foreground">Trust Score:</span>{" "}
              <span className="font-medium">{currentUser.trustScore}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Level:</span>{" "}
              <span className="font-medium">{trustLevel(currentUser.trustScore)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Reports:</span>{" "}
              <span className="font-medium">{currentUser.verifiedReports}/{currentUser.totalReports} verified</span>
            </div>
            <div>
              <span className="text-muted-foreground">Streak:</span>{" "}
              <span className="font-medium">{currentUser.currentStreak} days</span>
            </div>
          </CardContent>
        </Card>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">#</TableHead>
            <TableHead>Reporter</TableHead>
            <TableHead>Trust Score</TableHead>
            <TableHead>Level</TableHead>
            <TableHead>Reports</TableHead>
            <TableHead>Accuracy</TableHead>
            <TableHead>Streak</TableHead>
            <TableHead>Badges</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {topReporters.map((reporter, i) => {
            const badges = badgeMap.get(reporter.id) ?? [];
            const isCurrentUser = currentUser?.id === reporter.id;
            return (
              <TableRow key={reporter.id} className={isCurrentUser ? "bg-muted/50" : ""}>
                <TableCell className="font-medium">{i + 1}</TableCell>
                <TableCell>
                  {reporter.email.split("@")[0]}
                  {isCurrentUser && <span className="text-xs text-muted-foreground ml-1">(you)</span>}
                </TableCell>
                <TableCell>{reporter.trustScore}</TableCell>
                <TableCell>
                  <Badge variant="outline">{trustLevel(reporter.trustScore)}</Badge>
                </TableCell>
                <TableCell>{reporter.verifiedReports}/{reporter.totalReports}</TableCell>
                <TableCell>{reporter.accuracy}%</TableCell>
                <TableCell>{reporter.currentStreak}d</TableCell>
                <TableCell className="flex gap-1 flex-wrap">
                  {badges.map((b) => (
                    <Badge key={b} variant="secondary" className="text-xs">
                      {BADGE_LABELS[b] ?? b}
                    </Badge>
                  ))}
                </TableCell>
              </TableRow>
            );
          })}
          {topReporters.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-muted-foreground">
                No reporters yet. Be the first to submit a sighting!
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/dashboard/leaderboard/
git commit -m "feat: add public leaderboard with trust scores and badges"
```

### Task 14.2: Update Seed Script with Trust Data

**Files:**
- Modify: `src/db/seed.ts`

**Step 1: Update seed to clear new tables and generate sample trust data**

Add to the imports at the top of `src/db/seed.ts`:

```typescript
import { stores, products, restockSightings, reporterBadges } from "./schema";
```

Update the clearing section to also clear badges:

```typescript
console.log("Clearing existing seed data...");
await db.delete(reporterBadges);
await db.delete(restockSightings);
await db.delete(stores);
await db.delete(products);
```

**Step 2: Commit**

```bash
git add src/db/seed.ts
git commit -m "chore: update seed script to clear badges table"
```

---

## Phase 15: Final Polish

### Task 15.1: Add Loading and Error States for New Pages

**Files:**
- Create: `src/app/dashboard/leaderboard/loading.tsx`

**Step 1: Create loading state**

Create `src/app/dashboard/leaderboard/loading.tsx`:

```tsx
export default function LeaderboardLoading() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-muted-foreground">Loading...</div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/dashboard/leaderboard/loading.tsx
git commit -m "feat: add loading state for leaderboard page"
```

### Task 15.2: Final Build Verification

**Step 1: Run full build**

```bash
npm run build
```

Expected: TypeScript compiles successfully.

**Step 2: Push schema changes**

```bash
npm run db:push
```

**Step 3: Final commit if needed**

```bash
git add -A
git commit -m "fix: resolve build issues"
```
