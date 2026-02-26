import { StoreMap } from "@/components/map/store-map";
import { getStoresWithSightings } from "./actions";
import { db } from "@/db";
import { products } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { getUserCollection } from "@/lib/boxes";

export default async function MapPage() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID;
  if (!apiKey || !mapId) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-muted-foreground">
        Google Maps API key or Map ID not configured. Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY and NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID to your environment.
      </div>
    );
  }

  const [user, storesWithSightings, allProducts] = await Promise.all([
    requireUser(),
    getStoresWithSightings(),
    db.select().from(products),
  ]);
  const userBoxes = await getUserCollection(user.id);

  return <StoreMap initialStores={storesWithSightings} products={allProducts} apiKey={apiKey} mapId={mapId} userBoxes={userBoxes} />;
}
