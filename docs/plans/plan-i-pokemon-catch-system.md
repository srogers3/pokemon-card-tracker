# Pokemon Catch System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a Pokemon GO-inspired egg/catch collection system where sighting reports earn mystery eggs that hatch into one of the original 151 Pokemon when verified.

**Architecture:** Every sighting submission creates an egg row. When the sighting is verified (auto-verify, corroboration, or admin), the egg hatches — rolling a random Pokemon based on report quality. A new `pokemon_catalog` table holds the 151 Pokemon with rarity tiers. The `pokemon_eggs` table tracks eggs and hatched catches. Users view their collection on a Pokedex-style grid page and can transfer duplicates for trust points.

**Tech Stack:** Next.js 14+, TypeScript, Tailwind CSS, shadcn/ui, Drizzle ORM, Neon PostgreSQL

**Reference:** Design doc at `docs/plans/2026-02-21-pokemon-catch-system-design.md`

**Prerequisites:** Plans A-H completed.

---

## Phase 16: Schema Changes

### Task 16.1: Replace Stock Status Enum and Add New Enums

**Files:**
- Modify: `src/db/schema.ts`

**Step 1: Replace stockStatusEnum with binary found/not_found**

In `src/db/schema.ts`, replace:

```typescript
export const stockStatusEnum = pgEnum("stock_status", [
  "in_stock",
  "limited",
  "out_of_stock",
]);
```

With:

```typescript
export const stockStatusEnum = pgEnum("stock_status", [
  "found",
  "not_found",
]);
```

**Step 2: Add pokemon rarity enum after stockStatusEnum**

```typescript
export const pokemonRarityEnum = pgEnum("pokemon_rarity", [
  "common",
  "uncommon",
  "rare",
  "ultra_rare",
]);
```

**Step 3: Expand badgeTypeEnum to include pokedex badges**

Replace the existing `badgeTypeEnum`:

```typescript
export const badgeTypeEnum = pgEnum("badge_type", [
  "first_report",
  "verified_10",
  "verified_50",
  "trusted_reporter",
  "top_reporter",
  "streak_7",
  "streak_30",
  "pokedex_50",
  "pokedex_complete",
]);
```

**Step 4: Add pokemonCatalog table after the products table**

```typescript
export const pokemonCatalog = pgTable("pokemon_catalog", {
  id: integer("id").primaryKey(), // Pokedex number (1-151)
  name: text("name").notNull(),
  rarityTier: pokemonRarityEnum("rarity_tier").notNull(),
  spriteUrl: text("sprite_url").notNull(),
});
```

**Step 5: Add pokemonEggs table after reporterBadges table**

```typescript
export const pokemonEggs = pgTable("pokemon_eggs", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  sightingId: uuid("sighting_id")
    .notNull()
    .references(() => restockSightings.id, { onDelete: "cascade" }),
  reportStatus: stockStatusEnum("report_status").notNull(),
  hatched: boolean("hatched").default(false).notNull(),
  pokemonId: integer("pokemon_id").references(() => pokemonCatalog.id),
  isShiny: boolean("is_shiny").default(false).notNull(),
  hatchedAt: timestamp("hatched_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

**Step 6: Add type exports at the bottom of the file**

```typescript
export type PokemonCatalogEntry = typeof pokemonCatalog.$inferSelect;
export type PokemonEgg = typeof pokemonEggs.$inferSelect;
```

**Step 7: Commit**

```bash
git add src/db/schema.ts
git commit -m "feat: add pokemon catalog, eggs table, binary status enum, and pokedex badges"
```

---

### Task 16.2: Seed Pokemon Catalog (151 Pokemon)

**Files:**
- Create: `src/db/pokemon-data.ts`

**Step 1: Create pokemon data file with all 151 Pokemon and rarity assignments**

Create `src/db/pokemon-data.ts`:

```typescript
type RarityTier = "common" | "uncommon" | "rare" | "ultra_rare";

interface PokemonEntry {
  id: number;
  name: string;
  rarityTier: RarityTier;
}

