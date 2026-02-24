# Cardboard Creatures Pivot — Design Document

**Date:** 2026-02-24
**Status:** Approved

## Overview

Pivot the app from Pokemon branding to original "Cardboard Creatures" — 151 retail-themed parody creatures with custom pixel art sprites, flavor descriptions, and retail-themed mechanics. This eliminates all Pokemon IP dependencies and establishes a unique brand identity.

## Brand Rename

| Old | New |
|-----|-----|
| Pokemon Card Tracker | **Cardboard Tracker** |
| Pokemon (creature noun) | **Creature** (collectively: "Cardboard Creatures") |
| Pokedex | **Cardboardex** |
| Pokeball map marker | **Box / Stacked Boxes / Pallet** (cluster density) |
| Egg hatching | **Unboxing** (sealed box → unbox → creature reveal) |
| Wild Pokemon | **Wild Creature** |
| Trainer | **Scout** or **Reporter** (already used in trust system) |

## Creature Catalog

### Types (9 total)

| Type | Index Range | Count | Description |
|------|-------------|-------|-------------|
| Starter | 001–009 | 9 | Entry-level creatures new scouts encounter first |
| Shelf | 010–029 | 20 | Creatures that inhabit store shelving and displays |
| Logistics | 030–049 | 20 | Warehouse, shipping, and supply chain creatures |
| Checkout | 050–069 | 20 | Point-of-sale and transaction creatures |
| Scalper | 070–089 | 20 | Reseller and market manipulation creatures |
| Hype | 090–109 | 20 | Trend, FOMO, and viral marketing creatures |
| Clearance | 110–129 | 20 | Discount, markdown, and dead stock creatures |
| Backroom | 130–140 | 11 | Storage, fulfillment, and inventory management creatures |
| Corporate | 141–151 | 11 | The apex retail overlords (was "Mythic Retail Type") |

### Rarity Tiers (unchanged from current system)

- **Common** — frequently encountered
- **Uncommon** — moderately rare
- **Rare** — hard to find
- **Ultra Rare** — extremely scarce

Type and rarity are **independent**. Any type can have any rarity. Rarity assignment per creature will be defined in the data file.

### Full Creature Roster

**001–009 Starter**
1. Stocklit
2. Facelisk
3. Planogor
4. Scannit
5. Tillimp
6. Cashrath
7. Docklet
8. Baydrake
9. Forklord Minor

**010–029 Shelf**
10. Blisterfang
11. Grandblister
12. Pegloom
13. Endcapra
14. Promoctaur
15. Cartivore
16. Cartitan
17. Overstockle
18. Shelf Impaler
19. Facelace
20. Aislefiend
21. Aisle Tyrant
22. Velcraptor
23. Labelisk
24. Labelisk Prime
25. Stockroach
26. Dustmire
27. Dustmourn
28. Hangtail
29. Shelfquake

**030–049 Logistics**
30. Dockrake
31. Dockrake Prime
32. Cratejaw
33. Truckulus
34. Truckalisk
35. Manifestor
36. Manifestor Prime
37. Shrinkhorn
38. Palletusk
39. Palleteus
40. Stackjaw
41. Bayleech
42. Forkliftitan
43. Overnox
44. Skidmaw
45. Liftrune
46. Cartonix
47. Boxeon
48. Wraptor
49. Shrinkwrath

**050–069 Checkout**
50. Tilltomb
51. Tillreign
52. Scanraith
53. Couponyx
54. Couponyx Prime
55. Taxling
56. Voidchange
57. Pinpadra
58. Swipegeist
59. Declinodon
60. Declinodon Max
61. Changelisk
62. POSpire
63. Changegeist
64. Priceflare
65. Tickerjaw
66. Rebaterex
67. Subtotem
68. Auditron
69. Audititan

**070–089 Scalper**
70. Scalpizard
71. Scalpizard Prime
72. Botwyrm
73. Botwyrm Apex
74. Refreshion
75. Snagoyle
76. Queuezilla
77. Flipfang
78. Flipfang Elite
79. Markupine
80. Stockviper
81. Bulkbeast
82. Bulkbeast Goliath
83. Rafflotaur
84. Cancelisk
85. Outofstockra
86. Waitlistor
87. Cartjackal
88. Inflatradon
89. Speculisk

**090–109 Hype**
90. Hypewyrm
91. Trendragon
92. Viralope
93. Leakwyrm
94. Dropfang
95. Dropzilla
96. Paniclaw
97. FOMOgre
98. FOMOgre Prime
99. Adstorm
100. Sirenstock
101. Blackfright
102. Doorcrashra
103. Rumblecart
104. Crowdrake
105. Queuephantom
106. Dropocalypse
107. Speculatron
108. Flashfang
109. Bundlord

**110–129 Clearance**
110. Clearadon
111. Clearaclysm
112. Rollbacken
113. Discountaur
114. Clearance Wisp
115. Bargraith
116. Markdownix
117. Tagwraith
118. Labelurk
119. Salegeist
120. Understockle
121. Overstackle
122. Shrinklurk
123. Returnoid
124. Dustgloom
125. Pricegeist
126. Pricegeist Supreme
127. Marginox
128. Changelord
129. Tallyshade

**130–140 Backroom**
130. Backstockadon
131. Overlordstock
132. Clerkshade
133. Raftergeist
134. Baygoyle
135. Planogrammon
136. Planogod
137. Fulfillisk
138. Deliveraith
139. Stockfinity
140. Retailisk

