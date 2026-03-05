"use server";

import { db } from "@/db";
import { restockSightings, stores, products } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { sendMatchingAlerts } from "@/lib/alerts";

export async function createAdminSighting(formData: FormData) {
  await requireAdmin();
  const { userId } = await auth();

  const storeId = formData.get("storeId") as string;
  const productId = formData.get("productId") as string;
  const status = formData.get("status") as "found" | "not_found";

  const [sighting] = await db
    .insert(restockSightings)
    .values({
      storeId,
      productId,
      reportedBy: userId!,
      sightedAt: new Date(),
      status,
      verified: true,
      source: "admin",
      notes: (formData.get("notes") as string) || null,
    })
    .returning();

  // Send alert emails to matching subscribers
  const [store] = await db
    .select({ name: stores.name, locationLabel: stores.locationLabel })
    .from(stores)
    .where(eq(stores.id, storeId))
    .limit(1);

  let productName: string | null = null;
  if (productId) {
    const [product] = await db
      .select({ name: products.name })
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);
    productName = product?.name ?? null;
  }

  if (store) {
    sendMatchingAlerts({
      storeId,
      productId,
      productName,
      storeName: store.name,
      storeLocation: store.locationLabel,
      status,
    }).catch((err) => console.error("[createAdminSighting] Alert email error:", err));
  }

  revalidatePath("/admin/sightings");
}

export async function deleteSighting(id: string) {
  await requireAdmin();
  await db.delete(restockSightings).where(eq(restockSightings.id, id));
  revalidatePath("/admin/sightings");
}
