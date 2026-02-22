import { config } from "dotenv";
config({ path: ".env.local" });
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { stores, products, restockSightings, reporterBadges } from "./schema";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

// --- Seed Data ---

const ncStores = [
  { name: "Target", locationLabel: "Charlotte, NC", storeType: "big_box" as const, specificLocation: "Northlake Mall area" },
  { name: "Target", locationLabel: "Raleigh, NC", storeType: "big_box" as const, specificLocation: "Triangle Town Center" },
  { name: "Walmart", locationLabel: "Charlotte, NC", storeType: "big_box" as const, specificLocation: "Independence Blvd" },
  { name: "Walmart", locationLabel: "Durham, NC", storeType: "big_box" as const, specificLocation: "South Square" },
  { name: "Walmart", locationLabel: "Greensboro, NC", storeType: "big_box" as const, specificLocation: "Wendover Ave" },
  { name: "GameStop", locationLabel: "Raleigh, NC", storeType: "lgs" as const, specificLocation: "Crabtree Valley Mall" },
  { name: "GameStop", locationLabel: "Charlotte, NC", storeType: "lgs" as const, specificLocation: "SouthPark Mall" },
  { name: "Barnes & Noble", locationLabel: "Cary, NC", storeType: "other" as const, specificLocation: "Crossroads Plaza" },
  { name: "Walgreens", locationLabel: "Wilmington, NC", storeType: "pharmacy" as const, specificLocation: "Market St" },
  { name: "Harris Teeter", locationLabel: "Chapel Hill, NC", storeType: "grocery" as const, specificLocation: "Meadowmont Village" },
];

const pokemonProducts = [
  { name: "Prismatic Evolutions ETB", setName: "Prismatic Evolutions", productType: "etb" as const },
  { name: "Prismatic Evolutions Booster Bundle", setName: "Prismatic Evolutions", productType: "blister" as const },
  { name: "Surging Sparks Booster Box", setName: "Surging Sparks", productType: "booster_box" as const },
  { name: "Surging Sparks ETB", setName: "Surging Sparks", productType: "etb" as const },
  { name: "Prismatic Evolutions Tin", setName: "Prismatic Evolutions", productType: "tin" as const },
  { name: "Journey Together ETB", setName: "Journey Together", productType: "etb" as const },
  { name: "Journey Together Booster Box", setName: "Journey Together", productType: "booster_box" as const },
  { name: "Scarlet & Violet Ultra Premium Collection", setName: "Scarlet & Violet", productType: "collection_box" as const },
  { name: "Twilight Masquerade ETB", setName: "Twilight Masquerade", productType: "etb" as const },
  { name: "Paldean Fates ETB", setName: "Paldean Fates", productType: "etb" as const },
];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(daysBack: number): Date {
  const now = Date.now();
  const offset = Math.random() * daysBack * 24 * 60 * 60 * 1000;
  return new Date(now - offset);
}

function randomStatus(): "found" | "not_found" {
  return Math.random() > 0.4 ? "found" : "not_found";
}

const notes = [
  "Saw about 5 on the shelf",
  "Only 2 left, going fast",
  "Full restock, endcap display",
  "Behind the customer service counter",
  "Just put out by vendor",
  "Mixed in with other TCG products",
  "Locked case, ask associate",
  null,
  null,
  null, // weighted toward no notes
];

// --- Run Seed ---

async function seed() {
  console.log("Clearing existing seed data...");
  await db.delete(reporterBadges);
  await db.delete(restockSightings);
  await db.delete(stores);
  await db.delete(products);

  console.log("Inserting stores...");
  const insertedStores = await db.insert(stores).values(ncStores).returning();
  console.log(`  ${insertedStores.length} stores added`);

  console.log("Inserting products...");
  const insertedProducts = await db.insert(products).values(pokemonProducts).returning();
  console.log(`  ${insertedProducts.length} products added`);

  console.log("Generating sightings...");
  const sightings = [];
  for (let i = 0; i < 30; i++) {
    const store = randomItem(insertedStores);
    const product = randomItem(insertedProducts);
    sightings.push({
      storeId: store.id,
      productId: product.id,
      reportedBy: "seed-script",
      sightedAt: randomDate(14),
      status: randomStatus(),
      verified: true,
      source: Math.random() > 0.3 ? "admin" as const : "community" as const,
      notes: randomItem(notes),
    });
  }

  const insertedSightings = await db.insert(restockSightings).values(sightings).returning();
  console.log(`  ${insertedSightings.length} sightings added`);

  console.log("Done! Seed data ready.");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
