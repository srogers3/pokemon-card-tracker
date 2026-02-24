"use server";

import { requireUser } from "@/lib/auth";
import { transferCreature } from "@/lib/boxes";
import { revalidatePath } from "next/cache";

export async function transferAction(eggId: string) {
  const user = await requireUser();
  const result = await transferCreature(user.id, eggId);

  if ("error" in result) {
    throw new Error(result.error);
  }

  revalidatePath("/dashboard/collection");
  return result;
}
