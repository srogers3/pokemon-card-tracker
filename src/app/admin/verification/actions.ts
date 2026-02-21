"use server";

import { db } from "@/db";
import { alertPreferences, users as usersTable, restockSightings, stores, products } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { eq, and, or, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { sendRestockAlert } from "@/lib/email";

export async function verifySighting(id: string) {
  await requireAdmin();
  await db
    .update(restockSightings)
    .set({ verified: true })
    .where(eq(restockSightings.id, id));

  // Get the sighting details and notify subscribers
  const [sighting] = await db
    .select({
      productId: restockSightings.productId,
      productName: products.name,
      storeName: stores.name,
      storeLocation: stores.locationLabel,
      status: restockSightings.status,
    })
    .from(restockSightings)
    .innerJoin(stores, eq(restockSightings.storeId, stores.id))
    .innerJoin(products, eq(restockSightings.productId, products.id))
    .where(eq(restockSightings.id, id))
    .limit(1);

  if (sighting) {
    const matchingAlerts = await db
      .select({
        email: usersTable.email,
      })
      .from(alertPreferences)
      .innerJoin(usersTable, eq(alertPreferences.userId, usersTable.id))
      .where(
        and(
          or(
            eq(alertPreferences.productId, sighting.productId),
            isNull(alertPreferences.productId)
          ),
          or(
            eq(alertPreferences.region, sighting.storeLocation),
            isNull(alertPreferences.region)
          )
        )
      );

    for (const alert of matchingAlerts) {
      await sendRestockAlert({
        to: alert.email,
        productName: sighting.productName,
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
  await db.delete(restockSightings).where(eq(restockSightings.id, id));
  revalidatePath("/admin/verification");
}
