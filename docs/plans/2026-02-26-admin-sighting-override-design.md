# Admin Sighting Limit Override (Dev Only)

## Problem
Admins need to submit multiple sightings at the same store during development/testing, but two limits block this:
- 1 sighting per store per day per user
- 10 sightings per day per user

## Design
Add a `skipSightingLimits` flag to the existing `DevOverrides` system. When enabled, both limits are bypassed. Dev-only — returns `false` in production.

## Changes

### 1. `src/lib/dev.ts`
- Add `skipSightingLimits: boolean` to `DevOverrides` type and defaults
- Read from cookie `dev_skip_sighting_limits`

### 2. `src/app/dashboard/submit/actions.ts`
- When `devOverrides.skipSightingLimits` is true, skip both `canSubmitReport()` and `hasSubmittedToStoreToday()` checks

### 3. Dev panel UI
- Add a toggle for "Skip sighting limits" alongside existing dev toggles