export const POKEMON_DATA: PokemonEntry[] = [
  // --- Common (~60) ---
  { id: 10, name: "Caterpie", rarityTier: "common" },
  { id: 11, name: "Metapod", rarityTier: "common" },
  { id: 13, name: "Weedle", rarityTier: "common" },
  { id: 14, name: "Kakuna", rarityTier: "common" },
  { id: 16, name: "Pidgey", rarityTier: "common" },
  { id: 17, name: "Pidgeotto", rarityTier: "common" },
  { id: 19, name: "Rattata", rarityTier: "common" },
  { id: 20, name: "Raticate", rarityTier: "common" },
  { id: 21, name: "Spearow", rarityTier: "common" },
  { id: 22, name: "Fearow", rarityTier: "common" },
  { id: 23, name: "Ekans", rarityTier: "common" },
  { id: 24, name: "Arbok", rarityTier: "common" },
  { id: 27, name: "Sandshrew", rarityTier: "common" },
  { id: 28, name: "Sandslash", rarityTier: "common" },
  { id: 29, name: "Nidoran F", rarityTier: "common" },
  { id: 32, name: "Nidoran M", rarityTier: "common" },
  { id: 35, name: "Clefairy", rarityTier: "common" },
  { id: 39, name: "Jigglypuff", rarityTier: "common" },
  { id: 41, name: "Zubat", rarityTier: "common" },
  { id: 42, name: "Golbat", rarityTier: "common" },
  { id: 43, name: "Oddish", rarityTier: "common" },
  { id: 44, name: "Gloom", rarityTier: "common" },
  { id: 46, name: "Paras", rarityTier: "common" },
  { id: 47, name: "Parasect", rarityTier: "common" },
  { id: 48, name: "Venonat", rarityTier: "common" },
  { id: 49, name: "Venomoth", rarityTier: "common" },
  { id: 50, name: "Diglett", rarityTier: "common" },
  { id: 51, name: "Dugtrio", rarityTier: "common" },
  { id: 52, name: "Meowth", rarityTier: "common" },
  { id: 54, name: "Psyduck", rarityTier: "common" },
  { id: 56, name: "Mankey", rarityTier: "common" },
  { id: 60, name: "Poliwag", rarityTier: "common" },
  { id: 63, name: "Abra", rarityTier: "common" },
  { id: 66, name: "Machop", rarityTier: "common" },
  { id: 69, name: "Bellsprout", rarityTier: "common" },
  { id: 72, name: "Tentacool", rarityTier: "common" },
  { id: 74, name: "Geodude", rarityTier: "common" },
  { id: 75, name: "Graveler", rarityTier: "common" },
  { id: 77, name: "Ponyta", rarityTier: "common" },
  { id: 79, name: "Slowpoke", rarityTier: "common" },
  { id: 81, name: "Magnemite", rarityTier: "common" },
  { id: 84, name: "Doduo", rarityTier: "common" },
  { id: 86, name: "Seel", rarityTier: "common" },
  { id: 88, name: "Grimer", rarityTier: "common" },
  { id: 90, name: "Shellder", rarityTier: "common" },
  { id: 92, name: "Gastly", rarityTier: "common" },
  { id: 96, name: "Drowzee", rarityTier: "common" },
  { id: 98, name: "Krabby", rarityTier: "common" },
  { id: 100, name: "Voltorb", rarityTier: "common" },
  { id: 102, name: "Exeggcute", rarityTier: "common" },
  { id: 104, name: "Cubone", rarityTier: "common" },
  { id: 109, name: "Koffing", rarityTier: "common" },
  { id: 116, name: "Horsea", rarityTier: "common" },
  { id: 118, name: "Goldeen", rarityTier: "common" },
  { id: 120, name: "Staryu", rarityTier: "common" },
  { id: 129, name: "Magikarp", rarityTier: "common" },
  { id: 133, name: "Eevee", rarityTier: "common" },
  { id: 147, name: "Dratini", rarityTier: "common" },

  // --- Uncommon (~50) ---
  { id: 1, name: "Bulbasaur", rarityTier: "uncommon" },
  { id: 4, name: "Charmander", rarityTier: "uncommon" },
  { id: 7, name: "Squirtle", rarityTier: "uncommon" },
  { id: 12, name: "Butterfree", rarityTier: "uncommon" },
  { id: 15, name: "Beedrill", rarityTier: "uncommon" },
  { id: 18, name: "Pidgeot", rarityTier: "uncommon" },
  { id: 25, name: "Pikachu", rarityTier: "uncommon" },
  { id: 26, name: "Raichu", rarityTier: "uncommon" },
  { id: 30, name: "Nidorina", rarityTier: "uncommon" },
  { id: 33, name: "Nidorino", rarityTier: "uncommon" },
  { id: 36, name: "Clefable", rarityTier: "uncommon" },
  { id: 37, name: "Vulpix", rarityTier: "uncommon" },
  { id: 38, name: "Ninetales", rarityTier: "uncommon" },
  { id: 40, name: "Wigglytuff", rarityTier: "uncommon" },
  { id: 45, name: "Vileplume", rarityTier: "uncommon" },
  { id: 53, name: "Persian", rarityTier: "uncommon" },
  { id: 55, name: "Golduck", rarityTier: "uncommon" },
  { id: 57, name: "Primeape", rarityTier: "uncommon" },
  { id: 58, name: "Growlithe", rarityTier: "uncommon" },
  { id: 59, name: "Arcanine", rarityTier: "uncommon" },
  { id: 61, name: "Poliwhirl", rarityTier: "uncommon" },
  { id: 64, name: "Kadabra", rarityTier: "uncommon" },
  { id: 67, name: "Machoke", rarityTier: "uncommon" },
  { id: 70, name: "Weepinbell", rarityTier: "uncommon" },
  { id: 73, name: "Tentacruel", rarityTier: "uncommon" },
  { id: 78, name: "Rapidash", rarityTier: "uncommon" },
  { id: 80, name: "Slowbro", rarityTier: "uncommon" },
  { id: 82, name: "Magneton", rarityTier: "uncommon" },
  { id: 83, name: "Farfetchd", rarityTier: "uncommon" },
  { id: 85, name: "Dodrio", rarityTier: "uncommon" },
  { id: 87, name: "Dewgong", rarityTier: "uncommon" },
  { id: 89, name: "Muk", rarityTier: "uncommon" },
  { id: 91, name: "Cloyster", rarityTier: "uncommon" },
  { id: 93, name: "Haunter", rarityTier: "uncommon" },
  { id: 95, name: "Onix", rarityTier: "uncommon" },
  { id: 97, name: "Hypno", rarityTier: "uncommon" },
  { id: 99, name: "Kingler", rarityTier: "uncommon" },
  { id: 101, name: "Electrode", rarityTier: "uncommon" },
  { id: 105, name: "Marowak", rarityTier: "uncommon" },
  { id: 106, name: "Hitmonlee", rarityTier: "uncommon" },
  { id: 107, name: "Hitmonchan", rarityTier: "uncommon" },
  { id: 108, name: "Lickitung", rarityTier: "uncommon" },
  { id: 110, name: "Weezing", rarityTier: "uncommon" },
  { id: 111, name: "Rhyhorn", rarityTier: "uncommon" },
  { id: 117, name: "Seadra", rarityTier: "uncommon" },
  { id: 119, name: "Seaking", rarityTier: "uncommon" },
  { id: 121, name: "Starmie", rarityTier: "uncommon" },
  { id: 122, name: "Mr. Mime", rarityTier: "uncommon" },
  { id: 124, name: "Jynx", rarityTier: "uncommon" },
  { id: 125, name: "Electabuzz", rarityTier: "uncommon" },
  { id: 126, name: "Magmar", rarityTier: "uncommon" },
  { id: 127, name: "Pinsir", rarityTier: "uncommon" },
  { id: 128, name: "Tauros", rarityTier: "uncommon" },
  { id: 132, name: "Ditto", rarityTier: "uncommon" },
  { id: 137, name: "Porygon", rarityTier: "uncommon" },
  { id: 138, name: "Omanyte", rarityTier: "uncommon" },
  { id: 140, name: "Kabuto", rarityTier: "uncommon" },
  { id: 148, name: "Dragonair", rarityTier: "uncommon" },

  // --- Rare (~30) ---
  { id: 2, name: "Ivysaur", rarityTier: "rare" },
  { id: 5, name: "Charmeleon", rarityTier: "rare" },
  { id: 8, name: "Wartortle", rarityTier: "rare" },
  { id: 31, name: "Nidoqueen", rarityTier: "rare" },
  { id: 34, name: "Nidoking", rarityTier: "rare" },
  { id: 62, name: "Poliwrath", rarityTier: "rare" },
  { id: 65, name: "Alakazam", rarityTier: "rare" },
  { id: 68, name: "Machamp", rarityTier: "rare" },
  { id: 71, name: "Victreebel", rarityTier: "rare" },
  { id: 76, name: "Golem", rarityTier: "rare" },
  { id: 103, name: "Exeggutor", rarityTier: "rare" },
  { id: 112, name: "Rhydon", rarityTier: "rare" },
  { id: 113, name: "Chansey", rarityTier: "rare" },
  { id: 114, name: "Tangela", rarityTier: "rare" },
  { id: 115, name: "Kangaskhan", rarityTier: "rare" },
  { id: 123, name: "Scyther", rarityTier: "rare" },
  { id: 130, name: "Gyarados", rarityTier: "rare" },
  { id: 131, name: "Lapras", rarityTier: "rare" },
  { id: 134, name: "Vaporeon", rarityTier: "rare" },
  { id: 135, name: "Jolteon", rarityTier: "rare" },
  { id: 136, name: "Flareon", rarityTier: "rare" },
  { id: 139, name: "Omastar", rarityTier: "rare" },
  { id: 141, name: "Kabutops", rarityTier: "rare" },
  { id: 142, name: "Aerodactyl", rarityTier: "rare" },
  { id: 143, name: "Snorlax", rarityTier: "rare" },

  // --- Ultra Rare (~11) ---
  { id: 3, name: "Venusaur", rarityTier: "ultra_rare" },
  { id: 6, name: "Charizard", rarityTier: "ultra_rare" },
  { id: 9, name: "Blastoise", rarityTier: "ultra_rare" },
  { id: 94, name: "Gengar", rarityTier: "ultra_rare" },
  { id: 149, name: "Dragonite", rarityTier: "ultra_rare" },
  { id: 150, name: "Mewtwo", rarityTier: "ultra_rare" },
  { id: 151, name: "Mew", rarityTier: "ultra_rare" },
  { id: 144, name: "Articuno", rarityTier: "ultra_rare" },
  { id: 145, name: "Zapdos", rarityTier: "ultra_rare" },
  { id: 146, name: "Moltres", rarityTier: "ultra_rare" },
];

