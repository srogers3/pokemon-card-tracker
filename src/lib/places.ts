"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { stores, searchCache } from "@/db/schema";
import { and, gte, lte, eq } from "drizzle-orm";

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!;

const SEARCH_QUERIES = [
  // Generic searches
  "Pokemon cards",
  "trading card store",
  "game store",
  // Known retailers
  "GameStop",
  "Target",
  "Walmart",
  "Barnes Noble",
  "Dollar General",
  "Dollar Tree",
  "Five Below",
  "Walgreens",
  "CVS",
];

// Place types that clearly cannot sell Pokemon cards
const EXCLUDED_PLACE_TYPES = new Set([
  "church", "place_of_worship", "mosque", "synagogue", "hindu_temple",
  "school", "primary_school", "secondary_school", "university",
  "hospital", "doctor", "dentist", "veterinary_care",
  "cemetery", "funeral_home",
  "police", "fire_station", "local_government_office", "city_hall", "courthouse",
  "lawyer", "accounting", "insurance_agency", "real_estate_agency",
  "car_dealer", "car_repair", "car_wash", "car_rental",
  "gym", "hair_care", "beauty_salon", "spa",
  "lodging", "campground",
  "airport", "bus_station", "subway_station", "train_station", "transit_station",
  "bank", "atm",
  "parking",
  "night_club", "bar",
  "laundry",
  "restaurant", "cafe", "meal_delivery", "meal_takeaway",
]);

function isLikelyRetailStore(types: string[]): boolean {
  return !types.some((t) => EXCLUDED_PLACE_TYPES.has(t));
}

function mapStoreType(types: string[]): "big_box" | "lgs" | "grocery" | "pharmacy" | "other" {
  const typeSet = new Set(types);
  if (typeSet.has("department_store") || typeSet.has("shopping_mall")) return "big_box";
  if (typeSet.has("grocery_or_supermarket") || typeSet.has("supermarket")) return "grocery";
  if (typeSet.has("pharmacy") || typeSet.has("drugstore")) return "pharmacy";
  if (typeSet.has("store") || typeSet.has("book_store")) return "lgs";
  return "other";
}

function toGridCell(lat: number, lng: number): { gridLat: number; gridLng: number } {
  return {
    gridLat: Math.round(lat / 0.05) * 0.05,
    gridLng: Math.round(lng / 0.05) * 0.05,
  };
}

interface PlaceResult {
  id: string;
  displayName: { text: string };
  formattedAddress: string;
  location: { latitude: number; longitude: number };
  types: string[];
  photos?: { name: string }[];
}

export async function searchNearbyStores(lat: number, lng: number, radius: number = 8000) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const margin = radius / 111000;
  const { gridLat, gridLng } = toGridCell(lat, lng);

  // Check if this grid cell has been searched within the last 7 days
  const cacheExpiry = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const cached = await db
    .select()
    .from(searchCache)
    .where(
      and(
        eq(searchCache.gridLat, gridLat),
        eq(searchCache.gridLng, gridLng),
        gte(searchCache.searchedAt, cacheExpiry)
      )
    )
    .limit(1);

  if (cached.length > 0) {
    // Cache hit — return stores from DB
    return db
      .select()
      .from(stores)
      .where(
        and(
          gte(stores.latitude, lat - margin),
          lte(stores.latitude, lat + margin),
          gte(stores.longitude, lng - margin),
          lte(stores.longitude, lng + margin)
        )
      );
  }

  // Cache miss — query Places API for all search terms
  const newPlaces: PlaceResult[] = [];

  for (const query of SEARCH_QUERIES) {
    try {
      const response = await fetch(
        "https://places.googleapis.com/v1/places:searchText",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
            "X-Goog-FieldMask":
              "places.id,places.displayName,places.formattedAddress,places.location,places.types,places.photos",
            "Referer": process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
          },
          body: JSON.stringify({
            textQuery: query,
            locationBias: {
              circle: {
                center: { latitude: lat, longitude: lng },
                radius: radius,
              },
            },
            maxResultCount: 10,
          }),
        }
      );

      if (!response.ok) {
        continue;
      }
      const data = await response.json();
      if (data.places) {
        newPlaces.push(...data.places);
      }
    } catch {
      continue;
    }
  }

  // Deduplicate by place ID
  const uniquePlaces = new Map<string, PlaceResult>();
  for (const place of newPlaces) {
    if (!uniquePlaces.has(place.id)) {
      uniquePlaces.set(place.id, place);
    }
  }

  // Deduplicate by proximity + similar name (e.g. "Walgreens" vs "Walgreens Pharmacy")
  const deduped = Array.from(uniquePlaces.values());
  const removed = new Set<string>();
  for (let i = 0; i < deduped.length; i++) {
    if (removed.has(deduped[i].id)) continue;
    for (let j = i + 1; j < deduped.length; j++) {
      if (removed.has(deduped[j].id)) continue;
      const a = deduped[i];
      const b = deduped[j];
      const distMeters = Math.sqrt(
        Math.pow((a.location.latitude - b.location.latitude) * 111000, 2) +
        Math.pow((a.location.longitude - b.location.longitude) * 111000 * Math.cos(a.location.latitude * Math.PI / 180), 2)
      );
      if (distMeters > 50) continue;
      const nameA = a.displayName.text.toLowerCase();
      const nameB = b.displayName.text.toLowerCase();
      if (nameA.includes(nameB) || nameB.includes(nameA)) {
        // Keep the shorter name (the parent store, not the sub-unit)
        removed.add(nameA.length <= nameB.length ? b.id : a.id);
      }
    }
  }

  // Upsert stores
  for (const place of uniquePlaces.values()) {
    if (removed.has(place.id)) continue;
    if (!isLikelyRetailStore(place.types)) continue;

    const photoUrl = place.photos?.[0]?.name ?? null;

    await db
      .insert(stores)
      .values({
        name: place.displayName.text,
        locationLabel: place.formattedAddress,
        storeType: mapStoreType(place.types),
        latitude: place.location.latitude,
        longitude: place.location.longitude,
        placeId: place.id,
        photoUrl: photoUrl,
      })
      .onConflictDoUpdate({
        target: stores.placeId,
        set: {
          name: place.displayName.text,
          locationLabel: place.formattedAddress,
          photoUrl: photoUrl,
        },
      });
  }

  // Mark this grid cell as searched (update timestamp if re-searching after expiry)
  await db
    .insert(searchCache)
    .values({ gridLat, gridLng })
    .onConflictDoUpdate({
      target: [searchCache.gridLat, searchCache.gridLng],
      set: { searchedAt: new Date() },
    });

  return db
    .select()
    .from(stores)
    .where(
      and(
        gte(stores.latitude, lat - margin),
        lte(stores.latitude, lat + margin),
        gte(stores.longitude, lng - margin),
        lte(stores.longitude, lng + margin)
      )
    );
}
