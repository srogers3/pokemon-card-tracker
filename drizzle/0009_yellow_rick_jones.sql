ALTER TABLE "creature_boxes" DROP CONSTRAINT "pokemon_eggs_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "creature_boxes" DROP CONSTRAINT "pokemon_eggs_sighting_id_restock_sightings_id_fk";
--> statement-breakpoint
ALTER TABLE "creature_boxes" DROP CONSTRAINT "pokemon_eggs_wild_pokemon_id_pokemon_catalog_id_fk";
--> statement-breakpoint
ALTER TABLE "creature_boxes" DROP CONSTRAINT "pokemon_eggs_pokemon_id_pokemon_catalog_id_fk";
--> statement-breakpoint
ALTER TABLE "creature_catalog" ALTER COLUMN "type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."creature_type";--> statement-breakpoint
CREATE TYPE "public"."creature_type" AS ENUM('shelf', 'logistics', 'checkout', 'scalper', 'hype', 'clearance', 'backroom', 'corporate');--> statement-breakpoint
ALTER TABLE "creature_catalog" ALTER COLUMN "type" SET DATA TYPE "public"."creature_type" USING "type"::"public"."creature_type";--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "release_date" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "creature_catalog" ALTER COLUMN "type" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "alert_preferences" ADD COLUMN "zip_code" text;--> statement-breakpoint
ALTER TABLE "alert_preferences" ADD COLUMN "latitude" double precision;--> statement-breakpoint
ALTER TABLE "alert_preferences" ADD COLUMN "longitude" double precision;--> statement-breakpoint
ALTER TABLE "alert_preferences" ADD COLUMN "radius_miles" integer DEFAULT 25;--> statement-breakpoint
ALTER TABLE "creature_boxes" ADD CONSTRAINT "creature_boxes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creature_boxes" ADD CONSTRAINT "creature_boxes_sighting_id_restock_sightings_id_fk" FOREIGN KEY ("sighting_id") REFERENCES "public"."restock_sightings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creature_boxes" ADD CONSTRAINT "creature_boxes_wild_creature_id_creature_catalog_id_fk" FOREIGN KEY ("wild_creature_id") REFERENCES "public"."creature_catalog"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creature_boxes" ADD CONSTRAINT "creature_boxes_creature_id_creature_catalog_id_fk" FOREIGN KEY ("creature_id") REFERENCES "public"."creature_catalog"("id") ON DELETE no action ON UPDATE no action;