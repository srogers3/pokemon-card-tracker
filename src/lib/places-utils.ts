// Place types that clearly cannot sell trading cards
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

export function isLikelyRetailStore(types: string[]): boolean {
  return !types.some((t) => EXCLUDED_PLACE_TYPES.has(t));
}

export function mapStoreType(types: string[]): "big_box" | "lgs" | "grocery" | "pharmacy" | "other" {
  const typeSet = new Set(types);
  if (typeSet.has("department_store") || typeSet.has("shopping_mall")) return "big_box";
  if (typeSet.has("grocery_or_supermarket") || typeSet.has("supermarket")) return "grocery";
  if (typeSet.has("pharmacy") || typeSet.has("drugstore")) return "pharmacy";
  if (typeSet.has("store") || typeSet.has("book_store")) return "lgs";
  return "other";
}

export function toGridCell(lat: number, lng: number): { gridLat: number; gridLng: number } {
  return {
    gridLat: Math.round(lat / 0.05) * 0.05,
    gridLng: Math.round(lng / 0.05) * 0.05,
  };
}
