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
import { createBox, openBox } from "@/lib/boxes";
import { getWildCreature } from "@/lib/wild-creature";

export async function submitTip(formData: FormData) {
  const user = await requireUser();
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // Rate limit check
  const canSubmit = await canSubmitReport(userId);
  if (!canSubmit) throw new Error("Daily report limit reached (max 10)");

  const storeId = formData.get("storeId") as string;
  const alreadyReported = await hasSubmittedToStoreToday(userId, storeId);
  if (alreadyReported) throw new Error("Already reported this location today");

  // Proximity check (skip if BYPASS_PROXIMITY_CHECK is set)
  if (!process.env.BYPASS_PROXIMITY_CHECK) {
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

  // Check for corroboration if not already auto-verified (only for product-specific reports)
  if (!autoVerify && productId) {
    const corroboratedUserId = await checkCorroboration(sighting.id, storeId, productId, sightedAt);
    if (corroboratedUserId) {
      await adjustTrustScore(userId, 10);
    }
  } else if (autoVerify) {
    // Auto-verified — open box immediately
    await openBox(sighting.id, false);
    await adjustTrustScore(userId, 5);
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/collection");
}
