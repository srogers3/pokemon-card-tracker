CREATE TABLE "search_cache" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"grid_lat" double precision NOT NULL,
	"grid_lng" double precision NOT NULL,
	"searched_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "search_cache_grid_unique" UNIQUE("grid_lat","grid_lng")
);
