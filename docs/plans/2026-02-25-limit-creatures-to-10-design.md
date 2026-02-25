# Limit Creatures to First 10 (Testing Phase)

**Date:** 2026-02-25
**Status:** Approved

## Goal

Limit the app to the first 10 creatures for testing while new sprites are being created. The architecture should make it trivial to add more creatures later — just append to `CREATURE_DATA` and drop a `.png` in `public/sprites/`.

## Changes

### 1. `src/db/creature-data.ts` — Truncate & update sprite format

- Remove creature entries 11-151 from `CREATURE_DATA`
- Export `TOTAL_CREATURES = CREATURE_DATA.length` constant
- Change `getSpriteUrl()` to return `.png` instead of `.svg`
- Change `getShinySpriteUrl()` to return `.png` instead of `.svg`

### 2. Replace hardcoded `151` with `TOTAL_CREATURES`

| File | What to change |
|------|----------------|
| `src/lib/boxes.ts:261` | Badge threshold: `uniqueCaught >= 151` → `TOTAL_CREATURES` |
| `src/app/dashboard/collection/page.tsx:49,57` | Progress display and bar width |
| `src/app/dashboard/leaderboard/page.tsx:127,178` | Cardboardex count display |
| `src/app/sprites-review/page.tsx:59` | Sprite count display |

### 3. `src/app/test-hatch/page.tsx` — Fix mock data

Replace mock creature IDs >10 with IDs in range 1-10.

### 4. `src/db/schema.ts` — Comment update

Update comment `// Creature index (1-151)` to note the count is dynamic.

### 5. No sprite file deletion

Old SVG/PNG files for creatures 11-151 remain in `public/sprites/` — unused but harmless. They'll be replaced with real sprites as new artwork is created.

## What doesn't need to change

The following all derive from `CREATURE_DATA` dynamically:
- Egg hatching / box creation (`src/lib/boxes.ts` rarity selection)
- Wild creature selection (`src/lib/wild-creature.ts`)
- Collection grid display
- DB seed script (`src/db/seed.ts`)
- Placeholder sprite generation script
