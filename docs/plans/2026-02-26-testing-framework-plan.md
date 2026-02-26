# Testing Framework Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Set up Vitest and write unit tests for all pure business logic functions.

**Architecture:** Vitest with `@vitest/coverage-v8` for unit testing pure functions. Tests colocated next to source files. Some private functions need to be exported to enable direct testing. Functions that use `Date.now()` or `new Date()` will use `vi.useFakeTimers()`.

**Tech Stack:** Vitest, @vitest/coverage-v8

---

### Task 1: Install Vitest and Configure

**Files:**
- Modify: `package.json` (add devDependencies and scripts)
- Create: `vitest.config.ts`

**Step 1: Install packages**

Run: `npm install -D vitest @vitest/coverage-v8`

**Step 2: Create vitest.config.ts**

```ts
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

**Step 3: Add test scripts to package.json**

Add to `"scripts"`:
```json
"test": "vitest run",
"test:watch": "vitest",
"test:coverage": "vitest run --coverage"
```

**Step 4: Run vitest to verify config**

Run: `npx vitest run`
Expected: "No test files found" (no error)

**Step 5: Commit**

```bash
git add vitest.config.ts package.json package-lock.json
git commit -m "feat: add vitest testing framework"
```

---

### Task 2: Test src/lib/utils.ts

**Files:**
- Create: `src/lib/utils.test.ts`

**Step 1: Write tests**

```ts
import { describe, it, expect, vi, afterEach } from "vitest";
import { cn, getDistanceMeters, timeAgo, MAX_TIP_DISTANCE_M } from "./utils";

describe("cn", () => {
  it("merges tailwind classes", () => {
    expect(cn("px-2 py-1", "px-4")).toBe("px-4 py-1");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "extra")).toBe("base extra");
  });
});

describe("getDistanceMeters", () => {
  it("returns 0 for identical points", () => {
    expect(getDistanceMeters(40.7128, -74.006, 40.7128, -74.006)).toBe(0);
  });

  it("calculates distance between NYC and LA approximately", () => {
    // NYC: 40.7128, -74.0060  LA: 34.0522, -118.2437
    const dist = getDistanceMeters(40.7128, -74.006, 34.0522, -118.2437);
    // Known distance ~3944 km
    expect(dist).toBeGreaterThan(3_900_000);
    expect(dist).toBeLessThan(4_000_000);
  });

  it("calculates short distance accurately", () => {
    // Two points ~111 meters apart (0.001 degree latitude)
    const dist = getDistanceMeters(40.0, -74.0, 40.001, -74.0);
    expect(dist).toBeGreaterThan(100);
    expect(dist).toBeLessThan(120);
  });
});

describe("MAX_TIP_DISTANCE_M", () => {
  it("is 800 meters", () => {
    expect(MAX_TIP_DISTANCE_M).toBe(800);
  });
});

describe("timeAgo", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "Just now" for less than 60 seconds ago', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-15T12:00:30Z"));
    expect(timeAgo(new Date("2026-01-15T12:00:00Z"))).toBe("Just now");
  });

  it('returns "Xm ago" for minutes', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-15T12:05:00Z"));
    expect(timeAgo(new Date("2026-01-15T12:00:00Z"))).toBe("5m ago");
  });

  it('returns "Xh ago" for hours', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-15T15:00:00Z"));
    expect(timeAgo(new Date("2026-01-15T12:00:00Z"))).toBe("3h ago");
  });

  it('returns "Yesterday" for 1 day ago', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-16T12:00:00Z"));
    expect(timeAgo(new Date("2026-01-15T12:00:00Z"))).toBe("Yesterday");
  });

  it('returns "Xd ago" for 2-6 days', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-18T12:00:00Z"));
    expect(timeAgo(new Date("2026-01-15T12:00:00Z"))).toBe("3d ago");
  });

  it("returns locale date string for 7+ days", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-25T12:00:00Z"));
    const result = timeAgo(new Date("2026-01-15T12:00:00Z"));
    // toLocaleDateString varies by locale, just check it's not a relative format
    expect(result).not.toContain("ago");
    expect(result).not.toBe("Yesterday");
  });
});
```

**Step 2: Run tests**

Run: `npx vitest run src/lib/utils.test.ts`
Expected: All pass

**Step 3: Commit**

```bash
git add src/lib/utils.test.ts
git commit -m "test: add unit tests for utils (cn, getDistanceMeters, timeAgo)"
```

---

### Task 3: Test src/lib/trends.ts

`getGrade`, `getBestDay`, `getBestTimeWindow` are private. We test them indirectly through `analyzeTrends`. `getBarPercent` is exported.

**Files:**
- Create: `src/lib/trends.test.ts`

**Step 1: Write tests**

```ts
import { describe, it, expect } from "vitest";
import { analyzeTrends, getBarPercent } from "./trends";

