"use server";

import { requireUser } from "@/lib/auth";
import { transferCreature, openPendingBox, getUnviewedOpenings } from "@/lib/boxes";
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

export async function openPendingBoxAction(boxId: string) {
  const user = await requireUser();
  const result = await openPendingBox(boxId, user.id);

  if (!result) {
    throw new Error("Box cannot be opened yet");
  }

  revalidatePath("/dashboard/collection");

  const openings = await getUnviewedOpenings(user.id);
  return { openings };
}
