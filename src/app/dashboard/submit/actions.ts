"use server";

import { db } from "@/db";
import { restockSightings } from "@/db/schema";
import { requirePremium } from "@/lib/auth";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function submitTip(formData: FormData) {
  await requirePremium();
  const { userId } = await auth();

  await db.insert(restockSightings).values({
    storeId: formData.get("storeId") as string,
    productId: formData.get("productId") as string,
    reportedBy: userId!,
    sightedAt: new Date(formData.get("sightedAt") as string),
    status: formData.get("status") as "in_stock" | "limited" | "out_of_stock",
    verified: false, // Community tips need admin verification
    source: "community",
    notes: (formData.get("notes") as string) || null,
  });

  revalidatePath("/dashboard/submit");
}
