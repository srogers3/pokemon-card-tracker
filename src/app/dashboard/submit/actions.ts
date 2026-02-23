"use server";

import { db } from "@/db";
import { restockSightings } from "@/db/schema";
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
import { createEgg, hatchEgg } from "@/lib/eggs";
import { getWildPokemon } from "@/lib/wild-pokemon";

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

  // Get wild Pokemon for this store (deterministic by storeId + date)
  const wildPokemon = getWildPokemon(storeId);

  // Create an egg for this report
  const status = formData.get("status") as "found" | "not_found";
  await createEgg(userId, sighting.id, status, wildPokemon.id);

  // Update reporter stats (totalReports, streak)
  await updateReporterStats(userId);

  // Check for corroboration if not already auto-verified (only for product-specific reports)
  if (!autoVerify && productId) {
    const corroboratedUserId = await checkCorroboration(sighting.id, storeId, productId, sightedAt);
    if (corroboratedUserId) {
      await adjustTrustScore(userId, 10);
    }
  } else if (autoVerify) {
    // Auto-verified — hatch egg immediately
    await hatchEgg(sighting.id, false);
    await adjustTrustScore(userId, 5);
  }

  revalidatePath("/dashboard/submit");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/collection");
}
