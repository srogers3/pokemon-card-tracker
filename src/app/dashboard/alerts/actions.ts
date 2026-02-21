"use server";

import { db } from "@/db";
import { alertPreferences } from "@/db/schema";
import { requirePremium } from "@/lib/auth";
import { auth } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createAlert(formData: FormData) {
  await requirePremium();
  const { userId } = await auth();

  await db.insert(alertPreferences).values({
    userId: userId!,
    productId: (formData.get("productId") as string) || null,
    region: (formData.get("region") as string) || null,
  });

  revalidatePath("/dashboard/alerts");
}

export async function deleteAlert(id: string) {
  await requirePremium();
  const { userId } = await auth();

  await db
    .delete(alertPreferences)
    .where(
      and(eq(alertPreferences.id, id), eq(alertPreferences.userId, userId!))
    );

  revalidatePath("/dashboard/alerts");
}
