# Full 151 Creature Catalog + Intrinsic Rarity — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Expand the creature catalog from 10 to 151 entries with intrinsic rarity, fix the wild creature system to respect creature-owned rarity tiers, and gate map sprites to only finished PNGs (1-20).

**Architecture:** All 151 creatures live in `CREATURE_DATA` with permanent `rarityTier` values. A `MAX_SPRITE_ID` constant gates which creatures appear on the map. The wild creature algorithm picks from the sprite-ready pool weighted by rarity encounter rates, and the returned rarity always matches the creature's intrinsic tier.

**Tech Stack:** TypeScript, Vitest (for unit tests)

---

### Task 1: Expand CREATURE_DATA to 151 entries

**Files:**
- Modify: `src/db/creature-data.ts:1-37`

**Step 1: Update the CreatureType to include "starter" and "hype"**

The existing type union is missing "starter" and "hype" which are in the design doc's type ranges. Actually, checking the current type: `"shelf" | "logistics" | "checkout" | "scalper" | "hype" | "clearance" | "backroom" | "corporate"` — "hype" is already there. But "starter" is missing. Update line 2:

```typescript
export type CreatureType = "starter" | "shelf" | "logistics" | "checkout" | "scalper" | "hype" | "clearance" | "backroom" | "corporate";
```

**Step 2: Add `MAX_SPRITE_ID` constant**

After `TOTAL_CREATURES`, add:

```typescript
export const MAX_SPRITE_ID = 20;
```

**Step 3: Expand CREATURE_DATA array to all 151 creatures**

Replace the current 10-entry array with all 151 entries. Each entry needs `id`, `name`, `type`, `rarityTier`, and `description`. The names and types come from the design doc at `docs/plans/2026-02-24-cardboard-creatures-pivot-design.md` lines 49-216. Rarity assignments come from `docs/plans/2026-02-26-full-creature-catalog-design.md`.

Key rarity rules:
- Starters (1-9): all **uncommon**
- Corporate (141-151): all **ultra_rare**
- "Prime" / "Max" / "Apex" / "Elite" / "Goliath" suffixes: **rare**
- Simple base forms (Blisterfang, Pegloom, Taxling, etc.): **common**
- Mid-tier interesting creatures: **uncommon**

Also fix creature types for starters 1-9 — they currently use mixed types but should all be "starter" per the design doc type ranges (001-009 = starter).

For creatures 11-151 that don't have descriptions yet, use a short placeholder description based on the name and type. Each description should be 1-2 sentences, retail-themed, matching the tone of existing descriptions.

**Step 4: Verify TOTAL_CREATURES is correct**

`TOTAL_CREATURES = CREATURE_DATA.length` should now equal 151. No code change needed — it's computed automatically.

**Step 5: Run build to verify no type errors**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 6: Commit**

```bash
git add src/db/creature-data.ts
git commit -m "feat: expand creature catalog to all 151 entries with intrinsic rarity"
```

---

### Task 2: Fix wild-creature.ts to use intrinsic rarity

**Files:**
- Modify: `src/lib/wild-creature.ts:1-41`

**Step 1: Update the test file first — add new test cases**

Modify `src/lib/wild-creature.test.ts`. Add these tests:

```typescript
import { CREATURE_DATA, MAX_SPRITE_ID } from "@/db/creature-data";

// Add to existing "getWildCreature" describe block:

it("only returns creatures with id <= MAX_SPRITE_ID", () => {
  vi.useFakeTimers();
  // Test across many store IDs to cover different hash outcomes
  for (let i = 0; i < 100; i++) {
    vi.setSystemTime(new Date("2026-01-15"));
    const creature = getWildCreature(`store-${i}`);
    expect(creature.id).toBeLessThanOrEqual(MAX_SPRITE_ID);
  }
});

it("rarity matches creature intrinsic rarityTier", () => {
  vi.useFakeTimers();
  for (let i = 0; i < 100; i++) {
    vi.setSystemTime(new Date("2026-01-15"));
    const creature = getWildCreature(`store-${i}`);
    const catalogEntry = CREATURE_DATA.find((c) => c.id === creature.id);
    expect(catalogEntry).toBeDefined();
    expect(creature.rarity).toBe(catalogEntry!.rarityTier);
  }
});
```

**Step 2: Run tests to verify the new tests fail**

