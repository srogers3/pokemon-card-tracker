"use server";

import { db } from "@/db";
import { restockSightings } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function verifySighting(id: string) {
  await requireAdmin();
  await db
    .update(restockSightings)
    .set({ verified: true })
    .where(eq(restockSightings.id, id));
  revalidatePath("/admin/verification");
}

export async function rejectSighting(id: string) {
  await requireAdmin();
  await db.delete(restockSightings).where(eq(restockSightings.id, id));
  revalidatePath("/admin/verification");
}
