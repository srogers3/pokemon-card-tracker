"use server";

import { db } from "@/db";
import { products, NewProduct } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createProduct(
  data: Omit<NewProduct, "id" | "createdAt">
) {
  await requireAdmin();
  await db.insert(products).values(data);
  revalidatePath("/admin/products");
}

export async function deleteProduct(id: string) {
  await requireAdmin();
  await db.delete(products).where(eq(products.id, id));
  revalidatePath("/admin/products");
}