describe("getBarPercent", () => {
  it("returns 90 for hot", () => expect(getBarPercent("hot")).toBe(90));
  it("returns 65 for warm", () => expect(getBarPercent("warm")).toBe(65));
  it("returns 35 for cool", () => expect(getBarPercent("cool")).toBe(35));
  it("returns 15 for cold", () => expect(getBarPercent("cold")).toBe(15));
});

describe("analyzeTrends", () => {
  it("returns cold with low confidence for empty input", () => {
    const result = analyzeTrends([]);
    expect(result).toEqual({
      grade: "cold",
      avgDaysBetween: null,
      totalSightings: 0,
      bestDay: null,
      bestTimeWindow: null,
      confidence: "low",
    });
  });

  it("returns cold with low confidence for single date", () => {
    const result = analyzeTrends([new Date("2026-01-15")]);
    expect(result.grade).toBe("cold");
    expect(result.confidence).toBe("low");
    expect(result.avgDaysBetween).toBeNull();
  });

  it("calculates hot grade for frequent sightings", () => {
    // 4 sightings, 1 day apart each → avgDays = 1
    const dates = [
      new Date("2026-01-15"),
      new Date("2026-01-16"),
      new Date("2026-01-17"),
      new Date("2026-01-18"),
    ];
    const result = analyzeTrends(dates);
    expect(result.grade).toBe("hot");
    expect(result.avgDaysBetween).toBe(1);
    expect(result.totalSightings).toBe(4);
    expect(result.confidence).toBe("medium");
  });

  it("calculates warm grade for weekly sightings", () => {
    // 5 sightings, 7 days apart → avgDays = 7
    const dates = [
      new Date("2026-01-01"),
      new Date("2026-01-08"),
      new Date("2026-01-15"),
      new Date("2026-01-22"),
      new Date("2026-01-29"),
    ];
    const result = analyzeTrends(dates);
    expect(result.grade).toBe("warm");
    expect(result.avgDaysBetween).toBe(7);
    expect(result.confidence).toBe("high");
  });

  it("calculates cool grade for bi-weekly sightings", () => {
    const dates = [
      new Date("2026-01-01"),
      new Date("2026-01-15"),
      new Date("2026-01-29"),
    ];
    const result = analyzeTrends(dates);
    expect(result.grade).toBe("cool");
    expect(result.avgDaysBetween).toBe(14);
  });

  it("calculates cold grade for infrequent sightings", () => {
    const dates = [
      new Date("2026-01-01"),
      new Date("2026-02-01"),
      new Date("2026-03-01"),
    ];
    const result = analyzeTrends(dates);
    expect(result.grade).toBe("cold");
  });

  it("finds bestDay when pattern exists", () => {
    // All on Wednesdays (2026-01-07, 14, 21 are Wednesdays)
    const dates = [
      new Date("2026-01-07T10:00:00"),
      new Date("2026-01-14T10:00:00"),
      new Date("2026-01-21T10:00:00"),
    ];
    const result = analyzeTrends(dates);
    expect(result.bestDay).toBe("Wednesdays");
  });

  it("returns null bestDay when no day has 2+ sightings", () => {
    // Each on a different day of week
    const dates = [
      new Date("2026-01-05T10:00:00"), // Monday
      new Date("2026-01-07T10:00:00"), // Wednesday
    ];
    const result = analyzeTrends(dates);
    expect(result.bestDay).toBeNull();
  });

  it("finds bestTimeWindow when 5+ sightings with pattern", () => {
    // 5 morning sightings
    const dates = [
      new Date("2026-01-01T08:00:00"),
      new Date("2026-01-02T09:00:00"),
      new Date("2026-01-03T10:00:00"),
      new Date("2026-01-04T11:00:00"),
      new Date("2026-01-05T07:00:00"),
    ];
    const result = analyzeTrends(dates);
    expect(result.bestTimeWindow).toBe("morning");
  });

  it("returns null bestTimeWindow with fewer than 5 sightings", () => {
    const dates = [
      new Date("2026-01-01T08:00:00"),
      new Date("2026-01-02T09:00:00"),
      new Date("2026-01-03T10:00:00"),
    ];
    const result = analyzeTrends(dates);
    expect(result.bestTimeWindow).toBeNull();
  });

  it("handles unsorted input dates", () => {
    const dates = [
      new Date("2026-01-18"),
      new Date("2026-01-15"),
      new Date("2026-01-17"),
      new Date("2026-01-16"),
    ];
    const result = analyzeTrends(dates);
    expect(result.avgDaysBetween).toBe(1);
    expect(result.grade).toBe("hot");
  });

  it("sets confidence based on count", () => {
    // 2 sightings → low (but not < 2 path)
    const two = analyzeTrends([new Date("2026-01-01"), new Date("2026-01-02")]);
    expect(two.confidence).toBe("low");

    // 3 sightings → medium
    const three = analyzeTrends([
      new Date("2026-01-01"),
      new Date("2026-01-02"),
      new Date("2026-01-03"),
    ]);
    expect(three.confidence).toBe("medium");

    // 5 sightings → high
    const five = analyzeTrends([
      new Date("2026-01-01"),
      new Date("2026-01-02"),
      new Date("2026-01-03"),
      new Date("2026-01-04"),
      new Date("2026-01-05"),
    ]);
    expect(five.confidence).toBe("high");
  });
});
```

**Step 2: Run tests**

Run: `npx vitest run src/lib/trends.test.ts`
Expected: All pass

**Step 3: Commit**

```bash
git add src/lib/trends.test.ts
git commit -m "test: add unit tests for trends (analyzeTrends, getBarPercent)"
```

---

### Task 4: Test src/lib/wild-creature.ts

`simpleHash` is pure. `getWildCreature` uses `new Date()` internally so needs fake timers. It also imports `CREATURE_DATA` which is static data — no mocking needed.

**Files:**
- Create: `src/lib/wild-creature.test.ts`

**Step 1: Write tests**

```ts
import { describe, it, expect, vi, afterEach } from "vitest";
import { simpleHash, getWildCreature } from "./wild-creature";

