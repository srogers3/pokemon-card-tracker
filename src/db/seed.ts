import { config } from "dotenv";
config({ path: ".env.local" });
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { products, creatureCatalog } from "./schema";
import { CREATURE_DATA, getSpriteUrl } from "./creature-data";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

// --- Seed Data ---

const cardProducts = [
  // 2024 sets
  { name: "Twilight Masquerade ETB", setName: "Twilight Masquerade", productType: "etb" as const, releaseDate: new Date("2024-05-24") },
  { name: "Twilight Masquerade Booster Box", setName: "Twilight Masquerade", productType: "booster_box" as const, releaseDate: new Date("2024-05-24") },
  { name: "Shrouded Fable ETB", setName: "Shrouded Fable", productType: "etb" as const, releaseDate: new Date("2024-08-02") },
  { name: "Shrouded Fable Booster Box", setName: "Shrouded Fable", productType: "booster_box" as const, releaseDate: new Date("2024-08-02") },
  { name: "Stellar Crown ETB", setName: "Stellar Crown", productType: "etb" as const, releaseDate: new Date("2024-09-13") },
  { name: "Stellar Crown Booster Box", setName: "Stellar Crown", productType: "booster_box" as const, releaseDate: new Date("2024-09-13") },
  { name: "Surging Sparks ETB", setName: "Surging Sparks", productType: "etb" as const, releaseDate: new Date("2024-11-08") },
  { name: "Surging Sparks Booster Box", setName: "Surging Sparks", productType: "booster_box" as const, releaseDate: new Date("2024-11-08") },
  // 2025 sets
  { name: "Prismatic Evolutions ETB", setName: "Prismatic Evolutions", productType: "etb" as const, releaseDate: new Date("2025-01-17") },
  { name: "Prismatic Evolutions Booster Bundle", setName: "Prismatic Evolutions", productType: "blister" as const, releaseDate: new Date("2025-01-17") },
  { name: "Prismatic Evolutions Tin", setName: "Prismatic Evolutions", productType: "tin" as const, releaseDate: new Date("2025-01-17") },
  { name: "Journey Together ETB", setName: "Journey Together", productType: "etb" as const, releaseDate: new Date("2025-03-28") },
  { name: "Journey Together Booster Box", setName: "Journey Together", productType: "booster_box" as const, releaseDate: new Date("2025-03-28") },
  { name: "Destined Rivals ETB", setName: "Destined Rivals", productType: "etb" as const, releaseDate: new Date("2025-05-30") },
  { name: "Destined Rivals Booster Box", setName: "Destined Rivals", productType: "booster_box" as const, releaseDate: new Date("2025-05-30") },
  { name: "Black Bolt ETB", setName: "Black Bolt", productType: "etb" as const, releaseDate: new Date("2025-07-18") },
  { name: "Black Bolt Booster Box", setName: "Black Bolt", productType: "booster_box" as const, releaseDate: new Date("2025-07-18") },
  { name: "White Flare ETB", setName: "White Flare", productType: "etb" as const, releaseDate: new Date("2025-07-18") },
  { name: "White Flare Booster Box", setName: "White Flare", productType: "booster_box" as const, releaseDate: new Date("2025-07-18") },
  { name: "Mega Evolution ETB", setName: "Mega Evolution", productType: "etb" as const, releaseDate: new Date("2025-09-26") },
  { name: "Mega Evolution Booster Box", setName: "Mega Evolution", productType: "booster_box" as const, releaseDate: new Date("2025-09-26") },
  { name: "Phantasmal Flames ETB", setName: "Phantasmal Flames", productType: "etb" as const, releaseDate: new Date("2025-11-14") },
  { name: "Phantasmal Flames Booster Box", setName: "Phantasmal Flames", productType: "booster_box" as const, releaseDate: new Date("2025-11-14") },
  // 2026 sets
  { name: "Ascended Heroes ETB", setName: "Mega Evolution: Ascended Heroes", productType: "etb" as const, releaseDate: new Date("2026-01-30") },
  { name: "Ascended Heroes Booster Box", setName: "Mega Evolution: Ascended Heroes", productType: "booster_box" as const, releaseDate: new Date("2026-01-30") },
  { name: "Perfect Order ETB", setName: "Mega Evolution: Perfect Order", productType: "etb" as const, releaseDate: new Date("2026-03-27") },
  { name: "Perfect Order Booster Box", setName: "Mega Evolution: Perfect Order", productType: "booster_box" as const, releaseDate: new Date("2026-03-27") },
];

// --- Run Seed ---

async function seed() {
  // Only seed products and creature catalog — never wipe stores, sightings, or user data
  console.log("Replacing products...");
  await db.delete(products);
  const insertedProducts = await db.insert(products).values(cardProducts).returning();
  console.log(`  ${insertedProducts.length} products added`);

  console.log("Replacing creature catalog...");
  await db.delete(creatureCatalog);
  const creatureRows = CREATURE_DATA.map((c) => ({
    id: c.id,
    name: c.name,
    type: c.type,
    rarityTier: c.rarityTier,
    description: c.description,
    spriteUrl: getSpriteUrl(c.id),
  }));
  await db.insert(creatureCatalog).values(creatureRows);
  console.log(`  ${creatureRows.length} creatures added`);

  console.log("Done! Seed data ready (stores, sightings, and user data preserved).");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
