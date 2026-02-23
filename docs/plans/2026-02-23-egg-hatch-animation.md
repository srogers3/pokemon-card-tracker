# Egg Hatch Animation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Show a multi-stage egg hatching animation modal when a logged-in user visits the dashboard and has hatched eggs they haven't seen yet.

**Architecture:** Add a `viewedAt` column to `pokemonEggs` to track which hatches have been shown. Dashboard layout queries for unviewed hatches and passes them to a custom full-screen client component that animates each one sequentially with wobble/crack/reveal stages. Server action marks each egg viewed as the user advances.

**Tech Stack:** Next.js 16 (App Router), React 19, Drizzle ORM (PostgreSQL), Tailwind CSS 4, CSS keyframes for animation

---

### Task 1: Database Migration — Add `viewedAt` column

**Files:**
- Modify: `src/db/schema.ts:159-174` (pokemonEggs table)

**Step 1: Add the column to the schema**

In `src/db/schema.ts`, add `viewedAt` to the `pokemonEggs` table definition (after `hatchedAt` on line 172):

```ts
viewedAt: timestamp("viewed_at"),
```

And update the type export — no change needed since `$inferSelect` auto-includes new columns.

**Step 2: Generate the migration**

Run: `npx drizzle-kit generate`
Expected: New migration file in `drizzle/` directory with ALTER TABLE adding `viewed_at` column

**Step 3: Apply the migration**

Run: `npx drizzle-kit push`
Expected: Migration applied successfully to the database

**Step 4: Commit**

```bash
git add src/db/schema.ts drizzle/
git commit -m "feat: add viewedAt column to pokemonEggs for hatch animation tracking"
```

---

### Task 2: Data Layer — Query and mark-viewed functions

**Files:**
- Modify: `src/lib/eggs.ts` (add two new functions at the end)

**Step 1: Add `getUnviewedHatches` function**

Add to the end of `src/lib/eggs.ts`:

```ts
export async function getUnviewedHatches(userId: string) {
  const eggs = await db
    .select({
      id: pokemonEggs.id,
      pokemonId: pokemonEggs.pokemonId,
      wildPokemonId: pokemonEggs.wildPokemonId,
      isShiny: pokemonEggs.isShiny,
      hatchedAt: pokemonEggs.hatchedAt,
    })
    .from(pokemonEggs)
    .where(
      and(
        eq(pokemonEggs.userId, userId),
        eq(pokemonEggs.hatched, true),
        sql`${pokemonEggs.pokemonId} IS NOT NULL`,
        sql`${pokemonEggs.viewedAt} IS NULL`
      )
    );

  return eggs.map((egg) => {
    const pokemon = POKEMON_DATA.find((p) => p.id === egg.pokemonId);
    const wildPokemon = egg.wildPokemonId
      ? POKEMON_DATA.find((p) => p.id === egg.wildPokemonId)
      : null;

    return {
      id: egg.id,
      pokemonName: pokemon?.name ?? "Unknown",
      pokemonId: egg.pokemonId!,
      rarityTier: pokemon?.rarityTier ?? "common",
      spriteUrl: getSpriteUrl(egg.pokemonId!),
      isShiny: egg.isShiny,
      wasUpgrade: !!(egg.wildPokemonId && egg.pokemonId !== egg.wildPokemonId),
      wildPokemonName: wildPokemon?.name ?? null,
    };
  });
}
```

Note: You'll need to add `getSpriteUrl` to the imports at the top of the file:

```ts
import { POKEMON_DATA, getSpriteUrl } from "@/db/pokemon-data";
```

(Replace the existing `import { POKEMON_DATA } from "@/db/pokemon-data";` on line 8)

**Step 2: Add `markEggViewed` function**

Add right after `getUnviewedHatches`:

```ts
export async function markEggViewed(eggId: string) {
  await db
    .update(pokemonEggs)
    .set({ viewedAt: new Date() })
    .where(eq(pokemonEggs.id, eggId));
}
```

**Step 3: Verify build**

Run: `npx next build` (or `npm run build`)
Expected: Compiles without errors

**Step 4: Commit**

