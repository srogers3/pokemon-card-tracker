"use server";

import { db } from "@/db";
import { alertPreferences } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { auth } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

async function geocodeZip(
  zipCode: string
): Promise<{ lat: number; lng: number } | null> {
  // Zippopotam.us — free zip code geocoder, no API key needed
  const res = await fetch(`https://api.zippopotam.us/us/${encodeURIComponent(zipCode)}`);
  if (!res.ok) return null;
  const data = await res.json();
  const place = data?.places?.[0];
  if (place) {
    return { lat: parseFloat(place.latitude), lng: parseFloat(place.longitude) };
  }
  return null;
}

export async function createAlert(formData: FormData) {
  await requireUser();
  const { userId } = await auth();

  const zipCode = (formData.get("zipCode") as string)?.trim() || null;
  const radiusMiles = parseInt(formData.get("radiusMiles") as string) || 25;

  let latitude: number | null = null;
  let longitude: number | null = null;

  if (zipCode) {
    const coords = await geocodeZip(zipCode);
    if (!coords) {
      throw new Error("Could not find that zip code. Please try again.");
    }
    latitude = coords.lat;
    longitude = coords.lng;
  }

  await db.insert(alertPreferences).values({
    userId: userId!,
    productId: (formData.get("productId") as string) || null,
    zipCode,
    latitude,
    longitude,
    radiusMiles,
  });

  revalidatePath("/dashboard/alerts");
}

export async function deleteAlert(id: string) {
  await requireUser();
  const { userId } = await auth();

  await db
    .delete(alertPreferences)
    .where(
      and(eq(alertPreferences.id, id), eq(alertPreferences.userId, userId!))
    );

  revalidatePath("/dashboard/alerts");
}
