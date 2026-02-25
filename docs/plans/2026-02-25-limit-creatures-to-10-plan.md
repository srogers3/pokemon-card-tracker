# Limit Creatures to First 10 — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Limit the app to the first 10 creatures for testing, making the creature count dynamic so adding more later requires zero code changes.

**Architecture:** Truncate `CREATURE_DATA` to 10 entries, export a `TOTAL_CREATURES` constant derived from `CREATURE_DATA.length`, replace all hardcoded `151` references with that constant, and switch sprite URLs from `.svg` to `.png`.

**Tech Stack:** TypeScript, Next.js App Router (Server Components)

---

### Task 1: Truncate CREATURE_DATA and add TOTAL_CREATURES constant

**Files:**
- Modify: `src/db/creature-data.ts`

**Step 1: Remove creature entries 11–151**

Delete everything from line 26 (the `{ id: 11, ...` entry) through line 180 (the `{ id: 151, ...` entry), including the section comment headers. Keep only the first 10 entries (IDs 1–10) and the closing `];`.

The array should end like this after the edit:

```typescript
  { id: 10, name: "Blisterfang", type: "shelf", rarityTier: "common", description: "A feral creature that guards empty shelves. Its fangs are made of torn blister packaging, sharp enough to slice fingers." },
];
```

**Step 2: Export TOTAL_CREATURES constant**

Add this line immediately after the closing `];` of the `CREATURE_DATA` array:

```typescript
export const TOTAL_CREATURES = CREATURE_DATA.length;
```

**Step 3: Switch sprite URLs to .png**

Change `getSpriteUrl` and `getShinySpriteUrl` to return `.png` instead of `.svg`:

```typescript
export function getSpriteUrl(creatureId: number): string {
  return `/sprites/${creatureId}.png`;
}

export function getShinySpriteUrl(creatureId: number): string {
  return `/sprites/${creatureId}-shiny.png`;
}
```

**Step 4: Commit**

```bash
git add src/db/creature-data.ts
git commit -m "feat: limit creatures to first 10, export TOTAL_CREATURES, switch to .png sprites"
```

---

### Task 2: Replace hardcoded 151 with TOTAL_CREATURES in boxes.ts

**Files:**
- Modify: `src/lib/boxes.ts:261`

**Step 1: Add import**

Add `TOTAL_CREATURES` to the existing import from `@/db/creature-data` at the top of the file. Find the existing import line and add `TOTAL_CREATURES` to it.

**Step 2: Replace badge threshold**

Change line 261 from:

```typescript
  if (uniqueCaught >= 151 && !earned.has("cardboardex_complete")) {
```

to:

```typescript
  if (uniqueCaught >= TOTAL_CREATURES && !earned.has("cardboardex_complete")) {
```

**Step 3: Commit**

```bash
git add src/lib/boxes.ts
git commit -m "refactor: use TOTAL_CREATURES for cardboardex_complete badge threshold"
```

---

### Task 3: Replace hardcoded 151 in collection page

**Files:**
- Modify: `src/app/dashboard/collection/page.tsx:49,57`

**Step 1: Add import**

Add this import at the top of the file:

```typescript
import { TOTAL_CREATURES } from "@/db/creature-data";
```

**Step 2: Replace both occurrences**

Change line 49 from:

```tsx
          {uniqueCaught}/151 discovered
```

to:

```tsx
          {uniqueCaught}/{TOTAL_CREATURES} discovered
```

Change line 57 from:

```tsx
          style={{ width: `${(uniqueCaught / 151) * 100}%` }}
```

to:

```tsx
          style={{ width: `${(uniqueCaught / TOTAL_CREATURES) * 100}%` }}
```

**Step 3: Commit**

```bash
git add src/app/dashboard/collection/page.tsx
git commit -m "refactor: use TOTAL_CREATURES in collection progress display"
```

---

### Task 4: Replace hardcoded 151 in leaderboard page

**Files:**
- Modify: `src/app/dashboard/leaderboard/page.tsx:127,178`

**Step 1: Add import**

Add this import at the top of the file:

```typescript
import { TOTAL_CREATURES } from "@/db/creature-data";
```

**Step 2: Replace both occurrences**

