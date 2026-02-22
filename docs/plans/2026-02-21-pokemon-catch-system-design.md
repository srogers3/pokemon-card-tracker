# Pokemon Catch System Design

## Overview

A Pokemon GO-inspired collection mechanic where submitting sighting reports earns "mystery eggs" that hatch into one of the original 151 Pokemon when the report gets verified. Report quality influences rarity. Duplicates can be transferred for trust points.

## Core Loop

1. User submits a sighting report (found / not found)
2. An egg is created and linked to the report
3. When the report is verified (auto-verify, corroboration, or admin), the egg hatches
4. A random Pokemon is rolled based on report quality
5. Pokemon goes into the user's collection (Pokedex)
6. Duplicates can be transferred for trust points

## Status Simplification

Replace the existing `in_stock / limited / out_of_stock` enum with a binary:

- `found` — Pokemon cards were present at the store
- `not_found` — No Pokemon cards found

This eliminates ambiguity, prevents gaming (always picking "in stock" for better rewards), and avoids corroboration conflicts where two users pick different statuses for the same restock.

## Pokemon Catalog

Static table of the original 151 Pokemon with four rarity tiers:

| Tier | Count | Examples |
|------|-------|---------|
| Common | ~60 | Pidgey, Rattata, Zubat, Magikarp |
| Uncommon | ~50 | Pikachu, Eevee, Growlithe, Abra |
| Rare | ~30 | Dratini, Lapras, Snorlax, starters |
| Ultra Rare | ~11 | Mewtwo, Moltres, Articuno, Zapdos, Dragonite, Gengar |

Sprites sourced from PokeAPI: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/{id}.png`

## Egg & Hatch Mechanics

### Egg Creation

Every sighting submission creates one egg row. The report's `status` (found/not_found) is locked into the egg at creation time.

### Hatch Trigger

Eggs hatch when their linked sighting is verified through any of the three existing paths:

1. **Auto-verify** (trust score >= 50) — egg hatches immediately on submission
2. **Corroboration** (2 users report same store+product within 4 hours) — both eggs hatch
3. **Admin verification** — egg hatches when admin approves

### Rarity Pools

| Report Type | Common | Uncommon | Rare | Ultra Rare |
|-------------|--------|----------|------|------------|
| `not_found` | 75% | 25% | — | — |
| `found` | 35% | 35% | 25% | 5% |
| `found` + corroborated | 25% | 30% | 30% | 15% |

### Shiny Variants

Every catch has a 1-in-50 (2%) chance of being shiny. Shiny and non-shiny count as separate collection entries.

## Data Model

### Pokemon Catalog Table (`pokemon_catalog`)

| Column | Type | Description |
|--------|------|-------------|
| id | serial | Primary key (= Pokedex number) |
| name | text | Pokemon name |
| rarityTier | enum | common / uncommon / rare / ultra_rare |
| spriteUrl | text | PokeAPI sprite URL |

### Eggs Table (`pokemon_eggs`)

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| userId | text | FK to users |
| sightingId | uuid | FK to restock_sightings |
| reportStatus | enum | found / not_found (locked at creation) |
| hatched | boolean | false until verified |
| pokemonId | integer | null until hatched, FK to pokemon_catalog |
| isShiny | boolean | default false |
| hatchedAt | timestamp | null until hatched |
| createdAt | timestamp | when egg was earned |

### Schema Changes

- Replace `sighting_status` enum: `in_stock / limited / out_of_stock` -> `found / not_found`
- Add `pokedex_50` and `pokedex_complete` to `badge_type` enum
- Add `pokemon_rarity` enum: `common / uncommon / rare / ultra_rare`

## Transfer System

Users can transfer duplicate Pokemon for trust points:

| Rarity | Trust Points | Shiny Bonus |
|--------|-------------|-------------|
| Common | +1 | +2 (double) |
| Uncommon | +2 | +4 |
| Rare | +3 | +6 |
| Ultra Rare | +5 | +10 |

Rules:
- Must keep at least one copy of each Pokemon (can't transfer last copy)
- Shiny and non-shiny are separate entries
- Transfer deletes the egg row and awards trust points

## User-Facing Pages

### Collection Page (`/dashboard/collection`)

- Grid of 151 Pokemon sprites
- Caught: shown in color. Uncaught: dark silhouettes
- Shiny catches get a sparkle indicator
- Progress bar: "87/151 caught"
- Filter tabs: All / Caught / Uncaught / Shiny
- Click caught Pokemon for details (name, rarity, when/where caught)

### Egg Inventory (section within collection page)

- Pending (unhatched) eggs with report status
- Recently hatched eggs highlighted with "New!" badge

### Transfer UI

- "Transfer" button on duplicate Pokemon
- Shows trust points to be earned
- Confirmation dialog before transferring

### Existing Page Updates

- **Submit Tip page**: Show "You earned an egg!" notification after submission
- **Dashboard nav**: Add "Collection" link (visible to all users)
- **Leaderboard**: Add "Pokedex %" column

## Edge Cases

- **Rejected sightings**: Linked egg is deleted. No reward for bad data.
- **Rate limiting**: Existing 10/day report cap also caps eggs at 10/day.
- **Transfer abuse**: Can't transfer last copy. Must keep one for Pokedex.
- **Auto-verified users**: Eggs hatch immediately (instant catches as trust reward).
- **Corroboration**: Both users' eggs hatch with independent rolls.
- **Old sightings**: No backfilling. Feature starts clean.

## New Badges

- `pokedex_50` — Caught 50 unique Pokemon
- `pokedex_complete` — Caught all 151 unique Pokemon
