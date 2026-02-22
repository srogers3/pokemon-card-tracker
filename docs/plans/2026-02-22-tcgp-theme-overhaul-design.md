# TCGP-Inspired Theme Overhaul Design

**Date:** 2026-02-22
**Status:** Approved

## Overview

Full visual overhaul of the Pokemon Card Tracker to match the aesthetic of the Pokemon TCG Pocket (TCGP) app. Replacing the current neutral/monochrome shadcn theme with a light lavender palette, rounded game-like UI, and CSS visual effects (shimmer, glow, gradients).

No dark mode — light lavender only, matching TCGP's airy pastel style.

## Color System

Replace all OKLCH neutral tokens in `globals.css` with TCGP-inspired colors.

### Core Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `background` | Gradient `#ede5f7` → `#f5f0ff` | Page backgrounds |
| `card` | `#ffffff` | Card surfaces |
| `card` shadow | `rgba(124, 92, 191, 0.08)` | Soft purple shadow on cards |
| `primary` | `#7c5cbf` | Buttons, active states, links |
| `primary-foreground` | `#ffffff` | Text on primary |
| `secondary` | `#f0eaf8` | Secondary buttons, subtle backgrounds |
| `accent` | `#4db8b0` (teal/mint) | Secondary actions, timers, CTA pills |
| `accent-foreground` | `#ffffff` | Text on accent |
| `highlight` | `#d4a843` (gold) | Points, rewards, premium, verified |
| `destructive` | `#ef5350` (coral) | Errors, "not found" status |
| `border` | `#d8ccec` | All borders |
| `muted` | `#f0eaf8` | Subtle backgrounds |
| `muted-foreground` | `#8b7fa0` | Secondary text |
| `foreground` | `#2d2d3f` | Body text |
| `ring` | `#7c5cbf` | Focus rings |
| `input` | `#e4daf2` | Input borders |

### Energy-Type Colors (for Pokemon type indicators)

| Type | Hex |
|------|-----|
| Fire | `#f97316` |
| Water | `#3b82f6` |
| Grass | `#22c55e` |
| Electric | `#eab308` |
| Psychic | `#a855f7` |
| Fighting | `#b45309` |
| Normal | `#9ca3af` |

### Chart Colors

Update chart tokens to use purple/teal/gold family for data visualizations.

## Typography

- Replace **Inter** with **Nunito** from Google Fonts
- Nunito is rounder, friendlier, and matches TCGP's softer feel
- Bump heading weights to `bold` (700) more consistently
- Keep existing size hierarchy

## Border Radius

- Increase `--radius` from `0.625rem` to `0.75rem`
- Cards and major containers: `1rem`
- Buttons: pill shape (`rounded-full`) for primary CTAs, `rounded-lg` for secondary
- Badges: always `rounded-full`

## Component Changes

### Cards
- White background with soft purple box-shadow
- Lavender border (`border-border`)
- Increased border-radius to `1rem`

### Buttons
- **Primary:** Purple with subtle gradient (`#7c5cbf` → `#6a4dab`), white text, glow on hover
- **Accent/CTA:** Teal pill shape (`rounded-full`), like TCGP's "Next" button
- **Ghost:** Purple tint on hover (`bg-muted`)
- **Destructive:** Coral red

### Badges/Pills
- Always `rounded-full` pill shape
- New semantic variants:
  - `found`: teal background
  - `not-found`: coral background
  - `new`: coral with pulse animation
  - `verified`: gold background
  - `timer`: teal outline
  - `rarity-common`: gray
  - `rarity-uncommon`: green
  - `rarity-rare`: blue
  - `rarity-ultra-rare`: purple with shimmer

### Navigation
- Keep top navigation layout
- Lavender background tint on header
- Active link: purple pill background indicator
- Add subtle bottom border in lavender

### Tables
- Alternating row tint: white / pale lavender
- Row hover: slightly deeper lavender

## Visual Effects (CSS-only)

### Page Background Gradient
```css
background: linear-gradient(180deg, #ede5f7 0%, #f5f0ff 50%, #f8f5ff 100%);
```

### Card Hover
```css
.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(124, 92, 191, 0.15);
  transition: all 0.2s ease;
}
```

### Holographic Shimmer (for shiny Pokemon & special cards)
```css
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
.shimmer {
  background: linear-gradient(
    110deg,
    transparent 25%,
    rgba(255, 255, 255, 0.4) 37%,
    transparent 63%
  );
  background-size: 200% 100%;
  animation: shimmer 2.5s ease-in-out infinite;
}
```

### Gold Glow (for verified, premium, eggs)
```css
.gold-glow {
  box-shadow: 0 0 12px rgba(212, 168, 67, 0.3);
}
```

### NEW Badge Pulse
```css
@keyframes pulse-badge {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}
.badge-new {
  animation: pulse-badge 2s ease-in-out infinite;
}
```

### Egg Float Animation
```css
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}
.egg-float {
  animation: float 3s ease-in-out infinite;
}
```

### Pokemon Card Uncaught State
```css
.pokemon-uncaught {
  filter: grayscale(1) opacity(0.5);
  border: 2px dashed var(--border);
}
```

## Page-Specific Treatments

### Landing Page
- Full lavender gradient background on hero
- Feature cards with subtle type-colored left border accent
- CTA buttons: teal pill style
- Recent sightings cards with status-colored badges

### Dashboard / Sightings
- Table with alternating lavender/white rows
- "Found" status: teal pill badge
- "Not Found" status: coral pill badge
- Verified indicator: gold checkmark
- Premium teaser card: gold border + subtle glow

### Collection Page
- Pokemon grid cards with type-colored top border
- Caught: full color + subtle glow on hover
- Uncaught: grayscale + dashed border
- Shiny: holographic shimmer overlay
- Eggs: gold glow + float animation
- Progress bar: purple fill with gradient

### Leaderboard
- Top 3 rows: gold (#d4a843) / silver (#a8a8b0) / bronze (#cd7f32) left border accent
- Trust score: purple-filled progress indicator
- Badges displayed as colorful pills in a flex row

## Files to Modify

1. `src/app/globals.css` — Color tokens, animations, utility classes
2. `src/app/layout.tsx` — Font swap (Inter → Nunito)
3. `src/app/page.tsx` — Landing page styling
4. `src/app/dashboard/layout.tsx` — Dashboard background
5. `src/app/dashboard/page.tsx` — Sightings table styling
6. `src/app/dashboard/collection/page.tsx` — Pokemon grid effects
7. `src/app/dashboard/leaderboard/page.tsx` — Leaderboard accents
8. `src/components/site-header.tsx` — Nav theming
9. `src/components/dashboard-nav.tsx` — Active link pills
10. `src/components/ui/button.tsx` — Button variant updates
11. `src/components/ui/badge.tsx` — New badge variants
12. `src/components/ui/card.tsx` — Shadow/radius updates
13. Various page files for specific treatments

## Out of Scope

- Dark mode (single light theme only)
- Custom illustrations or image assets
- Bottom tab navigation (keep top nav, restyle it)
- JavaScript animation libraries (CSS-only effects)
- Custom Pokemon sprites/artwork