export function getSpriteUrl(pokedexNumber: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokedexNumber}.png`;
}
```

**Step 2: Commit**

```bash
git add src/db/pokemon-data.ts
git commit -m "feat: add pokemon catalog data with rarity tiers for all 151"
```

---

## Phase 17: Egg Engine

### Task 17.1: Create Egg Engine Utility

**Files:**
- Create: `src/lib/eggs.ts`

**Step 1: Create egg engine with create, hatch, and transfer logic**

Create `src/lib/eggs.ts`:

```typescript
import { db } from "@/db";
import {
  pokemonEggs,
  pokemonCatalog,
  users,
  pokemonRarityEnum,
} from "@/db/schema";
import { eq, and, sql, ne } from "drizzle-orm";
import { POKEMON_DATA, getSpriteUrl } from "@/db/pokemon-data";
import { adjustTrustScore } from "@/lib/trust";

type RarityTier = "common" | "uncommon" | "rare" | "ultra_rare";

// Rarity pools by report status
const RARITY_WEIGHTS: Record<string, Record<RarityTier, number>> = {
  not_found: { common: 75, uncommon: 25, rare: 0, ultra_rare: 0 },
  found: { common: 35, uncommon: 35, rare: 25, ultra_rare: 5 },
  found_corroborated: { common: 25, uncommon: 30, rare: 30, ultra_rare: 15 },
};

const TRANSFER_POINTS: Record<RarityTier, number> = {
  common: 1,
  uncommon: 2,
  rare: 3,
  ultra_rare: 5,
};

const SHINY_CHANCE = 1 / 50; // 2%

export async function createEgg(
  userId: string,
  sightingId: string,
  reportStatus: "found" | "not_found"
): Promise<string> {
  const [egg] = await db
    .insert(pokemonEggs)
    .values({
      userId,
      sightingId,
      reportStatus,
    })
    .returning();

  return egg.id;
}

export async function hatchEgg(
  sightingId: string,
  corroborated: boolean = false
): Promise<{ pokemonName: string; isShiny: boolean } | null> {
  // Find the egg for this sighting
  const [egg] = await db
    .select()
    .from(pokemonEggs)
    .where(
      and(
        eq(pokemonEggs.sightingId, sightingId),
        eq(pokemonEggs.hatched, false)
      )
    )
    .limit(1);

  if (!egg) return null;

  // Determine rarity pool
  let poolKey = egg.reportStatus;
  if (poolKey === "found" && corroborated) {
    poolKey = "found_corroborated" as any;
  }
  const weights = RARITY_WEIGHTS[poolKey] ?? RARITY_WEIGHTS["not_found"];

  // Roll rarity tier
  const tier = rollRarity(weights);

  // Pick random Pokemon from that tier
  const pokemonInTier = POKEMON_DATA.filter((p) => p.rarityTier === tier);
  const pokemon = pokemonInTier[Math.floor(Math.random() * pokemonInTier.length)];

  // Roll shiny
  const isShiny = Math.random() < SHINY_CHANCE;

  // Update the egg
  await db
    .update(pokemonEggs)
    .set({
      hatched: true,
      pokemonId: pokemon.id,
      isShiny,
      hatchedAt: new Date(),
    })
    .where(eq(pokemonEggs.id, egg.id));

  // Check for pokedex badges
  await checkPokedexBadges(egg.userId);

  return { pokemonName: pokemon.name, isShiny };
}

export async function transferPokemon(
  userId: string,
  eggId: string
): Promise<{ points: number } | { error: string }> {
  // Get the egg details
  const [egg] = await db
    .select({
      id: pokemonEggs.id,
      userId: pokemonEggs.userId,
      pokemonId: pokemonEggs.pokemonId,
      isShiny: pokemonEggs.isShiny,
      hatched: pokemonEggs.hatched,
    })
    .from(pokemonEggs)
    .where(eq(pokemonEggs.id, eggId))
    .limit(1);

  if (!egg || !egg.hatched || !egg.pokemonId) {
    return { error: "Egg not found or not hatched" };
  }

  if (egg.userId !== userId) {
    return { error: "Not your Pokemon" };
  }

  // Check if this is the user's last copy (including shiny distinction)
  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(pokemonEggs)
    .where(
      and(
        eq(pokemonEggs.userId, userId),
        eq(pokemonEggs.pokemonId, egg.pokemonId),
        eq(pokemonEggs.isShiny, egg.isShiny),
        eq(pokemonEggs.hatched, true)
      )
    );

  if ((countResult?.count ?? 0) <= 1) {
    return { error: "Cannot transfer your last copy" };
  }

  // Get rarity for point calculation
  const pokemonEntry = POKEMON_DATA.find((p) => p.id === egg.pokemonId);
  if (!pokemonEntry) return { error: "Pokemon not found in catalog" };

  const basePoints = TRANSFER_POINTS[pokemonEntry.rarityTier];
  const points = egg.isShiny ? basePoints * 2 : basePoints;

  // Delete the egg and award points
  await db.delete(pokemonEggs).where(eq(pokemonEggs.id, eggId));
  await adjustTrustScore(userId, points);

  return { points };
}

function rollRarity(weights: Record<RarityTier, number>): RarityTier {
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  let roll = Math.random() * total;

  for (const [tier, weight] of Object.entries(weights)) {
    roll -= weight;
    if (roll <= 0) return tier as RarityTier;
  }

  return "common";
}

async function checkPokedexBadges(userId: string): Promise<void> {
  // Count unique Pokemon caught
  const [result] = await db
    .select({
      uniqueCaught: sql<number>`COUNT(DISTINCT pokemon_id)::int`,
    })
    .from(pokemonEggs)
    .where(
      and(eq(pokemonEggs.userId, userId), eq(pokemonEggs.hatched, true))
    );

  const uniqueCaught = result?.uniqueCaught ?? 0;

  // Import badge checking - we'll check directly here to avoid circular deps
  const { reporterBadges, badgeTypeEnum } = await import("@/db/schema");

  const existingBadges = await db
    .select({ badgeType: reporterBadges.badgeType })
    .from(reporterBadges)
    .where(eq(reporterBadges.userId, userId));

  const earned = new Set(existingBadges.map((b) => b.badgeType));

  type BadgeType = (typeof badgeTypeEnum.enumValues)[number];
  const toAward: BadgeType[] = [];

  if (uniqueCaught >= 50 && !earned.has("pokedex_50")) {
    toAward.push("pokedex_50");
  }
  if (uniqueCaught >= 151 && !earned.has("pokedex_complete")) {
    toAward.push("pokedex_complete");
  }

  if (toAward.length > 0) {
    await db.insert(reporterBadges).values(
      toAward.map((badge) => ({
        userId,
        badgeType: badge,
      }))
    );
  }
}

export async function getUserCollection(userId: string) {
  const eggs = await db
    .select({
      id: pokemonEggs.id,
      pokemonId: pokemonEggs.pokemonId,
      isShiny: pokemonEggs.isShiny,
      hatched: pokemonEggs.hatched,
      hatchedAt: pokemonEggs.hatchedAt,
      reportStatus: pokemonEggs.reportStatus,
      createdAt: pokemonEggs.createdAt,
    })
    .from(pokemonEggs)
    .where(eq(pokemonEggs.userId, userId));

  return eggs;
}

export function getPokedexCompletion(
  hatchedEggs: { pokemonId: number | null }[]
): number {
  const uniquePokemon = new Set(
    hatchedEggs
      .filter((e) => e.pokemonId !== null)
      .map((e) => e.pokemonId)
  );
  return uniquePokemon.size;
}
```

