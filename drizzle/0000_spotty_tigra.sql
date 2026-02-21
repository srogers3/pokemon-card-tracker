CREATE TYPE "public"."product_type" AS ENUM('etb', 'booster_box', 'tin', 'blister', 'collection_box', 'other');--> statement-breakpoint
CREATE TYPE "public"."sighting_source" AS ENUM('admin', 'community');--> statement-breakpoint
CREATE TYPE "public"."stock_status" AS ENUM('in_stock', 'limited', 'out_of_stock');--> statement-breakpoint
CREATE TYPE "public"."store_type" AS ENUM('big_box', 'lgs', 'grocery', 'pharmacy', 'other');--> statement-breakpoint
CREATE TYPE "public"."subscription_tier" AS ENUM('free', 'premium');--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"set_name" text NOT NULL,
	"product_type" "product_type" NOT NULL,
	"image_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "restock_patterns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"product_id" uuid,
	"day_of_week" integer NOT NULL,
	"hour_of_day" integer NOT NULL,
	"frequency_count" integer DEFAULT 0 NOT NULL,
	"last_updated" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "restock_sightings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"reported_by" text NOT NULL,
	"sighted_at" timestamp NOT NULL,
	"status" "stock_status" NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"source" "sighting_source" NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"location_label" text NOT NULL,
	"store_type" "store_type" NOT NULL,
	"specific_location" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"subscription_tier" "subscription_tier" DEFAULT 'free' NOT NULL,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "restock_patterns" ADD CONSTRAINT "restock_patterns_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restock_patterns" ADD CONSTRAINT "restock_patterns_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restock_sightings" ADD CONSTRAINT "restock_sightings_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restock_sightings" ADD CONSTRAINT "restock_sightings_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;