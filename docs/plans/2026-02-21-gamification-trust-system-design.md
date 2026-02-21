# Gamification & Trust System Design

## Goal

Incentivize user-generated sighting reports through visible gamification (leaderboards, badges) while protecting data integrity via trust scoring and corroboration. Make reporting free for all users to maximize data collection; keep heatmaps, alerts, and full history as premium features.

## Core Loop

1. Users report sightings at stores (free for all)
2. Reports get verified via corroboration or trust score
3. Verified reports earn points and badges
4. Points build trust, which unlocks auto-verification
5. More verified data = better heatmaps for everyone

## Trust Scoring

- New users start at trust score 0
- Points earned:
  - Report corroborated by another user: **+10**
  - Report admin-verified: **+5**
- Points lost:
  - Report flagged as inaccurate: **-15**
- At trust score **>= 50**, reports auto-verify (no admin or corroboration needed)
- Rate limit: max **10 reports per user per day**

## Corroboration

- When **2 different users** report the same product at the same store within a **4-hour window**, both reports auto-verify
- Both reporters receive corroboration points (+10 each)
- Matching logic: same `storeId` + same `productId` + `sightedAt` within 4 hours

## Public Gamification

### Leaderboard

- Public page at `/dashboard/leaderboard`
- Ranked by accuracy-weighted score: `(verifiedReports / totalReports) * trustScore`
- Shows top 25 reporters
- Monthly reset option for "Top Reporter of the Month"

### Badges

| Badge | Criteria |
|---|---|
| First Report | Submit your first sighting |
| Verified x10 | 10 verified reports |
| Verified x50 | 50 verified reports |
| Trusted Reporter | Reach trust score 50 (auto-verify unlocked) |
| Top Reporter | #1 on monthly leaderboard |
| Streak: 7 Days | 7 consecutive days with a verified report |
| Streak: 30 Days | 30 consecutive days with a verified report |

### User Profile

- Badge display
- Stats: total reports, verified reports, accuracy rate, current streak
- Trust level indicator (Newcomer / Contributor / Trusted / Top Reporter)

## Reporting Changes

- Move sighting submission from premium-only to **free for all authenticated users**
- Premium features remain: heatmaps, email alerts, full sighting history

## Schema Changes

### Modify `users` table

Add columns:
- `trustScore` (integer, default 0)
- `totalReports` (integer, default 0)
- `verifiedReports` (integer, default 0)
- `currentStreak` (integer, default 0)
- `lastReportDate` (date, nullable)

### New `reporter_badges` table

- `id` (uuid, PK)
- `userId` (text, FK → users.id)
- `badgeType` (enum: first_report, verified_10, verified_50, trusted_reporter, top_reporter, streak_7, streak_30)
- `earnedAt` (timestamp)

### Modify `restock_sightings` table

Add column:
- `corroboratedBy` (uuid, nullable, FK → restock_sightings.id) — links to the sighting that confirmed this one

## Architecture

- **Trust score updates**: Server action triggered after verification (admin or corroboration)
- **Corroboration check**: Runs when a new sighting is submitted — queries for matching unverified sightings within 4 hours
- **Badge awarding**: Checked after each trust score update — idempotent (won't re-award)
- **Streak tracking**: Updated on each report submission, reset if `lastReportDate` is more than 1 day ago
- **Leaderboard**: Server component with direct DB query, no caching needed at current scale

## Tech Stack

Same as existing: Next.js server actions, Drizzle ORM, Neon PostgreSQL. No new dependencies needed.