**Step 2: Commit**

```bash
git add src/lib/eggs.ts
git commit -m "feat: add egg engine with hatch, transfer, and collection logic"
```

---

## Phase 18: Integrate Eggs into Sighting Flow

### Task 18.1: Update Submit Action and Form for Binary Status

**Files:**
- Modify: `src/app/dashboard/submit/actions.ts`
- Modify: `src/components/community-tip-form.tsx`

**Step 1: Update community tip form with binary status**

In `src/components/community-tip-form.tsx`, replace the Stock Status select:

```typescript
<div>
  <Label htmlFor="status">Did you find Pokemon cards?</Label>
  <Select name="status" required>
    <SelectTrigger>
      <SelectValue placeholder="Select status" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="found">Yes — Found cards!</SelectItem>
      <SelectItem value="not_found">No — Shelves were empty</SelectItem>
    </SelectContent>
  </Select>
</div>
```

**Step 2: Update submit action with egg creation and binary status**

Replace `src/app/dashboard/submit/actions.ts`:

```typescript
"use server";

import { db } from "@/db";
import { restockSightings } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import {
  shouldAutoVerify,
  canSubmitReport,
  checkCorroboration,
  adjustTrustScore,
  updateReporterStats,
} from "@/lib/trust";
import { createEgg, hatchEgg } from "@/lib/eggs";

export async function submitTip(formData: FormData) {
  const user = await requireUser();
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // Rate limit check
  const canSubmit = await canSubmitReport(userId);
  if (!canSubmit) throw new Error("Daily report limit reached (max 10)");

  const storeId = formData.get("storeId") as string;
  const productId = formData.get("productId") as string;
  const sightedAt = new Date(formData.get("sightedAt") as string);
  const status = formData.get("status") as "found" | "not_found";
  const autoVerify = shouldAutoVerify(user.trustScore);

  // Insert the sighting
  const [sighting] = await db
    .insert(restockSightings)
    .values({
      storeId,
      productId,
      reportedBy: userId,
      sightedAt,
      status,
      verified: autoVerify,
      source: "community",
      notes: (formData.get("notes") as string) || null,
    })
    .returning();

  // Create an egg for this report
  await createEgg(userId, sighting.id, status);

  // Update reporter stats (totalReports, streak)
  await updateReporterStats(userId);

  // Check for corroboration if not already auto-verified
  if (!autoVerify) {
    const corroboratedUserId = await checkCorroboration(
      sighting.id,
      storeId,
      productId,
      sightedAt
    );
    if (corroboratedUserId) {
      // Corroboration found — hatch both eggs
      await hatchEgg(sighting.id, true);
      // The other reporter's egg is hatched via their sighting
      const otherSightings = await db
        .select({ id: restockSightings.id })
        .from(restockSightings)
        .where(
          and(
            eq(restockSightings.corroboratedBy, sighting.id),
          )
        );
      for (const s of otherSightings) {
        await hatchEgg(s.id, true);
      }
      await adjustTrustScore(userId, 10);
    }
  } else {
    // Auto-verified — hatch egg immediately
    await hatchEgg(sighting.id, false);
    await adjustTrustScore(userId, 5);
  }

  revalidatePath("/dashboard/submit");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/collection");
}
```

