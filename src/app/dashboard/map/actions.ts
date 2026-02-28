"use server";

import { db } from "@/db";
import { stores, restockSightings, products } from "@/db/schema";
import { eq, desc, gte, and, isNotNull } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { getSubmittedStoreIdsToday } from "@/lib/trust";
import { getDevOverrides } from "@/lib/dev";
import { analyzeTrends } from "@/lib/trends";
import { getUserCollection } from "@/lib/boxes";

export async function getStoresWithSightings() {
  const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

  const { userId } = await auth();
  const devOverrides = await getDevOverrides();
  const submittedStoreIds = userId && !devOverrides.skipSightingLimits
    ? await getSubmittedStoreIdsToday(userId)
    : new Set<string>();

  const allStores = await db
    .select()
    .from(stores)
    .where(
      and(isNotNull(stores.latitude), isNotNull(stores.longitude))
    );

  const recentSightings = await db
    .select({
      id: restockSightings.id,
      storeId: restockSightings.storeId,
      productName: products.name,
      status: restockSightings.status,
      sightedAt: restockSightings.sightedAt,
      verified: restockSightings.verified,
    })
    .from(restockSightings)
    .leftJoin(products, eq(restockSightings.productId, products.id))
    .where(gte(restockSightings.sightedAt, fortyEightHoursAgo))
    .orderBy(desc(restockSightings.sightedAt));

  const sightingsByStore = new Map<string, typeof recentSightings>();
  for (const s of recentSightings) {
    const existing = sightingsByStore.get(s.storeId) ?? [];
    existing.push(s);
    sightingsByStore.set(s.storeId, existing);
  }

  return allStores.map((store) => {
    const storeSightings = sightingsByStore.get(store.id) ?? [];
    return {
      store,
      lastSightingAt: storeSightings.length > 0 ? storeSightings[0].sightedAt : null,
      hasSubmittedToday: submittedStoreIds.has(store.id),
      sightings: storeSightings.map((s) => ({
        id: s.id,
        productName: s.productName ?? "General report",
        status: s.status,
        sightedAt: s.sightedAt,
        verified: s.verified,
      })),
    };
  });
}

export async function getMapPageData() {
  const { userId } = await auth();
  const [allProducts, storesWithSightings, userBoxes] = await Promise.all([
    db.select().from(products).orderBy(desc(products.releaseDate), products.name),
    getStoresWithSightings(),
    userId ? getUserCollection(userId) : Promise.resolve([]),
  ]);
  return {
    stores: storesWithSightings,
    products: allProducts,
    userBoxes: userBoxes.map((b) => ({
      creatureId: b.creatureId,
      wildCreatureId: b.wildCreatureId,
      isShiny: b.isShiny,
      opened: b.opened,
    })),
  };
}

export async function getStoreTrends(storeId: string) {
  const sightings = await db
    .select({
      sightedAt: restockSightings.sightedAt,
      verified: restockSightings.verified,
    })
    .from(restockSightings)
    .where(
      and(
        eq(restockSightings.storeId, storeId),
        eq(restockSightings.status, "found")
      )
    );

  return analyzeTrends(
    sightings.map((s) => ({
      date: new Date(s.sightedAt),
      verified: s.verified,
    }))
  );
}
