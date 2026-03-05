"use server";

import { db } from "@/db";
import { restockSightings, stores, products, users } from "@/db/schema";
import { desc, gte, eq, sql } from "drizzle-orm";
import { getDistanceMeters } from "@/lib/utils";
import { getCurrentUser } from "@/lib/auth";
import { getDevOverrides } from "@/lib/dev";

export type SightingItem = {
  id: string;
  storeName: string;
  storeLocation: string;
  productName: string | null;
  status: "found" | "not_found";
  sightedAt: Date;
  verified: boolean;
  notes: string | null;
  reporterName: string;
  source: "admin" | "community";
};

const NEARBY_RADIUS_M = 40_234; // ~25 miles

async function resolveIsPremium(): Promise<boolean> {
  const devOverrides = await getDevOverrides();
  if (devOverrides.simulatePremium) return true;
  const user = await getCurrentUser();
  return user?.subscriptionTier === "premium";
}

async function querySightings(isPremium: boolean) {
  const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

  return db
    .select({
      id: restockSightings.id,
      storeId: restockSightings.storeId,
      storeName: stores.name,
      storeLocation: stores.locationLabel,
      storeLat: stores.latitude,
      storeLng: stores.longitude,
      productName: products.name,
      status: restockSightings.status,
      sightedAt: restockSightings.sightedAt,
      verified: restockSightings.verified,
      notes: restockSightings.notes,
      reporterName: sql<string>`split_part(${users.email}, '@', 1)`.as("reporter_name"),
      source: restockSightings.source,
    })
    .from(restockSightings)
    .innerJoin(stores, eq(restockSightings.storeId, stores.id))
    .leftJoin(products, eq(restockSightings.productId, products.id))
    .innerJoin(users, eq(restockSightings.reportedBy, users.id))
    .where(
      isPremium ? undefined : gte(restockSightings.sightedAt, fortyEightHoursAgo)
    )
    .orderBy(desc(restockSightings.sightedAt))
    .limit(isPremium ? 200 : 50);
}

function toSightingItem(row: Awaited<ReturnType<typeof querySightings>>[number]): SightingItem {
  return {
    id: row.id,
    storeName: row.storeName,
    storeLocation: row.storeLocation,
    productName: row.productName,
    status: row.status,
    sightedAt: row.sightedAt,
    verified: row.verified,
    notes: row.notes,
    reporterName: row.reporterName,
    source: row.source,
  };
}

export async function getRecentSightings(): Promise<SightingItem[]> {
  const isPremium = await resolveIsPremium();
  const rows = await querySightings(isPremium);
  return rows.map(toSightingItem);
}

export async function getNearbySightings(
  lat: number,
  lng: number,
): Promise<SightingItem[]> {
  const isPremium = await resolveIsPremium();
  const rows = await querySightings(isPremium);

  return rows
    .filter((row) => {
      if (row.storeLat == null || row.storeLng == null) return false;
      return getDistanceMeters(lat, lng, row.storeLat, row.storeLng) <= NEARBY_RADIUS_M;
    })
    .map(toSightingItem);
}