Add necessary imports at top:

```typescript
import { and, eq } from "drizzle-orm";
```

**Step 3: Commit**

```bash
git add src/app/dashboard/submit/actions.ts src/components/community-tip-form.tsx
git commit -m "feat: integrate egg creation into submit flow with binary found/not_found status"
```

---

### Task 18.2: Add Egg Hatching to Admin Verification and Rejection

**Files:**
- Modify: `src/app/admin/verification/actions.ts`

**Step 1: Add egg hatch on verify and egg delete on reject**

In `src/app/admin/verification/actions.ts`, add import at top:

```typescript
import { hatchEgg } from "@/lib/eggs";
import { pokemonEggs } from "@/db/schema";
```

In the `verifySighting` function, after the `await adjustTrustScore(sighting.reportedBy, 5);` line, add:

```typescript
    // Hatch the egg for this sighting
    await hatchEgg(id, false);
```

In the `rejectSighting` function, before the `await db.delete(restockSightings)` line, add:

```typescript
  // Delete the egg associated with this sighting (cascade would handle this, but be explicit)
  await db.delete(pokemonEggs).where(eq(pokemonEggs.sightingId, id));
```

**Step 2: Commit**

```bash
git add src/app/admin/verification/actions.ts
git commit -m "feat: hatch eggs on admin verify, delete eggs on reject"
```

