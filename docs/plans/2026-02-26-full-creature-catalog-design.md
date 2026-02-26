# Full 151 Creature Catalog + Intrinsic Rarity — Design Document

**Date:** 2026-02-26
**Status:** Approved

## Overview

Expand `CREATURE_DATA` from 10 to all 151 creatures and fix the wild creature rarity system so each creature has an intrinsic, permanent rarity tier. The map only shows creatures with finished PNG sprites (currently 1-20), gated by a `MAX_SPRITE_ID` constant.

## Problem

1. `CREATURE_DATA` only contains entries 1-10, but sprites exist for 1-20.
2. Wild creature rarity is rolled independently of the creature — the same creature appears with different colored borders (common grey at one store, ultra_rare red at another) because the system falls back to all creatures when no creatures match the rolled tier.

## Solution

### 1. Creature-Intrinsic Rarity

Each creature's `rarityTier` is permanent and determines its border color on the map. The wild creature encounter system rolls which rarity tier to spawn (weighted 60/25/12/3), then picks a random creature from that tier's pool.

### 2. Rarity Distribution (151 creatures)

| Tier | Count | Encounter Weight | Creatures |
|------|-------|-----------------|-----------|
| Common | ~60 | 60% | Basic creatures, early entries in each type range |
| Uncommon | ~50 | 25% | Mid-tier, starters (1-9), interesting abilities |
| Rare | ~28 | 12% | Evolved/Prime forms, powerful creatures |
| Ultra Rare | ~13 | 3% | Corporate apex + most fearsome creatures |

#### Assignment Principles
- **Common:** Base forms, simple creatures, early IDs in each type range
- **Uncommon:** Starters, mid-evolution, creatures with distinct personality
- **Rare:** "Prime" / "Max" / evolved suffixes, type-defining creatures
- **Ultra Rare:** Corporate (141-151), final evolutions of major lines, most fearsome names

#### Specific Assignments

**Common (~60):**
10-Blisterfang, 12-Pegloom, 17-Overstockle, 19-Facelace, 25-Stockroach, 26-Dustmire, 28-Hangtail,
30-Dockrake, 32-Cratejaw, 33-Truckulus, 37-Shrinkhorn, 40-Stackjaw, 41-Bayleech, 44-Skidmaw, 46-Cartonix, 47-Boxeon,
50-Tilltomb, 53-Couponyx, 55-Taxling, 56-Voidchange, 57-Pinpadra, 61-Changelisk, 63-Changegeist, 64-Priceflare,
70-Scalpizard, 74-Refreshion, 77-Flipfang, 79-Markupine, 84-Cancelisk, 86-Waitlistor, 87-Cartjackal,
90-Hypewyrm, 92-Viralope, 93-Leakwyrm, 94-Dropfang, 96-Paniclaw, 99-Adstorm, 103-Rumblecart,
110-Clearadon, 112-Rollbacken, 113-Discountaur, 114-Clearance Wisp, 116-Markdownix, 117-Tagwraith, 118-Labelurk, 119-Salegeist, 120-Understockle, 121-Overstackle, 122-Shrinklurk, 123-Returnoid, 124-Dustgloom,
130-Backstockadon, 132-Clerkshade, 133-Raftergeist, 134-Baygoyle

**Uncommon (~50):**
1-Stocklit, 2-Facelisk, 3-Planogor, 4-Scannit, 5-Tillimp, 6-Cashrath, 7-Docklet, 8-Baydrake, 9-Forklord Minor,
11-Grandblister, 13-Endcapra, 14-Promoctaur, 15-Cartivore, 18-Shelf Impaler, 20-Aislefiend, 22-Velcraptor, 23-Labelisk, 27-Dustmourn,
31-Dockrake Prime, 34-Truckalisk, 35-Manifestor, 38-Palletusk, 45-Liftrune, 48-Wraptor,
51-Tillreign, 52-Scanraith, 58-Swipegeist, 59-Declinodon, 62-POSpire, 65-Tickerjaw, 67-Subtotem, 68-Auditron,
72-Botwyrm, 75-Snagoyle, 80-Stockviper, 81-Bulkbeast, 83-Rafflotaur, 85-Outofstockra, 88-Inflatradon,
91-Trendragon, 97-FOMOgre, 100-Sirenstock, 101-Blackfright, 104-Crowdrake, 105-Queuephantom, 107-Speculatron, 108-Flashfang,
115-Bargraith, 125-Pricegeist, 127-Marginox, 129-Tallyshade,
131-Overlordstock, 135-Planogrammon, 137-Fulfillisk, 138-Deliveraith

**Rare (~28):**
16-Cartitan, 21-Aisle Tyrant, 24-Labelisk Prime, 29-Shelfquake,
36-Manifestor Prime, 39-Palleteus, 42-Forkliftitan, 43-Overnox, 49-Shrinkwrath,
54-Couponyx Prime, 60-Declinodon Max, 66-Rebaterex, 69-Audititan,
71-Scalpizard Prime, 73-Botwyrm Apex, 76-Queuezilla, 78-Flipfang Elite, 82-Bulkbeast Goliath, 89-Speculisk,
95-Dropzilla, 98-FOMOgre Prime, 102-Doorcrashra, 106-Dropocalypse, 109-Bundlord,
111-Clearaclysm, 126-Pricegeist Supreme, 128-Changelord,
136-Planogod, 139-Stockfinity, 140-Retailisk

**Ultra Rare (~13):**
141-Palleteus Prime, 142-Forklord, 143-Barcodon Omega, 144-Cartaclysm, 145-Shelfus Rex, 146-Grand Aisle, 147-Scarcityra, 148-Retailoth, 149-Hoardlord, 150-Restock Eternis, 151-Logistigon

### 3. `MAX_SPRITE_ID` Gate

```typescript
export const MAX_SPRITE_ID = 20;
```

- `wild-creature.ts` filters to `CREATURE_DATA.filter(c => c.id <= MAX_SPRITE_ID)` before selecting
- Collection page shows all 151 (greyed out if uncaught, SVG fallback if no PNG)
- Bump this constant as new sprites are added

### 4. Wild Creature Algorithm Change

Current (broken):
1. Roll rarity tier (60/25/12/3)
2. Filter creatures by tier → if empty, fall back to ALL creatures
3. Pick random creature → border color = rolled tier (not creature's tier)

New (fixed):
1. Filter pool to `id <= MAX_SPRITE_ID`
2. Roll rarity tier (60/25/12/3)
3. Filter pool by tier → if empty, pick nearest available tier
4. Pick random creature → border color = **creature's `rarityTier`**

## Files Changed

| File | Change |
|------|--------|
| `src/db/creature-data.ts` | Add 141 creature entries, add `MAX_SPRITE_ID` constant |
| `src/lib/wild-creature.ts` | Filter by `MAX_SPRITE_ID`, use creature's intrinsic rarity for display |
| `src/app/dashboard/collection/page.tsx` | Use `TOTAL_CREATURES` (now 151), handle SVG fallback |

## Out of Scope

- Generating new sprite PNGs beyond 1-20
- Changing the unbox/box rarity system (that's separate from wild creatures)
- Evolution chains or creature relationships