```bash
git add src/lib/eggs.ts
git commit -m "feat: add getUnviewedHatches and markEggViewed data functions"
```

---

### Task 3: Server Action — Mark egg viewed

**Files:**
- Modify: `src/app/dashboard/actions.ts` (add server action)

**Step 1: Read existing dashboard actions file**

Read `src/app/dashboard/actions.ts` to see what's there and follow existing patterns.

**Step 2: Add markEggViewedAction**

Add to `src/app/dashboard/actions.ts`:

```ts
"use server";

import { requireUser } from "@/lib/auth";
import { markEggViewed } from "@/lib/eggs";

export async function markEggViewedAction(eggId: string) {
  const user = await requireUser();
  // Auth check: the markEggViewed function updates by eggId,
  // but we call requireUser to ensure the request is authenticated
  await markEggViewed(eggId);
}
```

If the file already has `"use server"` and imports, just add the function and merge imports.

**Step 3: Commit**

```bash
git add src/app/dashboard/actions.ts
git commit -m "feat: add markEggViewedAction server action"
```

---

### Task 4: CSS Keyframes — Wobble, crack, glow-burst animations

**Files:**
- Modify: `src/app/globals.css` (add new keyframes after existing ones, around line 144)

**Step 1: Add hatch animation keyframes**

Add after the existing `glow-pulse` keyframe (line 144) in `src/app/globals.css`:

```css
/* Egg hatch animations */
@keyframes egg-wobble {
  0%, 100% { transform: rotate(0deg); }
  20% { transform: rotate(-8deg); }
  40% { transform: rotate(8deg); }
  60% { transform: rotate(-12deg); }
  80% { transform: rotate(12deg); }
}

@keyframes egg-wobble-intense {
  0%, 100% { transform: rotate(0deg); }
  15% { transform: rotate(-15deg); }
  30% { transform: rotate(15deg); }
  45% { transform: rotate(-20deg); }
  60% { transform: rotate(20deg); }
  75% { transform: rotate(-15deg); }
  90% { transform: rotate(15deg); }
}

@keyframes egg-crack {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 1; }
  100% { transform: scale(1.3); opacity: 0; }
}

@keyframes glow-burst {
  0% { transform: scale(0); opacity: 0.8; }
  60% { transform: scale(2); opacity: 0.6; }
  100% { transform: scale(3); opacity: 0; }
}

@keyframes pokemon-reveal {
  0% { transform: scale(0.3); opacity: 0; }
  60% { transform: scale(1.1); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes slide-up {
  0% { transform: translateY(100%); }
  100% { transform: translateY(0); }
}

@keyframes lucky-banner {
  0% { transform: scale(0) rotate(-10deg); opacity: 0; }
  60% { transform: scale(1.1) rotate(2deg); opacity: 1; }
  100% { transform: scale(1) rotate(0deg); opacity: 1; }
}
```

**Step 2: Commit**

```bash
git add src/app/globals.css
git commit -m "feat: add CSS keyframes for egg hatch animation stages"
```

---

### Task 5: EggHatchModal Component

**Files:**
- Create: `src/components/egg-hatch-modal.tsx`

**Step 1: Create the component**

Create `src/components/egg-hatch-modal.tsx` as a `"use client"` component. This is the main animation component.

```tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { markEggViewedAction } from "@/app/dashboard/actions";

type HatchData = {
  id: string;
  pokemonName: string;
  pokemonId: number;
  rarityTier: "common" | "uncommon" | "rare" | "ultra_rare";
  spriteUrl: string;
  isShiny: boolean;
  wasUpgrade: boolean;
  wildPokemonName: string | null;
};

type AnimStage = "idle" | "wobble1" | "wobble2" | "wobble3" | "crack" | "reveal" | "done";

const RARITY_GLOW: Record<string, string> = {
  common: "rgba(255, 255, 255, 0.6)",
  uncommon: "rgba(45, 212, 191, 0.6)",
  rare: "rgba(245, 158, 11, 0.6)",
  ultra_rare: "",
};

const RARITY_LABEL: Record<string, string> = {
  common: "Common",
  uncommon: "Uncommon",
  rare: "Rare",
  ultra_rare: "Ultra Rare",
};

const RARITY_LABEL_COLOR: Record<string, string> = {
  common: "text-gray-400",
  uncommon: "text-teal-400",
  rare: "text-amber-400",
  ultra_rare: "text-purple-400",
};

export function EggHatchModal({ hatches }: { hatches: HatchData[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [stage, setStage] = useState<AnimStage>("idle");
  const [open, setOpen] = useState(true);

  const current = hatches[currentIndex];

  // Auto-advance through animation stages
  useEffect(() => {
    if (!open || !current) return;

    // Start animation on mount / index change
    setStage("wobble1");

    const timers: NodeJS.Timeout[] = [];
    timers.push(setTimeout(() => setStage("wobble2"), 700));
    timers.push(setTimeout(() => setStage("wobble3"), 1400));
    timers.push(setTimeout(() => setStage("crack"), 2100));
    timers.push(setTimeout(() => setStage("reveal"), 2600));
    timers.push(setTimeout(() => setStage("done"), 3200));

    return () => timers.forEach(clearTimeout);
  }, [currentIndex, open, current]);

  const handleContinue = useCallback(async () => {
    if (stage !== "done") return;

    // Mark current egg as viewed
    await markEggViewedAction(current.id);

    if (currentIndex < hatches.length - 1) {
      setStage("idle");
      setCurrentIndex((i) => i + 1);
    } else {
      setOpen(false);
    }
  }, [stage, current, currentIndex, hatches.length]);

  if (!open || !current) return null;

  const isUltraRare = current.rarityTier === "ultra_rare";
  const glowColor = RARITY_GLOW[current.rarityTier];
  const showPokemon = stage === "reveal" || stage === "done";
  const showEgg = stage !== "reveal" && stage !== "done";
  const isCracking = stage === "crack";

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 animate-in fade-in duration-300"
        onClick={handleContinue}
      />

      {/* Modal content */}
      <div
        className="relative z-10 w-full max-w-sm mx-auto mb-0 flex flex-col items-center pb-12 pt-8"
        style={{ animation: "slide-up 300ms ease-out" }}
      >
        {/* Egg counter */}
        {hatches.length > 1 && (
          <div className="text-white/60 text-sm mb-4">
            Egg {currentIndex + 1} of {hatches.length}
          </div>
        )}

        {/* Egg / Pokemon container */}
        <div className="relative w-48 h-48 flex items-center justify-center">
          {/* Glow burst behind Pokemon on reveal */}
          {isCracking && (
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: isUltraRare
                  ? "conic-gradient(from var(--rainbow-angle, 0deg), #ff0000, #ff8000, #ffff00, #00ff00, #0080ff, #8000ff, #ff0000)"
                  : `radial-gradient(circle, ${glowColor}, transparent 70%)`,
                animation: isUltraRare
                  ? "glow-burst 600ms ease-out forwards, rainbow-spin 2s linear infinite"
                  : "glow-burst 600ms ease-out forwards",
              }}
            />
          )}

          {showPokemon && (
            <div
              className="absolute inset-0 rounded-full opacity-50"
              style={{
                background: isUltraRare
                  ? "conic-gradient(from var(--rainbow-angle, 0deg), #ff0000, #ff8000, #ffff00, #00ff00, #0080ff, #8000ff, #ff0000)"
                  : `radial-gradient(circle, ${glowColor}, transparent 70%)`,
                animation: isUltraRare ? "rainbow-spin 2s linear infinite" : undefined,
              }}
            />
          )}

          {/* Egg */}
          {showEgg && (
            <div
              className="text-8xl select-none"
              style={{
                animation:
                  stage === "wobble1"
                    ? "egg-wobble 700ms ease-in-out"
                    : stage === "wobble2"
                      ? "egg-wobble 700ms ease-in-out"
                      : stage === "wobble3"
                        ? "egg-wobble-intense 700ms ease-in-out"
                        : stage === "crack"
                          ? "egg-crack 500ms ease-out forwards"
                          : undefined,
              }}
            >
              🥚
            </div>
          )}

          {/* Pokemon sprite */}
          {showPokemon && (
            <div className="relative">
              {current.isShiny && <div className="absolute inset-0 shimmer rounded-full" />}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={current.spriteUrl}
                alt={current.pokemonName}
                className="w-32 h-32 relative z-10 pixelated"
                style={{
                  animation: "pokemon-reveal 600ms ease-out",
                  imageRendering: "pixelated",
                }}
              />
            </div>
          )}
        </div>

        {/* Pokemon info */}
        {showPokemon && (
          <div className="text-center mt-4 animate-in fade-in duration-500">
            <div className="flex items-center justify-center gap-2">
              <h3 className="text-2xl font-bold text-white">
                {current.pokemonName}
              </h3>
              {current.isShiny && <span className="text-xl">✨</span>}
            </div>
            <p className={`text-sm font-medium mt-1 ${RARITY_LABEL_COLOR[current.rarityTier]}`}>
              {RARITY_LABEL[current.rarityTier]}
            </p>

            {/* Upgrade flair */}
            {current.wasUpgrade && current.wildPokemonName && (
              <div
                className="mt-3 inline-block bg-amber-500/20 border border-amber-400/50 rounded-full px-4 py-1"
                style={{ animation: "lucky-banner 500ms ease-out" }}
              >
                <span className="text-amber-300 font-semibold text-sm">
                  Lucky! <span className="text-white/80 font-normal">instead of {current.wildPokemonName}</span>
                </span>
              </div>
            )}
          </div>
        )}

        {/* Continue prompt */}
        {stage === "done" && (
          <button
            onClick={handleContinue}
            className="mt-8 text-white/60 text-sm animate-pulse hover:text-white/90 transition-colors"
          >
            {currentIndex < hatches.length - 1 ? "Tap to continue" : "Tap to close"}
          </button>
        )}
      </div>
    </div>
  );
}
```

