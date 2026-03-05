import { db } from "@/db";
import { alertPreferences, users as usersTable, stores } from "@/db/schema";
import { eq, or, isNull } from "drizzle-orm";
import { sendRestockAlert } from "@/lib/email";

/** Haversine distance in miles between two lat/lng points */
function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 3958.8; // Earth radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Send restock alert emails to users whose alert preferences match
 * the given sighting details.
 */
export async function sendMatchingAlerts(sighting: {
  storeId: string;
  productId: string | null;
  productName: string | null;
  storeName: string;
  storeLocation: string;
  status: string;
}) {
  // Get the store's coordinates for distance matching
  const [store] = await db
    .select({ latitude: stores.latitude, longitude: stores.longitude })
    .from(stores)
    .where(eq(stores.id, sighting.storeId))
    .limit(1);

  // Match alerts by product (exact or wildcard)
  const productCondition = or(
    isNull(alertPreferences.productId),
    ...(sighting.productId
      ? [eq(alertPreferences.productId, sighting.productId)]
      : [])
  );

  const allAlerts = await db
    .select({
      email: usersTable.email,
      latitude: alertPreferences.latitude,
      longitude: alertPreferences.longitude,
      radiusMiles: alertPreferences.radiusMiles,
      region: alertPreferences.region,
    })
    .from(alertPreferences)
    .innerJoin(usersTable, eq(alertPreferences.userId, usersTable.id))
    .where(productCondition);

  // Filter by distance (zip+radius) or legacy region match or no location set
  const matchingAlerts = allAlerts.filter((alert) => {
    if (!alert.latitude && !alert.region) return true;
    if (alert.region) return alert.region === sighting.storeLocation;
    if (alert.latitude && alert.longitude && store?.latitude && store?.longitude) {
      const distance = haversineDistance(
        alert.latitude, alert.longitude,
        store.latitude, store.longitude
      );
      return distance <= (alert.radiusMiles ?? 25);
    }
    return false;
  });

  for (const alert of matchingAlerts) {
    await sendRestockAlert({
      to: alert.email,
      productName: sighting.productName ?? "General report",
      storeName: sighting.storeName,
      storeLocation: sighting.storeLocation,
      status: sighting.status,
    });
  }
}
