# Restock Trends Design

## Problem

Users have no way to identify restock patterns at stores. The app collects sighting data but doesn't surface trends like which day of the week or time of day restocks typically happen.

## Approach

Query-time analysis with progressive display. No new tables — query verified `found` sightings at render time, compute patterns server-side. Show a frequency grade always, and day/time patterns when enough data exists.

## Data Layer

### Server Action

`getStoreTrends(storeId)` in `src/app/dashboard/actions.ts`. Queries all verified `found` sightings for the store (full history, no time limit). Returns raw `sightedAt` dates.

### Analysis Function

`analyzeTrends(sightings: Date[])` in new file `src/lib/trends.ts`. Returns:

```ts
interface RestockTrend {
  grade: "hot" | "warm" | "cool" | "cold";
  avgDaysBetween: number | null;
  totalSightings: number;
  bestDay: string | null;       // e.g. "Tuesdays"
  bestTimeWindow: string | null; // e.g. "morning"
  confidence: "low" | "medium" | "high";
}
```

### Confidence Tiers

- **Low (<3 verified sightings):** Grade only, no day/time patterns
- **Medium (3-4 sightings):** Grade + tentative best day (if mode day-of-week has 2+ occurrences)
- **High (5+ sightings):** Grade + best day + best time window (if 3+ in same bucket)

### Frequency Grade

Based on average days between verified `found` restocks:

| Grade | Avg Days Between | Bar Fill | Icon |
|-------|-----------------|----------|------|
| Hot   | < 3 days        | 80-100%  | fire |
| Warm  | 3-7 days        | 50-79%   | sun  |
| Cool  | 7-14 days       | 25-49%   | moon |
| Cold  | > 14 days or <3 points in 30 days | 0-24% | ice |

### Time Buckets

- Morning: 6am-12pm
- Afternoon: 12pm-5pm
- Evening: 5pm-9pm
- Sightings outside these ranges ignored for time pattern (likely data entry timing, not actual restock time)

### Data Quality

Only verified sightings with `status = "found"` count. This includes auto-verified (trusted users) and corroborated reports.

## UI — Store Detail Panel

Placed between "Quick stats" row and "Recent Sightings" list. Fetched on-demand when panel opens via server action (not preloaded for all stores).

### Low Confidence Display

```
Restock Intel          Not enough data
[empty bar]            Need 3+ verified reports
```

### Medium/High Confidence Display

```
Restock Intel          🔥 Hot
[████████░░]           Restocks every ~2 days
                       Tuesdays, morning
```

The day line only appears if mode day-of-week has 2+ occurrences. The time window only appears at high confidence (5+ sightings, 3+ in same time bucket).

## Files Changed

| File | Change |
|------|--------|
| `src/lib/trends.ts` | New file — `analyzeTrends()` function |
| `src/app/dashboard/actions.ts` | Add `getStoreTrends(storeId)` server action |
| `src/components/map/store-detail-panel.tsx` | Add trend display section, fetch trends on mount |
| `src/components/map/store-map.tsx` | Pass storeId for lazy trend fetching |