**141–151 Corporate**
141. Palleteus Prime
142. Forklord
143. Barcodon Omega
144. Cartaclysm
145. Shelfus Rex
146. Grand Aisle
147. Scarcityra
148. Retailoth
149. Hoardlord
150. Restock Eternis
151. Logistigon

## Sprites

- **Style:** Pixel art, GBA-era aesthetic, ~96x96px
- **Format:** PNG with transparent background
- **Hosting:** `/public/sprites/{id}.png` (self-hosted, no external CDN)
- **Shiny variants:** `/public/sprites/{id}-shiny.png` (palette-swapped versions)
- **Generation method:** AI image generation from per-creature descriptive prompts
- **`getSpriteUrl(id)` function** returns `/sprites/${id}.png` instead of PokeAPI URLs

## Unboxing System (was Egg Hatching)

### Terminology Mapping

| Old | New |
|-----|-----|
| Egg | **Sealed Box** |
| Hatch / Hatched | **Unbox / Unboxed** |
| Egg sprite | **Sealed box icon** |
| "Your egg hatched into X!" | **"You unboxed a [Name]!"** |
| `pokemon_eggs` table | **`creature_boxes`** table |
| `hatched` column | **`opened`** column |
| `createEgg()` | **`createBox()`** |
| `hatchEgg()` | **`openBox()`** |
| Egg hatch modal | **Unbox reveal modal** |
| `EggHatchModal` component | **`UnboxRevealModal`** component |

### Mechanic (unchanged logic)

- Each sighting report creates a sealed box
- Box rarity based on report status (same formula)
- 2% shiny chance (unchanged)
- Base creature assigned at creation with upgrade chance (5-35%) at unbox
- Wild creature at each store determined by daily hash (same algorithm)

## Map Markers

### Cluster Density Icons

| Density | Icon | Description |
|---------|------|-------------|
| 1–2 stores | Single cardboard box | Small, simple box icon |
| 3–5 stores | Stacked boxes | 2-3 boxes stacked |
| 6+ stores | Pallet with boxes | Full pallet loaded with boxes |

These replace the current Pokeball/Great Ball/Ultra Ball/Master Ball progression.

### Store Pin Behavior

- Individual store pins show the wild creature sprite (same as current)
- Tap to see store detail with creature info
- "Your scout already checked this location today!" (was "Your Trainer already scouted...")
- "Come back tomorrow — a new creature might be waiting."

## Database Migration

### Table Renames

| Old | New |
|-----|-----|
| `pokemon_catalog` | `creature_catalog` |
| `pokemon_eggs` | `creature_boxes` |

### Enum Changes

| Old | New |
|-----|-----|
| `pokemon_rarity` enum | `creature_rarity` enum (same values: common/uncommon/rare/ultra_rare) |
| Badge: `pokedex_50` | `cardboardex_50` |
| Badge: `pokedex_complete` | `cardboardex_complete` |

### New Column

- `creature_catalog.type` — text enum: starter, shelf, logistics, checkout, scalper, hype, clearance, backroom, corporate

### Column Renames in `creature_boxes` (was `pokemon_eggs`)

| Old | New |
|-----|-----|
| `pokemonId` | `creatureId` |
| `wildPokemonId` | `wildCreatureId` |
| `hatched` | `opened` |

## Files Affected (~23 files)

### Data Layer
- `src/db/schema.ts` — table/enum renames, new type column
- `src/db/pokemon-data.ts` → `src/db/creature-data.ts` — full replacement with 151 creatures + types + rarity + descriptions
- `src/db/seed.ts` — import/reference updates
- New migration file in `drizzle/`

### Business Logic
- `src/lib/eggs.ts` → `src/lib/boxes.ts` — rename all functions, variables, types
- `src/lib/wild-pokemon.ts` → `src/lib/wild-creature.ts` — rename concept
- `src/lib/badges.ts` — badge name updates
- `src/lib/email.ts` — sender display name
- `src/lib/places.ts` — search keyword update

### Components
- `src/components/egg-hatch-modal.tsx` → `unbox-reveal-modal.tsx`
- `src/components/map/pokeball-marker.tsx` → `cluster-marker.tsx`
- `src/components/map/store-detail-panel.tsx` — copy updates
- `src/components/site-header.tsx` — app name

### Pages
- `src/app/layout.tsx` — metadata
- `src/app/page.tsx` — landing copy
- `src/app/dashboard/collection/page.tsx` — heading, progress, grid
- `src/app/dashboard/leaderboard/page.tsx` — badge labels, columns
- `src/app/dashboard/layout.tsx` — modal import
- `src/app/dashboard/submit/actions.ts` — wild creature references
- `src/app/test-hatch/page.tsx` — mock data update

### Styles
- `src/app/globals.css` — rename `pokemon-reveal` → `creature-reveal`, `pokemon-caught` → `creature-caught`, etc.

### Assets
- `/public/sprites/` — 151 creature sprites + 151 shiny variants (302 images total)
- Cluster marker icons (box, stacked boxes, pallet)

## Pixel Art Prompt Template

For AI generation of all 151 sprites:

```
Pixel art sprite, 96x96, transparent background, GBA Pokemon style.
[Creature-specific description: appearance, materials, pose, personality].
[Type-specific color palette cues].
Clean pixel outlines, limited palette, front-facing game sprite pose.
```

Shiny variants use the same prompt with "alternate color palette, shiny/metallic/iridescent coloring" appended.

## Out of Scope

- Energy type system (fire/water/grass colors in CSS) — remove or repurpose later
- Battle/combat mechanics — not part of current app
- Evolution chains — creatures with "Prime"/"Max"/"Apex" suffixes are separate catalog entries, not evolutions
- Sound effects for unboxing
