import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function main() {
  const sql = neon(process.env.DATABASE_URL!);

  console.log("Running Cardboard Creatures pivot migration...");

  // Step 1: Rename pokemon_rarity enum
  try {
    await sql`ALTER TYPE "pokemon_rarity" RENAME TO "creature_rarity"`;
    console.log("✓ Renamed pokemon_rarity → creature_rarity");
  } catch (e: any) {
    if (e.message?.includes("does not exist")) {
      console.log("⊘ creature_rarity already exists, skipping");
    } else {
      throw e;
    }
  }

  // Step 2: Create creature_type enum
  try {
    await sql`CREATE TYPE "creature_type" AS ENUM('starter', 'shelf', 'logistics', 'checkout', 'scalper', 'hype', 'clearance', 'backroom', 'corporate')`;
    console.log("✓ Created creature_type enum");
  } catch (e: any) {
    if (e.message?.includes("already exists")) {
      console.log("⊘ creature_type already exists, skipping");
    } else {
      throw e;
    }
  }

  // Step 3: Update badge_type enum values
  try {
    await sql`ALTER TYPE "badge_type" RENAME VALUE 'pokedex_50' TO 'cardboardex_50'`;
    console.log("✓ Renamed badge pokedex_50 → cardboardex_50");
  } catch (e: any) {
    if (e.message?.includes("does not exist") || e.message?.includes("not found")) {
      console.log("⊘ cardboardex_50 already renamed, skipping");
    } else {
      throw e;
    }
  }

  try {
    await sql`ALTER TYPE "badge_type" RENAME VALUE 'pokedex_complete' TO 'cardboardex_complete'`;
    console.log("✓ Renamed badge pokedex_complete → cardboardex_complete");
  } catch (e: any) {
    if (e.message?.includes("does not exist") || e.message?.includes("not found")) {
      console.log("⊘ cardboardex_complete already renamed, skipping");
    } else {
      throw e;
    }
  }

  // Step 4: Rename pokemon_catalog → creature_catalog
  try {
    await sql`ALTER TABLE "pokemon_catalog" RENAME TO "creature_catalog"`;
    console.log("✓ Renamed pokemon_catalog → creature_catalog");
  } catch (e: any) {
    if (e.message?.includes("does not exist")) {
      console.log("⊘ creature_catalog already exists, skipping");
    } else {
      throw e;
    }
  }

  // Add type column
  try {
    await sql`ALTER TABLE "creature_catalog" ADD COLUMN "type" "creature_type" NOT NULL DEFAULT 'starter'`;
    console.log("✓ Added type column to creature_catalog");
  } catch (e: any) {
    if (e.message?.includes("already exists")) {
      console.log("⊘ type column already exists, skipping");
    } else {
      throw e;
    }
  }

  // Add description column
  try {
    await sql`ALTER TABLE "creature_catalog" ADD COLUMN "description" text NOT NULL DEFAULT ''`;
    console.log("✓ Added description column to creature_catalog");
  } catch (e: any) {
    if (e.message?.includes("already exists")) {
      console.log("⊘ description column already exists, skipping");
    } else {
      throw e;
    }
  }

  // Step 5: Rename pokemon_eggs → creature_boxes
  try {
    await sql`ALTER TABLE "pokemon_eggs" RENAME TO "creature_boxes"`;
    console.log("✓ Renamed pokemon_eggs → creature_boxes");
  } catch (e: any) {
    if (e.message?.includes("does not exist")) {
      console.log("⊘ creature_boxes already exists, skipping");
    } else {
      throw e;
    }
  }

  try {
    await sql`ALTER TABLE "creature_boxes" RENAME COLUMN "pokemon_id" TO "creature_id"`;
    console.log("✓ Renamed pokemon_id → creature_id");
  } catch (e: any) {
    if (e.message?.includes("does not exist")) {
      console.log("⊘ creature_id already renamed, skipping");
    } else {
      throw e;
    }
  }

  try {
    await sql`ALTER TABLE "creature_boxes" RENAME COLUMN "wild_pokemon_id" TO "wild_creature_id"`;
    console.log("✓ Renamed wild_pokemon_id → wild_creature_id");
  } catch (e: any) {
    if (e.message?.includes("does not exist")) {
      console.log("⊘ wild_creature_id already renamed, skipping");
    } else {
      throw e;
    }
  }

  try {
    await sql`ALTER TABLE "creature_boxes" RENAME COLUMN "hatched" TO "opened"`;
    console.log("✓ Renamed hatched → opened");
  } catch (e: any) {
    if (e.message?.includes("does not exist")) {
      console.log("⊘ opened already renamed, skipping");
    } else {
      throw e;
    }
  }

  try {
    await sql`ALTER TABLE "creature_boxes" RENAME COLUMN "hatched_at" TO "opened_at"`;
    console.log("✓ Renamed hatched_at → opened_at");
  } catch (e: any) {
    if (e.message?.includes("does not exist")) {
      console.log("⊘ opened_at already renamed, skipping");
    } else {
      throw e;
    }
  }

  console.log("\n✅ Migration complete!");
}

main().catch((e) => {
  console.error("Migration failed:", e);
  process.exit(1);
});
