"use server";

import { requireUser } from "@/lib/auth";
import { markBoxViewed } from "@/lib/boxes";

export async function markBoxViewedAction(boxId: string) {
  const user = await requireUser();
  await markBoxViewed(user.id, boxId);
}