---

### Task 18.3: Update Corroboration in Trust Engine to Hatch Eggs

**Files:**
- Modify: `src/lib/trust.ts`

**Step 1: Add egg hatching to checkCorroboration**

In `src/lib/trust.ts`, add import at top:

```typescript
import { hatchEgg } from "@/lib/eggs";
```

In the `checkCorroboration` function, after the two `db.update(restockSightings)` calls and before the `await adjustTrustScore(match.reportedBy, POINTS_CORROBORATED);` line, add:

```typescript
  // Hatch eggs for both reporters
  await hatchEgg(match.id, true);
  await hatchEgg(sightingId, true);
```

Then **remove** the duplicate egg hatching from `submit/actions.ts` that was added in Task 18.1. In `src/app/dashboard/submit/actions.ts`, simplify the corroboration block to:

```typescript
  if (!autoVerify) {
    const corroboratedUserId = await checkCorroboration(
      sighting.id,
      storeId,
      productId,
      sightedAt
    );
    if (corroboratedUserId) {
      await adjustTrustScore(userId, 10);
    }
  } else {
    // Auto-verified — hatch egg immediately
    await hatchEgg(sighting.id, false);
    await adjustTrustScore(userId, 5);
  }
```

Remove the `and, eq` imports from `drizzle-orm` and the `restockSightings` query block that was added in Task 18.1.

**Step 2: Commit**

```bash
git add src/lib/trust.ts src/app/dashboard/submit/actions.ts
git commit -m "refactor: centralize egg hatching in trust engine corroboration"
```

---

## Phase 19: Collection Page UI

### Task 19.1: Create Collection Page with Pokedex Grid

**Files:**
- Create: `src/app/dashboard/collection/page.tsx`
- Create: `src/app/dashboard/collection/loading.tsx`

**Step 1: Create the collection page**

Create `src/app/dashboard/collection/page.tsx`:

