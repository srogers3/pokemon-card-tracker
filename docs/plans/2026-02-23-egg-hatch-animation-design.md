# Egg Hatch Animation Design

## Overview

When a logged-in user navigates to any dashboard page and has hatched eggs they haven't viewed yet, a full-screen modal slides up from the bottom showing a multi-stage egg hatching animation. Each unviewed hatch plays one at a time; the user taps/clicks to advance through the queue.

## Trigger

- **On next visit**: Dashboard layout checks for unviewed hatched eggs on every page load.
- No real-time/websocket component needed. If the user is offline when corroboration happens, they see the animation next time they load the dashboard.

## Database Change

Add a `viewedAt` timestamp column to `pokemonEggs`:

```ts
viewedAt: timestamp("viewed_at")  // null = unviewed hatched egg
```

Query for pending animations: `hatched = true AND viewedAt IS NULL AND pokemonId IS NOT NULL`

## Data Flow

1. **Dashboard layout** (server component) queries for unviewed hatched eggs for the current user
2. If any exist, passes them as props to a new `<EggHatchModal>` client component
3. Modal renders, showing the first egg's animation
4. On dismiss/continue, a server action marks that egg's `viewedAt = now()` and reveals the next
5. After all eggs are viewed, modal closes

## Component: `<EggHatchModal>`

**File**: `src/components/egg-hatch-modal.tsx` (client component)

**Props**: Array of unviewed hatched eggs with Pokemon data:
- Pokemon name, sprite URL, rarity tier
- isShiny flag
- wasUpgrade flag + wild Pokemon name (for upgrade flair)

**Not** using existing shadcn Dialog. Custom full-screen overlay that slides up from bottom for game-feel.

## Animation Stages (CSS keyframes + React state)

1. **Slide up** (300ms) - Dark overlay fades in, egg container slides up from bottom
2. **Wobble** (~2s) - Egg wobbles left-right with increasing intensity, 3 cycles
3. **Crack + light burst** (500ms) - Egg cracks, bright glow expands outward
4. **Reveal** - Pokemon sprite fades in at center with rarity-colored glow. Name + rarity label below
5. **Upgrade flair** (conditional) - If wasUpgrade: "Lucky!" banner with sparkle, "instead of [wildPokemon]" text
6. **Shiny flair** (conditional) - If isShiny: shimmer animation on sprite (reuse existing `shimmer` keyframe)
7. **User action** - Tap anywhere or click "Continue" to proceed to next egg or close

## Rarity Visual Treatment

| Rarity     | Glow Effect                                          |
|------------|------------------------------------------------------|
| Common     | Simple white glow                                    |
| Uncommon   | Teal glow (#2DD4BF, matches existing marker color)   |
| Rare       | Amber glow (#F59E0B, matches existing marker color)  |
| Ultra Rare | Rainbow spinning glow (reuse `rainbow-spin` keyframe)|

## Server Action

New `markEggViewed(eggId: string)` server action. Called after each egg animation completes (when user taps continue).

## Multiple Eggs

Queued sequentially. Each egg gets its own full animation cycle. User advances through the queue one at a time.

## Layout Integration

Mounted in `dashboard/layout.tsx` after `requireUser()`. Works regardless of which dashboard page the user lands on (map, collection, submit, etc.).

## Files to Create/Modify

- `src/db/schema.ts` - Add `viewedAt` column to `pokemonEggs`
- `drizzle/migrations/XXXX_add_viewed_at.sql` - Migration
- `src/lib/eggs.ts` - Add `getUnviewedHatches(userId)` and `markEggViewed(eggId)` functions
- `src/components/egg-hatch-modal.tsx` - New client component with animation
- `src/app/dashboard/layout.tsx` - Query + render `<EggHatchModal>`
- `src/app/globals.css` - New keyframes (wobble, crack, glow-burst)
