# Egg Hatch: Wild Pokemon Base + Upgrade System

## Problem

When a user clicks a store on the map, they see a wild Pokemon displayed on the pin. But when they submit a sighting and the egg hatches, the resulting Pokemon is completely random — it has nothing to do with what was shown on the map. This is confusing and breaks the expectation that the displayed Pokemon is what you're "catching."

## Design

### Approach: Store Wild Pokemon on Egg, Hatch with Upgrade Chance

The displayed wild Pokemon becomes the **base outcome** when the egg hatches. There's a small chance to **upgrade** to a rarer Pokemon instead, influenced by report quality.

### Schema Change

Add `wildPokemonId` column to `pokemonEggs` table:
- Type: `integer`, nullable
- References: `pokemonCatalog.id`
- Nullable for backwards compatibility with existing unhatched eggs (they fall back to current random behavior)

### Egg Creation

When `createEgg()` is called during sighting submission:
1. Derive the wild Pokemon for the store using the existing deterministic seed logic (`storeId + today's date`)
2. Extract `getWildPokemon()` from `pokeball-marker.tsx` into a shared utility
3. Store the wild Pokemon's ID in the new `wildPokemonId` column

### Hatching Logic

When `hatchEgg()` runs:

1. **Legacy check**: If egg has no `wildPokemonId`, fall back to current random behavior
2. **Roll for upgrade** based on report status:
   - `not_found`: 5% upgrade chance
   - `found`: 20% upgrade chance
   - `found_corroborated`: 35% upgrade chance
3. **No upgrade** (most common): Hatch into the wild Pokemon stored on the egg
4. **Upgrade triggered**: Roll which tier above the wild Pokemon's rarity:
   - Uncommon: 60% of upgrades
   - Rare: 30% of upgrades
   - Ultra rare: 10% of upgrades
   - Only tiers above the wild Pokemon's tier are eligible (e.g., if wild is rare, only ultra rare is possible)
5. **Shiny roll**: Unchanged (2% chance), applied regardless of upgrade
6. **Track upgrade**: Return whether an upgrade occurred and the original wild Pokemon name

### Upgrade Notification

When an egg hatches into an upgraded Pokemon (different from the wild Pokemon), the UI indicates it was a lucky upgrade (e.g., "Lucky! You got a Lapras instead of Pidgey!").

### Map Pin Display

No changes. Pins already show wild Pokemon with rarity-colored borders. The displayed Pokemon now meaningfully represents the likely hatch outcome.

### Collection/Pokedex

No changes to collection page, Pokedex, or transfer system.

## Example Scenarios

**Common Pidgey at store, found + corroborated report:**
- 65% chance: Hatch Pidgey
- 35% chance upgrade → 60% uncommon, 30% rare, 10% ultra rare
- Net: 65% Pidgey, 21% random uncommon, 10.5% random rare, 3.5% random ultra rare

**Rare Scyther at store, found report:**
- 80% chance: Hatch Scyther
- 20% chance upgrade → only ultra rare is above rare
- Net: 80% Scyther, 20% random ultra rare

**Ultra rare Mewtwo at store, any report:**
- No upgrade possible (already highest tier)
- 100% chance: Hatch Mewtwo (still subject to shiny roll)

## Files to Modify

| File | Change |
|------|--------|
| `src/db/schema.ts` | Add `wildPokemonId` column to `pokemonEggs` |
| `src/components/map/pokeball-marker.tsx` | Extract `getWildPokemon()` to shared utility |
| `src/lib/wild-pokemon.ts` (new) | Shared `getWildPokemon()` function |
| `src/lib/eggs.ts` | Update `createEgg()` to accept and store wild Pokemon ID; update `hatchEgg()` with base + upgrade logic; return upgrade info |
| `src/app/dashboard/submit/actions.ts` | Pass wild Pokemon ID to `createEgg()` |
| `src/app/dashboard/collection/page.tsx` | Show upgrade notification for recently hatched eggs |
| DB migration | Add `wildPokemonId` column |