Change line 127 from:

```tsx
                {cardboardexMap.get(currentUser.id) ?? 0}/151
```

to:

```tsx
                {cardboardexMap.get(currentUser.id) ?? 0}/{TOTAL_CREATURES}
```

Change line 178 from:

```tsx
                <TableCell>{cardboardexMap.get(reporter.id) ?? 0}/151</TableCell>
```

to:

```tsx
                <TableCell>{cardboardexMap.get(reporter.id) ?? 0}/{TOTAL_CREATURES}</TableCell>
```

**Step 3: Commit**

```bash
git add src/app/dashboard/leaderboard/page.tsx
git commit -m "refactor: use TOTAL_CREATURES in leaderboard cardboardex display"
```

---

### Task 5: Replace hardcoded 151 in sprites-review page

**Files:**
- Modify: `src/app/sprites-review/page.tsx:59`

**Step 1: Add import**

Add this import at the top of the file:

```typescript
import { TOTAL_CREATURES } from "@/db/creature-data";
```

**Step 2: Replace both occurrences on line 59**

Change:

```tsx
          {totalPng}/151 normal sprites generated &bull; {totalShiny}/151 shiny
```

to:

```tsx
          {totalPng}/{TOTAL_CREATURES} normal sprites generated &bull; {totalShiny}/{TOTAL_CREATURES} shiny
```

**Step 3: Commit**

```bash
git add src/app/sprites-review/page.tsx
git commit -m "refactor: use TOTAL_CREATURES in sprite review counts"
```

---

### Task 6: Fix test-hatch mock data

**Files:**
- Modify: `src/app/test-hatch/page.tsx:7-12`

**Step 1: Replace mock data with creature IDs in range 1-10**

Replace the entire `MOCK_OPENINGS` array with creatures that exist in the first 10. Use `.png` for sprite URLs:

```typescript
const MOCK_OPENINGS = [
  { id: "1", creatureName: "Blisterfang", creatureId: 10, rarityTier: "common" as const, spriteUrl: "/sprites/10.png", isShiny: false, wasUpgrade: false, wildCreatureName: null },
  { id: "2", creatureName: "Cashrath", creatureId: 6, rarityTier: "uncommon" as const, spriteUrl: "/sprites/6.png", isShiny: false, wasUpgrade: false, wildCreatureName: null },
  { id: "3", creatureName: "Baydrake", creatureId: 8, rarityTier: "uncommon" as const, spriteUrl: "/sprites/8.png", isShiny: true, wasUpgrade: false, wildCreatureName: null },
  { id: "4", creatureName: "Stocklit", creatureId: 1, rarityTier: "uncommon" as const, spriteUrl: "/sprites/1.png", isShiny: false, wasUpgrade: true, wildCreatureName: "Facelisk" },
  { id: "5", creatureName: "Scannit", creatureId: 4, rarityTier: "uncommon" as const, spriteUrl: "/sprites/4.png", isShiny: false, wasUpgrade: false, wildCreatureName: null },
  { id: "6", creatureName: "Planogor", creatureId: 3, rarityTier: "uncommon" as const, spriteUrl: "/sprites/3.png", isShiny: true, wasUpgrade: true, wildCreatureName: "Docklet" },
];
```

**Step 2: Commit**

```bash
git add src/app/test-hatch/page.tsx
git commit -m "fix: update test-hatch mock data to use creature IDs 1-10 with .png sprites"
```

---

### Task 7: Update schema comment

**Files:**
- Modify: `src/db/schema.ts:164`

**Step 1: Update comment**

Change:

```typescript
  id: integer("id").primaryKey(), // Creature index (1-151)
```

to:

```typescript
  id: integer("id").primaryKey(), // Creature index (dynamic, see CREATURE_DATA)
```

**Step 2: Commit**

```bash
git add src/db/schema.ts
git commit -m "docs: update schema comment to reflect dynamic creature count"
```

---

### Task 8: Verify build

**Step 1: Run lint**

```bash
npm run lint
```

Expected: No errors related to our changes.

**Step 2: Run build**

```bash
npm run build
```

Expected: Build succeeds. No type errors or missing imports.

**Step 3: Commit any lint fixes if needed**
