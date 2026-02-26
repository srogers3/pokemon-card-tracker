# Dashboard Landing Page Design

## Date: 2026-02-25

## Problem

`/dashboard` currently renders only the StoreMap component. There's no personal hub showing the user their stats, progress, or next actions. The map should live at its own route.

## Solution

Replace `/dashboard` with a personal overview page. Move the map to `/dashboard/map`.

## Design

### Route Changes

- `/dashboard` → new landing page (this design)
- `/dashboard/map` → new route, receives current map page code
- `DashboardNav` updated: first link becomes "Home" pointing to `/dashboard`, "Map" link points to `/dashboard/map`

### Page Sections (single column, mobile-first)

**Section 1: Stats Bar**
Four compact stat chips in a horizontal row:
- 🔥 Streak: `{currentStreak}d`
- ⭐ Trust: `{trustScore}`
- 📋 Reports: `{totalReports}`
- ✅ Accuracy: `{verifiedReports / totalReports}%`

All sourced from the `users` table — no extra queries, just the current user record.

**Section 2: Quick Action**
Single prominent "Open Map" button linking to `/dashboard/map`.

**Section 3: Pending Boxes Teaser** (conditional — only if pending boxes exist)
Compact card showing count: "You have **N boxes** waiting to open!" with a link to `/dashboard/collection`. Not the full grid, just the count.

**Section 4: Collection Progress** (compact)
Small progress bar with `{uniqueCaught}/{TOTAL_CREATURES} discovered` and a link to the full Collection page. Reuses `getCardboardexCompletion()` from `lib/boxes.ts`.

**Section 5: Recent Badges** (conditional — only if badges exist)
List of earned badges with earned dates. Links to leaderboard.

### Data Fetching

All server-side in one page component:
- `requireUser()` → user record has stats (trustScore, totalReports, verifiedReports, currentStreak)
- `getUserCollection(user.id)` → filter for pending boxes count + pass to `getCardboardexCompletion()`
- Query `reporter_badges` table for user's badges

### What This Page Does NOT Have

- No sightings feed (that's `/dashboard/sightings`)
- No full creature grid (that's `/dashboard/collection`)
- No map (that's `/dashboard/map`)
- No report form (reporting requires proximity check via the map)

### Differentiation from Other Pages

| Page | Purpose |
|------|---------|
| Landing (this) | Personal hub: your stats, your progress, your next action |
| Sightings | Browse reports: nearby + all recent feeds |
| Collection | Full creature grid: catch details, transfers, upgrades |
| Map | Geographic view: store locations, report from nearby |
