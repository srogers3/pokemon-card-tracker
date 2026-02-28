"use server";

import { db } from "@/db";
import { restockSightings, stores } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getDistanceMeters, MAX_TIP_DISTANCE_M } from "@/lib/utils";
import { requireUser } from "@/lib/auth";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import {
  shouldAutoVerify,
  canSubmitReport,
  hasSubmittedToStoreToday,
  checkCorroboration,
  adjustTrustScore,
  updateReporterStats,
} from "@/lib/trust";
import { createBox, openBox, getUnviewedOpenings, markBoxViewed } from "@/lib/boxes";
import { getWildCreature, getStarTier } from "@/lib/wild-creature";
import { getDevOverrides } from "@/lib/dev";

export async function submitTip(formData: FormData): Promise<{
  opened: boolean;
  openings?: Awaited<ReturnType<typeof getUnviewedOpenings>>;
}> {
  const user = await requireUser();
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const devOverrides = await getDevOverrides();

  // Rate limit check (skip both limits when dev override is active)
  if (!devOverrides.skipSightingLimits) {
    const canSubmit = await canSubmitReport(userId);
    if (!canSubmit) throw new Error("Daily report limit reached (max 10)");
  }

  const storeId = formData.get("storeId") as string;
  if (!devOverrides.skipSightingLimits) {
    const alreadyReported = await hasSubmittedToStoreToday(userId, storeId);
    if (alreadyReported) throw new Error("Already reported this location today");
  }

  // Proximity check (skip if BYPASS_PROXIMITY_CHECK is explicitly "true" or dev override)
  if (process.env.BYPASS_PROXIMITY_CHECK !== "true" && !devOverrides.skipProximity) {
    const userLat = parseFloat(formData.get("userLatitude") as string);
    const userLng = parseFloat(formData.get("userLongitude") as string);
    if (isNaN(userLat) || isNaN(userLng)) {
      throw new Error("Location is required to submit a report");
    }

    const [store] = await db
      .select({ latitude: stores.latitude, longitude: stores.longitude })
      .from(stores)
      .where(eq(stores.id, storeId))
      .limit(1);

    if (store?.latitude == null || store?.longitude == null) {
      throw new Error("Store location not available");
    }

    const distance = getDistanceMeters(userLat, userLng, store.latitude, store.longitude);
    if (distance > MAX_TIP_DISTANCE_M) {
      throw new Error("You must be near this store to submit a report");
    }
  }

  const productId = (formData.get("productId") as string) || null;
  const sightedAt = new Date(formData.get("sightedAt") as string);
  const autoVerify = shouldAutoVerify(user.trustScore);
  const isPremium = user.subscriptionTier === "premium" || devOverrides.simulatePremium;

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

  // Get wild creature for this store (deterministic by storeId + date)
  const wildCreature = getWildCreature(storeId);

  // Create a box for this report
  const status = formData.get("status") as "found" | "not_found";
  await createBox(userId, sighting.id, status, wildCreature.id);

  // Update reporter stats (totalReports, streak)
  await updateReporterStats(userId);

  // Check for corroboration (only for non-auto-verified, product-specific reports)
  if (!autoVerify && productId) {
    const corroboratedUserId = await checkCorroboration(sighting.id, storeId, productId, sightedAt, devOverrides.forceCorroborate);
    if (corroboratedUserId) {
      await adjustTrustScore(userId, 10);
    }
  }

  // Open box immediately for auto-verify or premium users
  if (autoVerify || isPremium) {
    const starTier = getStarTier(storeId);
    await openBox(sighting.id, starTier);
  }

  if (autoVerify) {
    await adjustTrustScore(userId, 5);
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/collection");

  // Show the on-map box opening animation when the box was opened immediately.
  // Mark as viewed so the layout modal doesn't also show them (double-up).
  if (autoVerify || isPremium) {
    const openings = await getUnviewedOpenings(userId);
    await Promise.all(openings.map((o) => markBoxViewed(userId, o.id)));
    return { opened: true, openings };
  }

  return { opened: false };
}