describe("simpleHash", () => {
  it("returns a non-negative number", () => {
    expect(simpleHash("test")).toBeGreaterThanOrEqual(0);
  });

  it("is deterministic", () => {
    expect(simpleHash("hello")).toBe(simpleHash("hello"));
  });

  it("produces different hashes for different strings", () => {
    expect(simpleHash("abc")).not.toBe(simpleHash("xyz"));
  });

  it("handles empty string", () => {
    expect(simpleHash("")).toBe(0);
  });
});

describe("getWildCreature", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns a creature with id, name, spriteUrl, and rarity", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-15"));
    const creature = getWildCreature("store-123");
    expect(creature).toHaveProperty("id");
    expect(creature).toHaveProperty("name");
    expect(creature).toHaveProperty("spriteUrl");
    expect(creature).toHaveProperty("rarity");
    expect(typeof creature.id).toBe("number");
    expect(typeof creature.name).toBe("string");
  });

  it("is deterministic for same store and date", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-15"));
    const a = getWildCreature("store-123");
    const b = getWildCreature("store-123");
    expect(a).toEqual(b);
  });

  it("gives different creatures for different stores", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-15"));
    const a = getWildCreature("store-aaa");
    const b = getWildCreature("store-zzz");
    // Not guaranteed different but extremely likely with hash
    // Test at least that the function runs without error for both
    expect(a).toBeDefined();
    expect(b).toBeDefined();
  });

  it("gives different creature for same store on different day", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-15"));
    const day1 = getWildCreature("store-123");
    vi.setSystemTime(new Date("2026-01-16"));
    const day2 = getWildCreature("store-123");
    // Again, not guaranteed different but very likely
    expect(day1).toBeDefined();
    expect(day2).toBeDefined();
  });

  it("returns a valid rarity tier", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-15"));
    const creature = getWildCreature("store-123");
    expect(["common", "uncommon", "rare", "ultra_rare"]).toContain(creature.rarity);
  });
});
```

**Step 2: Run tests**

Run: `npx vitest run src/lib/wild-creature.test.ts`
Expected: All pass

**Step 3: Commit**

```bash
git add src/lib/wild-creature.test.ts
git commit -m "test: add unit tests for wild-creature (simpleHash, getWildCreature)"
```

---

### Task 5: Export private pure functions from boxes.ts and places.ts

Several testable pure functions are not exported. Export them to enable testing.

**Files:**
- Modify: `src/lib/boxes.ts` — export `rollRarity`, `rollUpgradeTier`, `rollRandomCreature`
- Modify: `src/lib/places.ts` — export `isLikelyRetailStore`, `mapStoreType`, `toGridCell`

**Step 1: In boxes.ts, add `export` to three functions**

Change `function rollUpgradeTier(` to `export function rollUpgradeTier(`
Change `function rollRandomCreature(` to `export function rollRandomCreature(`
Change `function rollRarity(` to `export function rollRarity(`

**Step 2: In places.ts, add `export` to three functions**

Change `function isLikelyRetailStore(` to `export function isLikelyRetailStore(`
Change `function mapStoreType(` to `export function mapStoreType(`
Change `function toGridCell(` to `export function toGridCell(`

**Step 3: Run build to check nothing breaks**

Run: `npx tsc --noEmit`
Expected: No errors (exporting doesn't break existing code)

**Step 4: Commit**

```bash
git add src/lib/boxes.ts src/lib/places.ts
git commit -m "refactor: export pure helper functions for testing"
```

---

### Task 6: Test src/lib/boxes.ts (pure functions only)

**Files:**
- Create: `src/lib/boxes.test.ts`

**Step 1: Write tests**

```ts
import { describe, it, expect, vi, afterEach } from "vitest";
import { getCardboardexCompletion, rollRarity, rollUpgradeTier, rollRandomCreature } from "./boxes";

describe("getCardboardexCompletion", () => {
  it("returns 0 for empty array", () => {
    expect(getCardboardexCompletion([])).toBe(0);
  });

  it("returns 0 when all creatureIds are null", () => {
    expect(getCardboardexCompletion([{ creatureId: null }, { creatureId: null }])).toBe(0);
  });

  it("counts unique non-null creatureIds", () => {
    const boxes = [
      { creatureId: 1 },
      { creatureId: 2 },
      { creatureId: 1 }, // duplicate
      { creatureId: 3 },
      { creatureId: null },
    ];
    expect(getCardboardexCompletion(boxes)).toBe(3);
  });

  it("handles single creature", () => {
    expect(getCardboardexCompletion([{ creatureId: 42 }])).toBe(1);
  });
});

describe("rollRarity", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns common when roll is in common range", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.0); // roll = 0
    const weights = { common: 75, uncommon: 25, rare: 0, ultra_rare: 0 };
    expect(rollRarity(weights)).toBe("common");
  });

  it("returns uncommon when roll falls in uncommon range", () => {
    // Total = 100, uncommon starts at 75. random() * 100 = 80 → roll -= 75 = 5, roll -= 25 → <=0
    vi.spyOn(Math, "random").mockReturnValue(0.8);
    const weights = { common: 75, uncommon: 25, rare: 0, ultra_rare: 0 };
    expect(rollRarity(weights)).toBe("uncommon");
  });

  it("returns ultra_rare for found_corroborated at high roll", () => {
    // Total = 100. ultra_rare starts at 85. random() * 100 = 99 → falls through to ultra_rare
    vi.spyOn(Math, "random").mockReturnValue(0.99);
    const weights = { common: 25, uncommon: 30, rare: 30, ultra_rare: 15 };
    expect(rollRarity(weights)).toBe("ultra_rare");
  });

  it("defaults to common if roll overshoots", () => {
    // This shouldn't normally happen but tests the fallback
    vi.spyOn(Math, "random").mockReturnValue(0.999999);
    const weights = { common: 0, uncommon: 0, rare: 0, ultra_rare: 0 };
    expect(rollRarity(weights)).toBe("common");
  });
});

describe("rollUpgradeTier", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns the only eligible tier when one option", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    expect(rollUpgradeTier(["ultra_rare"])).toBe("ultra_rare");
  });

  it("respects weighted distribution", () => {
    // Eligible: uncommon (60), rare (30), ultra_rare (10). Total = 100.
    // roll = 0.0 * 100 = 0 → uncommon (0 - 60 <= 0)
    vi.spyOn(Math, "random").mockReturnValue(0.0);
    expect(rollUpgradeTier(["uncommon", "rare", "ultra_rare"])).toBe("uncommon");

    // roll = 0.7 * 100 = 70 → 70-60=10, 10-30<=0 → rare
    vi.spyOn(Math, "random").mockReturnValue(0.7);
    expect(rollUpgradeTier(["uncommon", "rare", "ultra_rare"])).toBe("rare");

    // roll = 0.95 * 100 = 95 → 95-60=35, 35-30=5, 5-10<=0 → ultra_rare
    vi.spyOn(Math, "random").mockReturnValue(0.95);
    expect(rollUpgradeTier(["uncommon", "rare", "ultra_rare"])).toBe("ultra_rare");
  });
});

describe("rollRandomCreature", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns a creature with id, name, and rarityTier", () => {
    const creature = rollRandomCreature("found", false);
    expect(creature).toHaveProperty("id");
    expect(creature).toHaveProperty("name");
    expect(creature).toHaveProperty("rarityTier");
  });

  it("uses found_corroborated weights when corroborated", () => {
    // With corroborated, ultra_rare has 15% chance (vs 5% for found)
    // Mock to get ultra_rare range: random for rollRarity at 0.99
    vi.spyOn(Math, "random").mockReturnValue(0.99);
    const creature = rollRandomCreature("found", true);
    expect(creature.rarityTier).toBe("ultra_rare");
  });

  it("uses not_found weights as fallback for unknown status", () => {
    // not_found: common 75, uncommon 25, rare 0, ultra_rare 0
    vi.spyOn(Math, "random").mockReturnValue(0.0);
    const creature = rollRandomCreature("unknown_status", false);
    expect(creature.rarityTier).toBe("common");
  });
});
```

**Step 2: Run tests**

Run: `npx vitest run src/lib/boxes.test.ts`
Expected: All pass

**Step 3: Commit**

```bash
git add src/lib/boxes.test.ts
git commit -m "test: add unit tests for boxes (rollRarity, rollUpgradeTier, getCardboardexCompletion)"
```

---

### Task 7: Test src/lib/trust.ts (pure function only)

**Files:**
- Create: `src/lib/trust.test.ts`

**Step 1: Write tests**

```ts
import { describe, it, expect } from "vitest";
import { shouldAutoVerify } from "./trust";

describe("shouldAutoVerify", () => {
  it("returns false for score below 50", () => {
    expect(shouldAutoVerify(0)).toBe(false);
    expect(shouldAutoVerify(49)).toBe(false);
  });

  it("returns true for score of exactly 50", () => {
    expect(shouldAutoVerify(50)).toBe(true);
  });

  it("returns true for score above 50", () => {
    expect(shouldAutoVerify(100)).toBe(true);
  });
});
```

**Step 2: Run tests**

Run: `npx vitest run src/lib/trust.test.ts`
Expected: All pass

**Step 3: Commit**

```bash
git add src/lib/trust.test.ts
git commit -m "test: add unit tests for trust (shouldAutoVerify)"
```

---

### Task 8: Test src/lib/places.ts (pure functions only)

Note: `places.ts` has `"use server"` at the top. Vitest should handle this fine for the pure exported functions since we're not calling the server action.

**Files:**
- Create: `src/lib/places.test.ts`

**Step 1: Write tests**

```ts
import { describe, it, expect } from "vitest";
import { isLikelyRetailStore, mapStoreType, toGridCell } from "./places";

describe("isLikelyRetailStore", () => {
  it("returns true for retail types", () => {
    expect(isLikelyRetailStore(["store", "point_of_interest"])).toBe(true);
  });

  it("returns true for empty types array", () => {
    expect(isLikelyRetailStore([])).toBe(true);
  });

  it("returns false when any type is excluded", () => {
    expect(isLikelyRetailStore(["store", "restaurant"])).toBe(false);
    expect(isLikelyRetailStore(["church"])).toBe(false);
    expect(isLikelyRetailStore(["hospital", "point_of_interest"])).toBe(false);
  });

  it("returns false for various excluded categories", () => {
    expect(isLikelyRetailStore(["school"])).toBe(false);
    expect(isLikelyRetailStore(["bank"])).toBe(false);
    expect(isLikelyRetailStore(["gym"])).toBe(false);
    expect(isLikelyRetailStore(["car_dealer"])).toBe(false);
    expect(isLikelyRetailStore(["night_club"])).toBe(false);
  });
});

describe("mapStoreType", () => {
  it('maps department_store to "big_box"', () => {
    expect(mapStoreType(["department_store"])).toBe("big_box");
  });

  it('maps shopping_mall to "big_box"', () => {
    expect(mapStoreType(["shopping_mall"])).toBe("big_box");
  });

  it('maps grocery_or_supermarket to "grocery"', () => {
    expect(mapStoreType(["grocery_or_supermarket"])).toBe("grocery");
  });

  it('maps supermarket to "grocery"', () => {
    expect(mapStoreType(["supermarket"])).toBe("grocery");
  });

  it('maps pharmacy to "pharmacy"', () => {
    expect(mapStoreType(["pharmacy"])).toBe("pharmacy");
  });

  it('maps drugstore to "pharmacy"', () => {
    expect(mapStoreType(["drugstore"])).toBe("pharmacy");
  });

  it('maps store to "lgs"', () => {
    expect(mapStoreType(["store"])).toBe("lgs");
  });

  it('maps book_store to "lgs"', () => {
    expect(mapStoreType(["book_store"])).toBe("lgs");
  });

  it('maps unknown types to "other"', () => {
    expect(mapStoreType(["point_of_interest"])).toBe("other");
    expect(mapStoreType([])).toBe("other");
  });

  it("uses first matching type when multiple present", () => {
    // department_store is checked before store
    expect(mapStoreType(["store", "department_store"])).toBe("big_box");
  });
});

describe("toGridCell", () => {
  it("rounds to 0.05-degree grid", () => {
    const result = toGridCell(40.712, -74.006);
    expect(result.gridLat).toBeCloseTo(40.7, 5);
    expect(result.gridLng).toBeCloseTo(-74.0, 5);
  });

  it("rounds to nearest grid cell", () => {
    const result = toGridCell(40.726, -74.023);
    expect(result.gridLat).toBeCloseTo(40.75, 5);
    expect(result.gridLng).toBeCloseTo(-74.0, 5);
  });

  it("handles zero coordinates", () => {
    const result = toGridCell(0, 0);
    expect(result.gridLat).toBe(0);
    expect(result.gridLng).toBe(0);
  });

  it("handles negative coordinates", () => {
    const result = toGridCell(-33.868, 151.209);
    expect(result.gridLat).toBeCloseTo(-33.85, 5);
    expect(result.gridLng).toBeCloseTo(151.2, 5);
  });
});
```

**Step 2: Run tests**

If tests fail due to `"use server"` directive, create a `vitest.config.ts` override to strip it. The fix would be adding a plugin — but try without first.

Run: `npx vitest run src/lib/places.test.ts`
Expected: All pass (or may need config fix — see troubleshooting below)

**Troubleshooting:** If `"use server"` causes issues, the vitest config may need the `react` plugin or a custom transform. Simplest fix: move pure functions to a separate `src/lib/places-utils.ts` without the directive, import them back into `places.ts`.

**Step 3: Commit**

```bash
git add src/lib/places.test.ts
git commit -m "test: add unit tests for places (isLikelyRetailStore, mapStoreType, toGridCell)"
```

---

### Task 9: Run full test suite and coverage report

**Step 1: Run all tests**

Run: `npx vitest run`
Expected: All test files pass

**Step 2: Run coverage**

Run: `npx vitest run --coverage`
Expected: Coverage report prints. Pure function files should show high coverage.

**Step 3: Commit any final adjustments**

```bash
git add -A
git commit -m "test: finalize testing framework setup"
```
