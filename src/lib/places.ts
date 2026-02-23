"use server";

import { db } from "@/db";
import { stores } from "@/db/schema";
import { and, gte, lte } from "drizzle-orm";

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!;

const SEARCH_QUERIES = [
  "Pokemon cards",
  "trading card store",
  "game store",
  "GameStop",
  "Target",
  "Walmart",
  "Barnes Noble",
];

function mapStoreType(types: string[]): "big_box" | "lgs" | "grocery" | "pharmacy" | "other" {
  const typeSet = new Set(types);
  if (typeSet.has("department_store") || typeSet.has("shopping_mall")) return "big_box";
  if (typeSet.has("grocery_or_supermarket") || typeSet.has("supermarket")) return "grocery";
  if (typeSet.has("pharmacy") || typeSet.has("drugstore")) return "pharmacy";
  if (typeSet.has("store") || typeSet.has("book_store")) return "lgs";
  return "other";
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
  const margin = radius / 111000;
  const existingStores = await db
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

  if (existingStores.length > 5) {
    return existingStores;
  }

  const newPlaces: PlaceResult[] = [];

  for (const query of SEARCH_QUERIES.slice(0, 3)) {
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

      if (!response.ok) continue;
      const data = await response.json();
      if (data.places) {
        newPlaces.push(...data.places);
      }
    } catch {
      continue;
    }
  }

  const uniquePlaces = new Map<string, PlaceResult>();
  for (const place of newPlaces) {
    if (!uniquePlaces.has(place.id)) {
      uniquePlaces.set(place.id, place);
    }
  }

  for (const place of uniquePlaces.values()) {
    const photoUrl = place.photos?.[0]
      ? `https://places.googleapis.com/v1/${place.photos[0].name}/media?maxHeightPx=200&key=${GOOGLE_MAPS_API_KEY}`
      : null;

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

export async function getStoresInBounds(
  south: number,
  west: number,
  north: number,
  east: number
) {
  return db
    .select()
    .from(stores)
    .where(
      and(
        gte(stores.latitude, south),
        lte(stores.latitude, north),
        gte(stores.longitude, west),
        lte(stores.longitude, east)
      )
    );
}
