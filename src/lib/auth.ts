import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getCurrentUser() {
  const { userId } = await auth();
  if (!userId) return null;

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (user) return user;

  // User exists in Clerk but not in DB (e.g. webhook not configured locally).
  // Auto-create them so the app works without webhook setup in dev.
  const clerkUser = await currentUser();
  const email = clerkUser?.emailAddresses[0]?.emailAddress;
  if (!email) return null;

  const [created] = await db
    .insert(users)
    .values({ id: userId, email, subscriptionTier: "free" })
    .onConflictDoNothing()
    .returning();

  return created ?? null;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}

export async function requirePremium() {
  const user = await requireUser();
  if (user.subscriptionTier !== "premium") {
    throw new Error("Premium subscription required");
  }
  return user;
}

export async function requireAdmin() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // Use currentUser() to read publicMetadata directly from the API,
  // since Clerk doesn't include it in JWT session claims by default.
  const clerkUser = await currentUser();
  const role = (clerkUser?.publicMetadata as { role?: string })?.role;
  if (role !== "admin") throw new Error("Admin access required");

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) throw new Error("User not found");
  return user;
}
