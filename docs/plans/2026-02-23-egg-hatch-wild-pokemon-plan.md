# Egg Hatch: Wild Pokemon Base + Upgrade Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make eggs hatch into the wild Pokemon shown on the map pin by default, with a chance to upgrade to a rarer Pokemon based on report quality.

**Architecture:** Store the wild Pokemon ID on the egg at creation time. At hatch time, use that as the base outcome with a report-status-dependent upgrade chance. Extract the deterministic `getWildPokemon()` function from the client-side marker component into a shared utility so it can be used server-side.

**Tech Stack:** Next.js 16, Drizzle ORM, PostgreSQL (Neon), TypeScript

---

### Task 1: Extract `getWildPokemon` into shared utility

**Files:**
- Create: `src/lib/wild-pokemon.ts`
- Modify: `src/components/map/pokeball-marker.tsx:8-51`

**Step 1: Create the shared utility**

Create `src/lib/wild-pokemon.ts` with the `getWildPokemon` function extracted from `pokeball-marker.tsx`. This must be a plain TypeScript module (no `"use client"` directive) so it works server-side.

```typescript
import { POKEMON_DATA, getSpriteUrl } from "@/db/pokemon-data";

const RARITY_WEIGHTS = [
  { tier: "common", weight: 0.60 },
  { tier: "uncommon", weight: 0.25 },
  { tier: "rare", weight: 0.12 },
  { tier: "ultra_rare", weight: 0.03 },
] as const;

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getWildPokemon(storeId: string): { id: number; name: string; spriteUrl: string; rarity: string } {
  const today = new Date().toISOString().split("T")[0];
  const seed = storeId + today;
  const hash = simpleHash(seed);
  const tierRand = (hash % 1000) / 1000;

  let selectedTier = "common";
  let cumulative = 0;
  for (const { tier, weight } of RARITY_WEIGHTS) {
    cumulative += weight;
    if (tierRand < cumulative) {
      selectedTier = tier;
      break;
    }
  }

  const tierPokemon = POKEMON_DATA.filter((p) => p.rarityTier === selectedTier);
  const idx = simpleHash(seed + "pick") % tierPokemon.length;
  const pokemon = tierPokemon[idx];
  return { id: pokemon.id, name: pokemon.name, spriteUrl: getSpriteUrl(pokemon.id), rarity: selectedTier };
}
```

Note: The return type now includes `id` (the pokedex number) which is needed to store on the egg.

**Step 2: Update `pokeball-marker.tsx` to import from the shared utility**

In `src/components/map/pokeball-marker.tsx`:

1. Remove the local `RARITY_WEIGHTS` constant (lines 8-13)
2. Remove the local `simpleHash` function (lines 22-29)
3. Remove the local `getWildPokemon` function (lines 31-51)
4. Add import: `import { getWildPokemon } from "@/lib/wild-pokemon";`
5. Keep the local `simpleHash` usage on line 84 for animation delay — actually, also export `simpleHash` from the utility, or just inline a separate copy for the animation delay. Simplest: export `simpleHash` from `wild-pokemon.ts`.

Update the import line and remove duplicated code. The marker still calls `getWildPokemon(store.id)` exactly as before — only the import source changes.

**Step 3: Verify the app still builds**

Run: `npm run build`
Expected: Build succeeds with no errors. Map markers still show wild Pokemon as before.

**Step 4: Commit**

```bash
git add src/lib/wild-pokemon.ts src/components/map/pokeball-marker.tsx
git commit -m "refactor: extract getWildPokemon into shared utility"
```

---

### Task 2: Add `wildPokemonId` column to schema and generate migration

**Files:**
- Modify: `src/db/schema.ts:159-173`

**Step 1: Add the column to the schema**