```tsx
import { requireUser } from "@/lib/auth";
import { getUserCollection, getPokedexCompletion } from "@/lib/eggs";
import { POKEMON_DATA, getSpriteUrl } from "@/db/pokemon-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function CollectionPage() {
  const user = await requireUser();
  const allEggs = await getUserCollection(user.id);

  const hatchedEggs = allEggs.filter((e) => e.hatched && e.pokemonId);
  const pendingEggs = allEggs.filter((e) => !e.hatched);
  const uniqueCaught = getPokedexCompletion(hatchedEggs);

  // Build a map of caught Pokemon: pokemonId -> { count, hasShiny, eggs }
  const caughtMap = new Map<
    number,
    { count: number; shinyCount: number; eggs: typeof hatchedEggs }
  >();
  for (const egg of hatchedEggs) {
    if (!egg.pokemonId) continue;
    const existing = caughtMap.get(egg.pokemonId) ?? {
      count: 0,
      shinyCount: 0,
      eggs: [],
    };
    existing.count++;
    if (egg.isShiny) existing.shinyCount++;
    existing.eggs.push(egg);
    caughtMap.set(egg.pokemonId, existing);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Pokemon Collection</h2>
        <Badge variant="outline" className="text-sm">
          {uniqueCaught}/151 caught
        </Badge>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-muted rounded-full h-3 mb-6">
        <div
          className="bg-primary rounded-full h-3 transition-all"
          style={{ width: `${(uniqueCaught / 151) * 100}%` }}
        />
      </div>

      {/* Pending eggs */}
      {pendingEggs.length > 0 && (
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              Pending Eggs ({pendingEggs.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              {pendingEggs.map((egg) => (
                <div
                  key={egg.id}
                  className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center text-lg"
                  title={`Egg from ${egg.reportStatus} report — waiting for verification`}
                >
                  🥚
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Eggs hatch when your report is verified!
            </p>
          </CardContent>
        </Card>
      )}

      {/* Pokedex grid */}
      <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2">
        {POKEMON_DATA.sort((a, b) => a.id - b.id).map((pokemon) => {
          const caught = caughtMap.get(pokemon.id);
          const isCaught = !!caught;

          return (
            <div
              key={pokemon.id}
              className={`relative aspect-square rounded-lg border p-1 flex flex-col items-center justify-center ${
                isCaught
                  ? "bg-background border-primary/30"
                  : "bg-muted/50 border-transparent"
              }`}
              title={
                isCaught
                  ? `#${pokemon.id} ${pokemon.name} (${caught.count}x${caught.shinyCount > 0 ? `, ${caught.shinyCount} shiny` : ""})`
                  : `#${pokemon.id} ???`
              }
            >
              <img
                src={getSpriteUrl(pokemon.id)}
                alt={isCaught ? pokemon.name : "???"}
                className={`w-10 h-10 ${isCaught ? "" : "brightness-0 opacity-30"}`}
                loading="lazy"
              />
              {isCaught && caught.shinyCount > 0 && (
                <span className="absolute top-0 right-0 text-xs">✨</span>
              )}
              {isCaught && caught.count > 1 && (
                <span className="absolute bottom-0 right-0 text-[10px] bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center">
                  {caught.count}
                </span>
              )}
              <span className="text-[9px] text-muted-foreground truncate w-full text-center">
                {isCaught ? pokemon.name : `#${pokemon.id}`}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

**Step 2: Create loading state**

Create `src/app/dashboard/collection/loading.tsx`:

```tsx
export default function CollectionLoading() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-muted-foreground">Loading collection...</div>
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add src/app/dashboard/collection/
git commit -m "feat: add pokemon collection page with pokedex grid and egg display"
```

---

### Task 19.2: Create Transfer Action

**Files:**
- Create: `src/app/dashboard/collection/actions.ts`

**Step 1: Create server action for transferring Pokemon**

Create `src/app/dashboard/collection/actions.ts`:

```typescript
"use server";

import { requireUser } from "@/lib/auth";
import { transferPokemon } from "@/lib/eggs";
import { revalidatePath } from "next/cache";

export async function transferAction(eggId: string) {
  const user = await requireUser();
  const result = await transferPokemon(user.id, eggId);

  if ("error" in result) {
    throw new Error(result.error);
  }

  revalidatePath("/dashboard/collection");
  return result;
}
```

**Step 2: Commit**

```bash
git add src/app/dashboard/collection/actions.ts
git commit -m "feat: add transfer server action for duplicate pokemon"
```

---

## Phase 20: Navigation and Leaderboard Updates

### Task 20.1: Add Collection Link to Dashboard Nav

**Files:**
- Modify: `src/components/dashboard-nav.tsx`

**Step 1: Add Collection link to the links array**

In `src/components/dashboard-nav.tsx`, update the links array:

