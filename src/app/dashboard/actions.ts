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

export async function markBoxesViewedAction(boxIds: string[]) {
  const user = await requireUser();
  await Promise.all(boxIds.map((id) => markBoxViewed(user.id, id)));
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