In `src/db/schema.ts`, add `wildPokemonId` to the `pokemonEggs` table definition, after the `reportStatus` field (line 167):

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
  wildPokemonId: integer("wild_pokemon_id").references(() => pokemonCatalog.id),
  hatched: boolean("hatched").default(false).notNull(),
  pokemonId: integer("pokemon_id").references(() => pokemonCatalog.id),
  isShiny: boolean("is_shiny").default(false).notNull(),
  hatchedAt: timestamp("hatched_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

The column is nullable so existing eggs (without a wild Pokemon) still work.

**Step 2: Generate the migration**

Run: `npm run db:generate`
Expected: A new migration file appears in `drizzle/` adding the `wild_pokemon_id` column.

**Step 3: Apply the migration**

Run: `npm run db:migrate`
Expected: Migration applies successfully.

**Step 4: Commit**

```bash
git add src/db/schema.ts drizzle/
git commit -m "feat: add wildPokemonId column to pokemonEggs table"
```

---

### Task 3: Update `createEgg` to store wild Pokemon ID

**Files:**
- Modify: `src/lib/eggs.ts:30-45`
- Modify: `src/app/dashboard/submit/actions.ts:51-52`

**Step 1: Update `createEgg` signature and implementation**

In `src/lib/eggs.ts`, update the `createEgg` function to accept and store `wildPokemonId`:

```typescript
export async function createEgg(
  userId: string,
  sightingId: string,
  reportStatus: "found" | "not_found",
  wildPokemonId: number
): Promise<string> {
  const [egg] = await db
    .insert(pokemonEggs)
    .values({
      userId,
      sightingId,
      reportStatus,
      wildPokemonId,
    })
    .returning();

  return egg.id;
}
```

**Step 2: Update `submitTip` to pass wild Pokemon ID**

In `src/app/dashboard/submit/actions.ts`:

1. Add import: `import { getWildPokemon } from "@/lib/wild-pokemon";`
2. Before the `createEgg` call (around line 52), derive the wild Pokemon:

```typescript
  // Get wild Pokemon for this store (deterministic by storeId + date)
  const wildPokemon = getWildPokemon(storeId);

  // Create an egg for this report
  const status = formData.get("status") as "found" | "not_found";
  await createEgg(userId, sighting.id, status, wildPokemon.id);
```

**Step 3: Verify the app builds**

Run: `npm run build`
Expected: Build succeeds.

**Step 4: Commit**

```bash
git add src/lib/eggs.ts src/app/dashboard/submit/actions.ts
git commit -m "feat: store wild Pokemon ID on egg at creation time"
```

---

### Task 4: Update `hatchEgg` with base + upgrade logic

**Files:**
- Modify: `src/lib/eggs.ts:47-98`

**Step 1: Add upgrade constants**

At the top of `src/lib/eggs.ts` (after the existing constants around line 28), add:

```typescript
// Upgrade chance by report status (probability that egg upgrades to a rarer tier)
const UPGRADE_CHANCE: Record<string, number> = {
  not_found: 0.05,
  found: 0.20,
  found_corroborated: 0.35,
};

// When an upgrade triggers, relative weight for each tier above the wild Pokemon's tier
const UPGRADE_TIER_WEIGHTS: Record<RarityTier, number> = {
  common: 0,       // never "upgrade" to common
  uncommon: 60,
  rare: 30,
  ultra_rare: 10,
};

const TIER_ORDER: RarityTier[] = ["common", "uncommon", "rare", "ultra_rare"];
```

**Step 2: Rewrite `hatchEgg` with base + upgrade logic**

Replace the `hatchEgg` function with:

```typescript
export async function hatchEgg(
  sightingId: string,
  corroborated: boolean = false
): Promise<{ pokemonName: string; isShiny: boolean; wasUpgrade: boolean; wildPokemonName: string | null } | null> {
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

  let pokemon: { id: number; name: string; rarityTier: RarityTier };
  let wasUpgrade = false;
  let wildPokemonName: string | null = null;

  if (egg.wildPokemonId) {
    // New behavior: base + upgrade
    const wildPokemon = POKEMON_DATA.find((p) => p.id === egg.wildPokemonId);
    if (!wildPokemon) {
      // Fallback if wild Pokemon not found in catalog
      pokemon = rollRandomPokemon(egg.reportStatus as string, corroborated);
    } else {
      wildPokemonName = wildPokemon.name;

      // Determine upgrade chance based on report status
      let poolKey = egg.reportStatus as string;
      if (poolKey === "found" && corroborated) {
        poolKey = "found_corroborated";
      }
      const upgradeChance = UPGRADE_CHANCE[poolKey] ?? UPGRADE_CHANCE["not_found"];

      // Roll for upgrade
      if (Math.random() < upgradeChance) {
        // Upgrade: pick a random Pokemon from a higher rarity tier
        const wildTierIndex = TIER_ORDER.indexOf(wildPokemon.rarityTier);

        // Build weights for tiers above the wild Pokemon's tier
        const eligibleTiers = TIER_ORDER.slice(wildTierIndex + 1);
        if (eligibleTiers.length > 0) {
          const tier = rollUpgradeTier(eligibleTiers);
          const tierPokemon = POKEMON_DATA.filter((p) => p.rarityTier === tier);
          pokemon = tierPokemon[Math.floor(Math.random() * tierPokemon.length)];
          wasUpgrade = true;
        } else {
          // Already at max tier (ultra_rare), no upgrade possible
          pokemon = wildPokemon;
        }
      } else {
        // No upgrade: hatch into the wild Pokemon
        pokemon = wildPokemon;
      }
    }
  } else {
    // Legacy behavior: fully random (for eggs created before this change)
    pokemon = rollRandomPokemon(egg.reportStatus as string, corroborated);
  }

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

  return { pokemonName: pokemon.name, isShiny, wasUpgrade, wildPokemonName };
}
```

**Step 3: Add helper functions**

Add these helper functions after `hatchEgg` (before `transferPokemon`):

```typescript
function rollUpgradeTier(eligibleTiers: RarityTier[]): RarityTier {
  const weights = eligibleTiers.map((tier) => ({
    tier,
    weight: UPGRADE_TIER_WEIGHTS[tier],
  }));
  const total = weights.reduce((sum, w) => sum + w.weight, 0);
  let roll = Math.random() * total;

  for (const { tier, weight } of weights) {
    roll -= weight;
    if (roll <= 0) return tier;
  }

  return eligibleTiers[eligibleTiers.length - 1];
}

function rollRandomPokemon(
  reportStatus: string,
  corroborated: boolean
): { id: number; name: string; rarityTier: RarityTier } {
  let poolKey = reportStatus;
  if (poolKey === "found" && corroborated) {
    poolKey = "found_corroborated";
  }
  const weights = RARITY_WEIGHTS[poolKey] ?? RARITY_WEIGHTS["not_found"];
  const tier = rollRarity(weights);
  const pokemonInTier = POKEMON_DATA.filter((p) => p.rarityTier === tier);
  return pokemonInTier[Math.floor(Math.random() * pokemonInTier.length)];
}
```

**Step 4: Verify the app builds**

Run: `npm run build`
Expected: Build succeeds. Note: the return type of `hatchEgg` changed — callers need updating (next task).

**Step 5: Commit**

```bash
git add src/lib/eggs.ts
git commit -m "feat: implement base + upgrade hatch logic"
```

---

### Task 5: Update hatchEgg callers to handle new return type

**Files:**
- Modify: `src/app/dashboard/submit/actions.ts:63-66`
- Modify: `src/lib/trust.ts` (wherever `hatchEgg` result is used)

**Step 1: Check all callers of `hatchEgg`**

Search for `hatchEgg(` across the codebase. The callers are:
- `src/app/dashboard/submit/actions.ts` (auto-verify path, line 65)
- `src/lib/trust.ts` (corroboration path — `checkCorroboration` calls `hatchEgg`)

**Step 2: Update `submit/actions.ts`**

The existing call on line 65 is:
```typescript
await hatchEgg(sighting.id, false);
```

This doesn't use the return value, so no change needed here. The new fields (`wasUpgrade`, `wildPokemonName`) are simply ignored.

**Step 3: Check `trust.ts` for `hatchEgg` calls**

Read `src/lib/trust.ts` and find any `hatchEgg` calls. Update them if they destructure the result. If they also don't use the return value, no change needed.

**Step 4: Verify the app builds**

Run: `npm run build`
Expected: Build succeeds with no type errors.

**Step 5: Commit (if changes were needed)**

```bash
git add src/app/dashboard/submit/actions.ts src/lib/trust.ts
git commit -m "fix: update hatchEgg callers for new return type"
```

---

### Task 6: Update `getUserCollection` to include upgrade info

**Files:**
- Modify: `src/lib/eggs.ts:207-222`

**Step 1: Add `wildPokemonId` to collection query**

Update `getUserCollection` to also select the `wildPokemonId` field so the collection page can determine if an egg was upgraded:

```typescript
export async function getUserCollection(userId: string) {
  const eggs = await db
    .select({
      id: pokemonEggs.id,
      pokemonId: pokemonEggs.pokemonId,
      wildPokemonId: pokemonEggs.wildPokemonId,
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
```

**Step 2: Commit**

```bash
git add src/lib/eggs.ts
git commit -m "feat: include wildPokemonId in collection query"
```

---

### Task 7: Add upgrade notification to collection page

**Files:**
- Modify: `src/app/dashboard/collection/page.tsx`

**Step 1: Identify recently hatched upgrades**

In `CollectionPage`, after fetching `allEggs`, compute which eggs were upgrades (hatched in the last 24 hours where `pokemonId !== wildPokemonId` and both are present):

```typescript
  // Find recent upgrades (hatched in last 24h where Pokemon differs from wild Pokemon)
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentUpgrades = allEggs.filter(
    (e) =>
      e.hatched &&
      e.pokemonId &&
      e.wildPokemonId &&
      e.pokemonId !== e.wildPokemonId &&
      e.hatchedAt &&
      new Date(e.hatchedAt) > oneDayAgo
  );
```

**Step 2: Add upgrade notification banner**

Add a notification section between the progress bar and pending eggs (after line 47), only shown when there are recent upgrades:

```tsx
      {/* Upgrade notifications */}
      {recentUpgrades.length > 0 && (
        <Card className="mb-6 border-amber-400/50 bg-amber-50/50 dark:bg-amber-950/20">
          <CardContent className="pt-4">
            <div className="flex flex-col gap-2">
              {recentUpgrades.map((egg) => {
                const wildPokemon = POKEMON_DATA.find((p) => p.id === egg.wildPokemonId);
                const hatchedPokemon = POKEMON_DATA.find((p) => p.id === egg.pokemonId);
                if (!wildPokemon || !hatchedPokemon) return null;
                return (
                  <div key={egg.id} className="flex items-center gap-2 text-sm">
                    <span className="text-amber-500 font-medium">Lucky!</span>
                    <span>
                      You got a {hatchedPokemon.name} instead of {wildPokemon.name}!
                    </span>
                    {egg.isShiny && <span>✨</span>}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
```

**Step 3: Verify the app builds**

Run: `npm run build`
Expected: Build succeeds.

**Step 4: Commit**

```bash
git add src/app/dashboard/collection/page.tsx
git commit -m "feat: show upgrade notification for lucky hatches"
```

---

### Task 8: Final verification

**Step 1: Run full build**

Run: `npm run build`
Expected: Clean build with no errors.

**Step 2: Manual smoke test (if dev server available)**

1. Open the map dashboard
2. Note the wild Pokemon shown at a store
3. Submit a sighting report
4. If auto-verified (trust >= 50), check collection — the hatched Pokemon should match the displayed one (most of the time)
5. If upgraded, the collection page should show the "Lucky!" notification

**Step 3: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: address any remaining issues from smoke test"
```
