"use server";

import { db } from "@/db";
import { stores, NewStore } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createStore(data: Omit<NewStore, "id" | "createdAt">) {
  await requireAdmin();
  await db.insert(stores).values(data);
  revalidatePath("/admin/stores");
}

export async function deleteStore(id: string) {
  await requireAdmin();
  await db.delete(stores).where(eq(stores.id, id));
  revalidatePath("/admin/stores");
}