**Step 2: Verify build**

Run: `npx next build` (or `npm run build`)
Expected: Compiles without errors (component isn't mounted yet, but should parse fine)

**Step 3: Commit**

```bash
git add src/components/egg-hatch-modal.tsx
git commit -m "feat: add EggHatchModal component with multi-stage animation"
```

---

### Task 6: Dashboard Layout Integration

**Files:**
- Modify: `src/app/dashboard/layout.tsx:1-23`

**Step 1: Add the query and component to layout**

Replace `src/app/dashboard/layout.tsx` with:

```tsx
import { requireUser } from "@/lib/auth";
import { SiteHeader } from "@/components/site-header";
import { DashboardNav } from "@/components/dashboard-nav";
import { getUnviewedHatches } from "@/lib/eggs";
import { EggHatchModal } from "@/components/egg-hatch-modal";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const unviewedHatches = await getUnviewedHatches(user.id);

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader isPremium={user.subscriptionTier === "premium"} />
      <div className="hidden md:block px-4 pt-4">
        <DashboardNav isPremium={user.subscriptionTier === "premium"} />
      </div>
      <div className="flex-1">
        {children}
      </div>
      {unviewedHatches.length > 0 && (
        <EggHatchModal hatches={unviewedHatches} />
      )}
    </div>
  );
}
```

**Step 2: Verify build**

Run: `npx next build` (or `npm run build`)
Expected: Compiles without errors

**Step 3: Commit**

```bash
git add src/app/dashboard/layout.tsx
git commit -m "feat: integrate egg hatch modal into dashboard layout"
```

---

### Task 7: Manual Testing & Polish

**Step 1: Test with real data**

Start the dev server and manually test:
- Create a test egg in the database that is hatched but has `viewed_at = NULL`
- Load the dashboard and verify the modal appears
- Verify the animation stages play correctly (wobble, crack, reveal)
- Verify the "Continue" / "Close" interaction works
- Verify that after viewing, refreshing the page does NOT show the modal again (viewedAt was set)

**Step 2: Test edge cases**
- Multiple unviewed eggs → should queue one at a time
- Shiny Pokemon → shimmer overlay appears
- Upgrade → "Lucky!" banner appears
- Ultra rare → rainbow glow
- No unviewed eggs → no modal at all

**Step 3: Final commit**

If any polish or fixes were needed:

```bash
git add -A
git commit -m "fix: polish egg hatch animation from manual testing"
```
