# Testing Framework Design

## Decision

Vitest for unit testing pure business logic. No component tests, DB mocking, E2E, or CI in this phase.

## Setup

- **Packages:** `vitest`, `@vitest/coverage-v8`
- **Config:** `vitest.config.ts` at project root with `@/` path alias → `src/`
- **Scripts:** `npm run test`, `npm run test:coverage`
- **Convention:** `*.test.ts` colocated next to source files

## Test Targets

All pure functions with no DB or external API dependencies:

| File | Functions |
|---|---|
| `src/lib/utils.ts` | `getDistanceMeters`, `timeAgo`, `cn` |
| `src/lib/trends.ts` | `analyzeTrends`, `getGrade`, `getBestDay`, `getBestTimeWindow`, `getBarPercent` |
| `src/lib/wild-creature.ts` | `simpleHash`, `getWildCreature` |
| `src/lib/trust.ts` | `shouldAutoVerify` |
| `src/lib/boxes.ts` | `rollRarity`, `rollUpgradeTier`, `rollRandomCreature`, `getCardboardexCompletion` |
| `src/lib/places.ts` | `isLikelyRetailStore`, `mapStoreType`, `toGridCell` |

## Out of Scope

- Component tests (`@testing-library/react`, `jsdom`)
- DB integration tests (Drizzle mocking)
- E2E tests (Playwright)
- CI pipeline (GitHub Actions)
- Server action tests (require auth + DB mocking)
