"use server";

import { db } from "@/db";
import { restockSightings } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";

export async function createAdminSighting(formData: FormData) {
  await requireAdmin();
  const { userId } = await auth();

  await db.insert(restockSightings).values({
    storeId: formData.get("storeId") as string,
    productId: formData.get("productId") as string,
    reportedBy: userId!,
    sightedAt: new Date(formData.get("sightedAt") as string),
    status: formData.get("status") as "found" | "not_found",
    verified: true, // Admin sightings are auto-verified
    source: "admin",
    notes: (formData.get("notes") as string) || null,
  });

  revalidatePath("/admin/sightings");
}

export async function deleteSighting(id: string) {
  await requireAdmin();
  await db.delete(restockSightings).where(eq(restockSightings.id, id));
  revalidatePath("/admin/sightings");
}
