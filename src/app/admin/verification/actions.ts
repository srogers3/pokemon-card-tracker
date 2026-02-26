"use server";

import { db } from "@/db";
import { alertPreferences, users as usersTable, restockSightings, stores, products } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { eq, and, or, isNull, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { sendRestockAlert } from "@/lib/email";
import { adjustTrustScore } from "@/lib/trust";
import { openBox } from "@/lib/boxes";
import { getStarTier } from "@/lib/wild-creature";
import { creatureBoxes } from "@/db/schema";

export async function verifySighting(id: string) {
  await requireAdmin();
  await db
    .update(restockSightings)
    .set({ verified: true })
    .where(eq(restockSightings.id, id));

  // Get the sighting details, award trust points, and notify subscribers
  const [sighting] = await db
    .select({
      reportedBy: restockSightings.reportedBy,
      storeId: restockSightings.storeId,
      productId: restockSightings.productId,
      productName: products.name,
      storeName: stores.name,
      storeLocation: stores.locationLabel,
      status: restockSightings.status,
    })
    .from(restockSightings)
    .innerJoin(stores, eq(restockSightings.storeId, stores.id))
    .leftJoin(products, eq(restockSightings.productId, products.id))
    .where(eq(restockSightings.id, id))
    .limit(1);

  if (sighting) {
    // Award trust points to the reporter and open their box
    await adjustTrustScore(sighting.reportedBy, 5);
    const starTier = getStarTier(sighting.storeId);
    await openBox(id, starTier);

    const alertConditions = [
      or(
        isNull(alertPreferences.productId),
        ...(sighting.productId
          ? [eq(alertPreferences.productId, sighting.productId)]
          : [])
      ),
      or(
        eq(alertPreferences.region, sighting.storeLocation),
        isNull(alertPreferences.region)
      ),
    ];

    const matchingAlerts = await db
      .select({
        email: usersTable.email,
      })
      .from(alertPreferences)
      .innerJoin(usersTable, eq(alertPreferences.userId, usersTable.id))
      .where(and(...alertConditions));

    for (const alert of matchingAlerts) {
      await sendRestockAlert({
        to: alert.email,
        productName: sighting.productName ?? "General report",
        storeName: sighting.storeName,
        storeLocation: sighting.storeLocation,
        status: sighting.status,
      });
    }
  }

  revalidatePath("/admin/verification");
}

export async function rejectSighting(id: string) {
  await requireAdmin();
  // Delete the box first (cascade would handle this, but be explicit)
  await db.delete(creatureBoxes).where(eq(creatureBoxes.sightingId, id));
  await db.delete(restockSightings).where(eq(restockSightings.id, id));
  revalidatePath("/admin/verification");
}