Run: `npx vitest run src/lib/wild-creature.test.ts`
Expected: The "rarity matches creature intrinsic rarityTier" test FAILS (current code returns the rolled tier, not the creature's tier). The MAX_SPRITE_ID test may also fail since there's currently no filtering.

**Step 3: Update wild-creature.ts**

Replace `getWildCreature` function with:

```typescript
import { CREATURE_DATA, MAX_SPRITE_ID, getSpriteUrl } from "@/db/creature-data";

// RARITY_WEIGHTS and simpleHash stay the same

export function getWildCreature(storeId: string): { id: number; name: string; spriteUrl: string; rarity: string } {
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

  // Only pick from creatures with finished sprites
  const spriteReady = CREATURE_DATA.filter((c) => c.id <= MAX_SPRITE_ID);
  let pool = spriteReady.filter((c) => c.rarityTier === selectedTier);

  // If no sprite-ready creatures in this tier, fall back to nearest available tier
  if (pool.length === 0) {
    const tierOrder = ["common", "uncommon", "rare", "ultra_rare"];
    const selectedIdx = tierOrder.indexOf(selectedTier);
    // Try adjacent tiers, closest first
    for (let offset = 1; offset < tierOrder.length; offset++) {
      for (const dir of [-1, 1]) {
        const tryIdx = selectedIdx + offset * dir;
        if (tryIdx >= 0 && tryIdx < tierOrder.length) {
          pool = spriteReady.filter((c) => c.rarityTier === tierOrder[tryIdx]);
          if (pool.length > 0) break;
        }
      }
      if (pool.length > 0) break;
    }
    // Final fallback: all sprite-ready creatures
    if (pool.length === 0) pool = spriteReady;
  }

  const idx = simpleHash(seed + "pick") % pool.length;
  const creature = pool[idx];
  // Return the creature's intrinsic rarity, not the rolled tier
  return { id: creature.id, name: creature.name, spriteUrl: getSpriteUrl(creature.id), rarity: creature.rarityTier };
}
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/wild-creature.test.ts`
Expected: ALL tests pass

**Step 5: Commit**

```bash
git add src/lib/wild-creature.ts src/lib/wild-creature.test.ts
git commit -m "fix: wild creatures use intrinsic rarity and sprite gate"
```

---

### Task 3: Update boxes.ts rollRandomCreature to remove fallback comment

**Files:**
- Modify: `src/lib/boxes.ts:156-170`
- Modify: `src/lib/boxes.test.ts:81-114`

**Step 1: Update the test for rollRandomCreature**

Now that all 4 rarity tiers have creatures, the "fallback" behavior is no longer needed. Update the test at `src/lib/boxes.test.ts` line 93-107:

```typescript
it("uses found_corroborated weights when corroborated", () => {
  // With 0.99, rollRarity picks ultra_rare from found_corroborated weights.
  // Now that CREATURE_DATA has ultra_rare creatures, the function should
  // return an ultra_rare creature directly.
  const spy = vi.spyOn(Math, "random").mockReturnValue(0.99);
  const creature = rollRandomCreature("found", true);
  expect(creature).toHaveProperty("id");
  expect(creature).toHaveProperty("name");
  expect(creature.rarityTier).toBe("ultra_rare");
  expect(spy).toHaveBeenCalledTimes(2);
});
```

**Step 2: Run tests to verify they pass**

Run: `npx vitest run src/lib/boxes.test.ts`
Expected: ALL pass (the catalog now has ultra_rare creatures so the test correctly expects ultra_rare)

**Step 3: Commit**

```bash
git add src/lib/boxes.ts src/lib/boxes.test.ts
git commit -m "test: update boxes tests for full creature catalog"
```

---

### Task 4: Run full test suite and build

**Step 1: Run all tests**

Run: `npx vitest run`
Expected: All tests pass

**Step 2: Run build**

Run: `npm run build`
Expected: Build succeeds (collection page now shows 151 creatures, wild creatures gated to 1-20)

**Step 3: Commit any fixes if needed**

---

## Notes for implementer

- The design doc at `docs/plans/2026-02-24-cardboard-creatures-pivot-design.md` has all 151 creature names organized by type range
- The rarity design at `docs/plans/2026-02-26-full-creature-catalog-design.md` has specific creature-to-rarity assignments
- Creatures 11-151 need placeholder descriptions — keep them short, retail-themed, matching tone of existing 1-10 descriptions
- The `CreatureType` for starters 1-9 should be changed to `"starter"` to match the design doc type ranges
- `MAX_SPRITE_ID = 20` is the only constant to bump as new sprites are added
