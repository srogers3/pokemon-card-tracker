"use server";

import { db } from "@/db";
import { alertPreferences, users as usersTable, restockSightings, stores, products } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { eq, and, or, isNull, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { sendRestockAlert } from "@/lib/email";
import { adjustTrustScore } from "@/lib/trust";
import { hatchEgg } from "@/lib/eggs";
import { pokemonEggs } from "@/db/schema";

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
    // Award trust points to the reporter and hatch their egg
    await adjustTrustScore(sighting.reportedBy, 5);
    await hatchEgg(id, false);

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
  // Delete the egg first (cascade would handle this, but be explicit)
  await db.delete(pokemonEggs).where(eq(pokemonEggs.sightingId, id));
  await db.delete(restockSightings).where(eq(restockSightings.id, id));
  revalidatePath("/admin/verification");
}
