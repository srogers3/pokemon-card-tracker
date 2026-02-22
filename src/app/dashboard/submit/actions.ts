"use server";

import { db } from "@/db";
import { restockSightings } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { auth } from "@clerk/nextjs/server";
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
      status: formData.get("status") as "found" | "not_found",
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
