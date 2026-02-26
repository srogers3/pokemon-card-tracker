# Tiered Box Opening & Data Decoupling Design

**Date:** 2026-02-26
**Status:** Approved

## Problem

Currently, boxes only open via auto-verify (trust ≥ 50), admin verification, or corroboration. Newer/lower-trust free users can have boxes stuck in "pending" indefinitely, which hurts the collecting experience without benefiting data quality.

## Solution

Decouple box opening (the collecting fun) from sighting verification (data quality). Premium users open boxes immediately on submit. Free users can manually open boxes after a 24-hour delay. Sighting verification remains tied to corroboration/admin — unchanged.

## Design

### 1. Box Opening Flow

**Premium users & auto-verify (trust ≥ 50):**
- `openBox()` called immediately during the submit action
- Reveal modal pops up on the map page right after submission

**Free users:**
- Box created as pending (current behavior)
- Collection page shows a countdown timer on pending boxes
- After 24 hours, an "Open" button appears on the pending box card
- Clicking "Open" calls `openPendingBox()` server action, which validates 24h has elapsed, opens the box, and triggers the reveal modal on the collection page

**Corroboration / admin verification:**
- Can still open any pending box early for both tiers
- Remains the only way to mark a sighting as `verified: true`

### 2. Rarity System Simplification

- Remove `RARITY_WEIGHTS` table tied to report status (`not_found`, `found`, `found_corroborated`)
- Star tier is the sole upgrade driver (20% green, 40% yellow, 60% purple)
- 2% shiny chance unchanged
- Simplify `openBox()` signature — drop the `corroborated` parameter

### 3. Unverified Sighting Visibility

**Map display:**
- Unverified sightings shown with visual flag (lighter opacity or "?" badge)
- Verified sightings shown normally

**Restock pattern analysis:**
- All sightings included in trend calculations regardless of verification status
- Patterns get a confidence indicator based on the ratio of verified vs unverified sightings

### 4. What's Not Changing

- Wild creature assignment at box creation
- Shiny chance (2%)
- Star tier mechanics
- Badge system
- Trust scoring
- Admin verification flow

## Key Files Affected

- `src/lib/boxes.ts` — openBox simplification, new openPendingBox function
- `src/app/dashboard/submit/actions.ts` — premium/auto-verify immediate open
- `src/lib/trust.ts` — remove corroborated param from openBox calls
- `src/app/dashboard/collection/page.tsx` — countdown timer, open button, reveal modal
- `src/app/map/` — reveal modal for premium users after submit
- `src/components/unbox-reveal-modal.tsx` — support map page context
- `src/lib/trends.ts` — confidence indicator on patterns
- Map components — visual flag for unverified sightings
