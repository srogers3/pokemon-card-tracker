import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  pgEnum,
  doublePrecision,
  unique,
} from "drizzle-orm/pg-core";

// Enums
export const storeTypeEnum = pgEnum("store_type", [
  "big_box",
  "lgs",
  "grocery",
  "pharmacy",
  "other",
]);

export const productTypeEnum = pgEnum("product_type", [
  "etb",
  "booster_box",
  "tin",
  "blister",
  "collection_box",
  "other",
]);

export const stockStatusEnum = pgEnum("stock_status", [
  "found",
  "not_found",
]);

export const creatureRarityEnum = pgEnum("creature_rarity", [
  "common",
  "uncommon",
  "rare",
  "ultra_rare",
]);

export const creatureTypeEnum = pgEnum("creature_type", [
  "starter",
  "shelf",
  "logistics",
  "checkout",
  "scalper",
  "hype",
  "clearance",
  "backroom",
  "corporate",
]);

export const sightingSourceEnum = pgEnum("sighting_source", [
  "admin",
  "community",
]);

export const subscriptionTierEnum = pgEnum("subscription_tier", [
  "free",
  "premium",
]);

export const badgeTypeEnum = pgEnum("badge_type", [
  "first_report",
  "verified_10",
  "verified_50",
  "trusted_reporter",
  "top_reporter",
  "streak_7",
  "streak_30",
  "cardboardex_50",
  "cardboardex_complete",
]);

// Tables
export const stores = pgTable("stores", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  locationLabel: text("location_label").notNull(),
  storeType: storeTypeEnum("store_type").notNull(),
  specificLocation: text("specific_location"),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  placeId: text("place_id").unique(),
  photoUrl: text("photo_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const products = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  setName: text("set_name").notNull(),
  productType: productTypeEnum("product_type").notNull(),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const restockSightings = pgTable("restock_sightings", {
  id: uuid("id").defaultRandom().primaryKey(),
  storeId: uuid("store_id")
    .notNull()
    .references(() => stores.id),
  productId: uuid("product_id")
    .references(() => products.id),
  reportedBy: text("reported_by").notNull(),
  sightedAt: timestamp("sighted_at").notNull(),
  status: stockStatusEnum("status").notNull(),
  verified: boolean("verified").default(false).notNull(),
  source: sightingSourceEnum("source").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  corroboratedBy: uuid("corroborated_by"),
});

export const users = pgTable("users", {
  id: text("id").primaryKey(), // Clerk user ID
  email: text("email").notNull(),
  subscriptionTier: subscriptionTierEnum("subscription_tier")
    .default("free")
    .notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  trustScore: integer("trust_score").default(0).notNull(),
  totalReports: integer("total_reports").default(0).notNull(),
  verifiedReports: integer("verified_reports").default(0).notNull(),
  currentStreak: integer("current_streak").default(0).notNull(),
  lastReportDate: timestamp("last_report_date"),
});

export const restockPatterns = pgTable("restock_patterns", {
  id: uuid("id").defaultRandom().primaryKey(),
  storeId: uuid("store_id")
    .notNull()
    .references(() => stores.id),
  productId: uuid("product_id").references(() => products.id),
  dayOfWeek: integer("day_of_week").notNull(), // 0-6
  hourOfDay: integer("hour_of_day").notNull(), // 0-23
  frequencyCount: integer("frequency_count").notNull().default(0),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
});

export const alertPreferences = pgTable("alert_preferences", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  productId: uuid("product_id").references(() => products.id),
  region: text("region"), // matches store.locationLabel
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const reporterBadges = pgTable("reporter_badges", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  badgeType: badgeTypeEnum("badge_type").notNull(),
  earnedAt: timestamp("earned_at").defaultNow().notNull(),
});

export const creatureCatalog = pgTable("creature_catalog", {
  id: integer("id").primaryKey(), // Creature index (1-151)
  name: text("name").notNull(),
  type: creatureTypeEnum("type").notNull(),
  rarityTier: creatureRarityEnum("rarity_tier").notNull(),
  description: text("description").notNull().default(""),
  spriteUrl: text("sprite_url").notNull(),
});

export const creatureBoxes = pgTable("creature_boxes", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  sightingId: uuid("sighting_id")
    .notNull()
    .references(() => restockSightings.id, { onDelete: "cascade" }),
  reportStatus: stockStatusEnum("report_status").notNull(),
  wildCreatureId: integer("wild_creature_id").references(() => creatureCatalog.id),
  opened: boolean("opened").default(false).notNull(),
  creatureId: integer("creature_id").references(() => creatureCatalog.id),
  isShiny: boolean("is_shiny").default(false).notNull(),
  openedAt: timestamp("opened_at"),
  viewedAt: timestamp("viewed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const searchCache = pgTable(
  "search_cache",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    gridLat: doublePrecision("grid_lat").notNull(),
    gridLng: doublePrecision("grid_lng").notNull(),
    searchedAt: timestamp("searched_at").defaultNow().notNull(),
  },
  (table) => [unique("search_cache_grid_unique").on(table.gridLat, table.gridLng)]
);

// Type exports
export type Store = typeof stores.$inferSelect;
export type NewStore = typeof stores.$inferInsert;
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type RestockSighting = typeof restockSightings.$inferSelect;
export type NewRestockSighting = typeof restockSightings.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type RestockPattern = typeof restockPatterns.$inferSelect;
export type AlertPreference = typeof alertPreferences.$inferSelect;
export type NewAlertPreference = typeof alertPreferences.$inferInsert;
export type ReporterBadge = typeof reporterBadges.$inferSelect;
export type CreatureCatalogEntry = typeof creatureCatalog.$inferSelect;
export type CreatureBox = typeof creatureBoxes.$inferSelect;
export type SearchCache = typeof searchCache.$inferSelect;
