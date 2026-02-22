"use server";

import { requireUser } from "@/lib/auth";
import { transferPokemon } from "@/lib/eggs";
import { revalidatePath } from "next/cache";

export async function transferAction(eggId: string) {
  const user = await requireUser();
  const result = await transferPokemon(user.id, eggId);

  if ("error" in result) {
    throw new Error(result.error);
  }

  revalidatePath("/dashboard/collection");
  return result;
}