```typescript
const links = [
  { href: "/dashboard", label: "Sightings" },
  { href: "/dashboard/products", label: "Products" },
  { href: "/dashboard/submit", label: "Submit Tip" },
  { href: "/dashboard/collection", label: "Collection" },
  { href: "/dashboard/leaderboard", label: "Leaderboard" },
  { href: "/dashboard/heatmap", label: "Heatmap", premium: true },
  { href: "/dashboard/alerts", label: "Alerts", premium: true },
];
```

**Step 2: Commit**

```bash
git add src/components/dashboard-nav.tsx
git commit -m "feat: add collection link to dashboard navigation"
```

---

### Task 20.2: Add Pokedex Completion to Leaderboard

**Files:**
- Modify: `src/app/dashboard/leaderboard/page.tsx`

**Step 1: Update leaderboard to show Pokedex completion**

In `src/app/dashboard/leaderboard/page.tsx`, add import at top:

```typescript
import { pokemonEggs } from "@/db/schema";
```

After the `allBadges` query, add a query for pokedex completion per user:

```typescript
  // Fetch pokedex completion for all users
  const pokedexData = await db
    .select({
      userId: pokemonEggs.userId,
      uniqueCaught: sql<number>`COUNT(DISTINCT pokemon_id)::int`,
    })
    .from(pokemonEggs)
    .where(eq(pokemonEggs.hatched, true))
    .groupBy(pokemonEggs.userId);

  const pokedexMap = new Map<string, number>();
  for (const p of pokedexData) {
    pokedexMap.set(p.userId, p.uniqueCaught);
  }
```

Add the `eq` import to the existing drizzle-orm import if not present.

Add a `Pokedex` column to the `TableHeader` after the Badges column:

```tsx
<TableHead>Pokedex</TableHead>
```

Add the cell in the reporter row after the Badges `TableCell`:

```tsx
<TableCell>{pokedexMap.get(reporter.id) ?? 0}/151</TableCell>
```

Update the empty state `colSpan` from 8 to 9.

Update the "Your Stats" card to include Pokedex count:

```tsx
<div>
  <span className="text-muted-foreground">Pokedex:</span>{" "}
  <span className="font-medium">
    {pokedexMap.get(currentUser.id) ?? 0}/151
  </span>
</div>
```

Update the `BADGE_LABELS` to include new badges:

```typescript
const BADGE_LABELS: Record<string, string> = {
  first_report: "First Report",
  verified_10: "10 Verified",
  verified_50: "50 Verified",
  trusted_reporter: "Trusted",
  top_reporter: "Top Reporter",
  streak_7: "7-Day Streak",
  streak_30: "30-Day Streak",
  pokedex_50: "50 Pokemon",
  pokedex_complete: "Pokedex Complete",
};
```

**Step 2: Commit**

```bash
git add src/app/dashboard/leaderboard/page.tsx
git commit -m "feat: add pokedex completion column to leaderboard"
```

---

## Phase 21: Seed Data and Final Polish

### Task 21.1: Update Seed Script

**Files:**
- Modify: `src/db/seed.ts`

**Step 1: Update seed to populate pokemon catalog, clear eggs, and use binary status**

Update the import:

```typescript
import { stores, products, restockSightings, reporterBadges, pokemonCatalog, pokemonEggs } from "./schema";
```

Add pokemon data import:

```typescript
import { POKEMON_DATA, getSpriteUrl } from "./pokemon-data";
```

Update the clearing section:

```typescript
  console.log("Clearing existing seed data...");
  await db.delete(pokemonEggs);
  await db.delete(reporterBadges);
  await db.delete(restockSightings);
  await db.delete(pokemonCatalog);
  await db.delete(stores);
  await db.delete(products);
```

After the products insertion, add pokemon catalog seeding:

```typescript
  console.log("Inserting pokemon catalog...");
  const pokemonValues = POKEMON_DATA.map((p) => ({
    id: p.id,
    name: p.name,
    rarityTier: p.rarityTier as "common" | "uncommon" | "rare" | "ultra_rare",
    spriteUrl: getSpriteUrl(p.id),
  }));
  await db.insert(pokemonCatalog).values(pokemonValues);
  console.log(`  ${pokemonValues.length} pokemon added`);
```

Update the status generation to binary:

```typescript
const statuses = ["found", "not_found"] as const;

function weightedStatus() {
  return Math.random() > 0.4 ? "found" : "not_found";
}
```

Remove the old `statusWeights` variable and `weightedStatus` function.

**Step 2: Commit**

```bash
git add src/db/seed.ts
git commit -m "chore: update seed script with pokemon catalog and binary status"
```

---

### Task 21.2: Final Build Verification

**Step 1: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No errors.

**Step 2: Push schema changes**

```bash
npm run db:push
```

**Step 3: Re-seed database**

```bash
npx tsx src/db/seed.ts
```

**Step 4: Final commit if needed**

```bash
git add -A
git commit -m "fix: resolve build issues"
```
