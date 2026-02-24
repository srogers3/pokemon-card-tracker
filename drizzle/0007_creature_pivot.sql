-- Cardboard Creatures Pivot Migration
-- Renames Pokemon tables/enums/columns to Creature equivalents

-- Step 1: Rename enums
ALTER TYPE "pokemon_rarity" RENAME TO "creature_rarity";

-- Step 2: Create new creature_type enum
DO $$ BEGIN
  CREATE TYPE "creature_type" AS ENUM('starter', 'shelf', 'logistics', 'checkout', 'scalper', 'hype', 'clearance', 'backroom', 'corporate');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Step 3: Update badge_type enum values
ALTER TYPE "badge_type" RENAME VALUE 'pokedex_50' TO 'cardboardex_50';
ALTER TYPE "badge_type" RENAME VALUE 'pokedex_complete' TO 'cardboardex_complete';

-- Step 4: Rename pokemon_catalog → creature_catalog and add new columns
ALTER TABLE "pokemon_catalog" RENAME TO "creature_catalog";
ALTER TABLE "creature_catalog" ADD COLUMN IF NOT EXISTS "type" "creature_type" NOT NULL DEFAULT 'starter';
ALTER TABLE "creature_catalog" ADD COLUMN IF NOT EXISTS "description" text NOT NULL DEFAULT '';

-- Step 5: Rename pokemon_eggs → creature_boxes and rename columns
ALTER TABLE "pokemon_eggs" RENAME TO "creature_boxes";
ALTER TABLE "creature_boxes" RENAME COLUMN "pokemon_id" TO "creature_id";
ALTER TABLE "creature_boxes" RENAME COLUMN "wild_pokemon_id" TO "wild_creature_id";
ALTER TABLE "creature_boxes" RENAME COLUMN "hatched" TO "opened";
ALTER TABLE "creature_boxes" RENAME COLUMN "hatched_at" TO "opened_at";
