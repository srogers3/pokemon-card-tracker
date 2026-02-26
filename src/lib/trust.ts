import { db } from "@/db";
import {
  users,
  restockSightings,
  reporterBadges,
  badgeTypeEnum,
} from "@/db/schema";
import { eq, and, gte, lte, ne, sql } from "drizzle-orm";

type BadgeType = (typeof badgeTypeEnum.enumValues)[number];

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

export async function hasSubmittedToStoreToday(
  userId: string,
  storeId: string
): Promise<boolean> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [result] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(restockSightings)
    .where(
      and(
        eq(restockSightings.reportedBy, userId),
        eq(restockSightings.storeId, storeId),
        gte(restockSightings.createdAt, today)
      )
    );

  return (result?.count ?? 0) > 0;
}

export async function getSubmittedStoreIdsToday(
  userId: string
): Promise<Set<string>> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const rows = await db
    .select({ storeId: restockSightings.storeId })
    .from(restockSightings)
    .where(
      and(
        eq(restockSightings.reportedBy, userId),
        gte(restockSightings.createdAt, today)
      )
    );

  return new Set(rows.map((r) => r.storeId));
}

export async function checkCorroboration(
  sightingId: string,
  storeId: string,
  productId: string,
  sightedAt: Date,
  forceCorroborate: boolean = false
): Promise<string | null> {
  const windowStart = new Date(
    sightedAt.getTime() - CORROBORATION_WINDOW_HOURS * 60 * 60 * 1000
  );
  const windowEnd = new Date(
    sightedAt.getTime() + CORROBORATION_WINDOW_HOURS * 60 * 60 * 1000
  );

  const conditions = [
    eq(restockSightings.storeId, storeId),
    eq(restockSightings.productId, productId),
    eq(restockSightings.verified, false),
    gte(restockSightings.sightedAt, windowStart),
    lte(restockSightings.sightedAt, windowEnd),
  ];

  // In dev mode with force corroborate, allow self-corroboration
  if (!forceCorroborate) {
    conditions.push(ne(restockSightings.id, sightingId));
  }

  const [match] = await db
    .select({
      id: restockSightings.id,
      reportedBy: restockSightings.reportedBy,
    })
    .from(restockSightings)
    .where(and(...conditions))
    .limit(1);

  if (!match) return null;

  // Corroboration found — verify both sightings
  await db
    .update(restockSightings)
    .set({ verified: true, corroboratedBy: sightingId })
    .where(eq(restockSightings.id, match.id));
  await db
    .update(restockSightings)
    .set({ verified: true, corroboratedBy: match.id })
    .where(eq(restockSightings.id, sightingId));

  // Open boxes for both reporters
  const { openBox } = await import("@/lib/boxes");
  const { getStarTier } = await import("@/lib/wild-creature");
  const starTier = getStarTier(storeId);
  await openBox(match.id, starTier);
  await openBox(sightingId, starTier);

  // Award points to the other reporter
  await adjustTrustScore(match.reportedBy, POINTS_CORROBORATED);

  return match.reportedBy;
}

export async function adjustTrustScore(
  userId: string,
  points: number
): Promise<void> {
  const setClause: Record<string, unknown> = {
    trustScore: sql`GREATEST(0, trust_score + ${points})`,
  };
  if (points > 0) {
    setClause.verifiedReports = sql`verified_reports + 1`;
  }
  await db.update(users).set(setClause).where(eq(users.id, userId));

  await checkAndAwardBadges(userId);
}

export async function updateReporterStats(userId: string): Promise<void> {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

  const [user] = await db
    .select({
      currentStreak: users.currentStreak,
      lastReportDate: users.lastReportDate,
    })
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

  const toAward: BadgeType[] = [];
  if (user.totalReports >= 1 && !earned.has("first_report"))
    toAward.push("first_report");
  if (user.verifiedReports >= 10 && !earned.has("verified_10"))
    toAward.push("verified_10");
  if (user.verifiedReports >= 50 && !earned.has("verified_50"))
    toAward.push("verified_50");
  if (
    user.trustScore >= TRUST_THRESHOLD_AUTO_VERIFY &&
    !earned.has("trusted_reporter")
  )
    toAward.push("trusted_reporter");
  if (user.currentStreak >= 7 && !earned.has("streak_7"))
    toAward.push("streak_7");
  if (user.currentStreak >= 30 && !earned.has("streak_30"))
    toAward.push("streak_30");

  if (toAward.length > 0) {
    await db.insert(reporterBadges).values(
      toAward.map((badge) => ({
        userId,
        badgeType: badge,
      }))
    );
  }
}
