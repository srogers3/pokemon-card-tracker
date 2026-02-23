CREATE TYPE "public"."badge_type" AS ENUM('first_report', 'verified_10', 'verified_50', 'trusted_reporter', 'top_reporter', 'streak_7', 'streak_30', 'pokedex_50', 'pokedex_complete');--> statement-breakpoint
CREATE TYPE "public"."pokemon_rarity" AS ENUM('common', 'uncommon', 'rare', 'ultra_rare');--> statement-breakpoint
CREATE TABLE "pokemon_catalog" (
	"id" integer PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"rarity_tier" "pokemon_rarity" NOT NULL,
	"sprite_url" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pokemon_eggs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"sighting_id" uuid NOT NULL,
	"report_status" "stock_status" NOT NULL,
	"hatched" boolean DEFAULT false NOT NULL,
	"pokemon_id" integer,
	"is_shiny" boolean DEFAULT false NOT NULL,
	"hatched_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reporter_badges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"badge_type" "badge_type" NOT NULL,
	"earned_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pokemon_eggs" ALTER COLUMN "report_status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "restock_sightings" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."stock_status";--> statement-breakpoint
CREATE TYPE "public"."stock_status" AS ENUM('found', 'not_found');--> statement-breakpoint
ALTER TABLE "pokemon_eggs" ALTER COLUMN "report_status" SET DATA TYPE "public"."stock_status" USING "report_status"::"public"."stock_status";--> statement-breakpoint
ALTER TABLE "restock_sightings" ALTER COLUMN "status" SET DATA TYPE "public"."stock_status" USING "status"::"public"."stock_status";--> statement-breakpoint
ALTER TABLE "restock_sightings" ADD COLUMN "corroborated_by" uuid;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "latitude" double precision;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "longitude" double precision;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "place_id" text;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "photo_url" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "trust_score" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "total_reports" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "verified_reports" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "current_streak" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_report_date" timestamp;--> statement-breakpoint
ALTER TABLE "pokemon_eggs" ADD CONSTRAINT "pokemon_eggs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pokemon_eggs" ADD CONSTRAINT "pokemon_eggs_sighting_id_restock_sightings_id_fk" FOREIGN KEY ("sighting_id") REFERENCES "public"."restock_sightings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pokemon_eggs" ADD CONSTRAINT "pokemon_eggs_pokemon_id_pokemon_catalog_id_fk" FOREIGN KEY ("pokemon_id") REFERENCES "public"."pokemon_catalog"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reporter_badges" ADD CONSTRAINT "reporter_badges_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stores" ADD CONSTRAINT "stores_place_id_unique" UNIQUE("place_id");