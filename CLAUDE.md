# Pokemon Card Tracker - CLAUDE.md

## What This Project Is

A community-driven Pokemon TCG restock tracker. Users report store inventory sightings, earn trust scores, hatch Pokemon eggs as rewards, and view restock patterns on an interactive map. Built for Vercel deployment.

## Tech Stack

- **Framework:** Next.js 16 (App Router, Server Components, Server Actions)
- **Language:** TypeScript 5
- **Database:** Neon PostgreSQL via Drizzle ORM
- **Auth:** Clerk (JWT + webhook-based user sync)
- **Payments:** Stripe (free/premium subscription tiers)
- **Email:** Resend
- **Maps:** Google Maps API + @vis.gl/react-google-maps
- **UI:** Tailwind CSS 4, shadcn/ui, Radix primitives, Lucide icons
- **Toasts:** Sonner

## Commands

```bash
npm run dev            # Start dev server (localhost:3000)
npm run build          # Production build
npm run lint           # ESLint
npm run db:generate    # Generate Drizzle migrations from schema
npm run db:push        # Push schema directly (dev)
npm run db:migrate     # Run migrations (production, uses tsx)
npm run db:seed        # Seed stores, products, Pokemon catalog
npm run db:studio      # Drizzle Studio GUI
```

**Testing:** Vitest (`npm test` / `vitest run`). Test files colocated in `src/lib/*.test.ts`.

## Project Structure

```
src/
  app/                 # Next.js App Router pages + server actions
    (auth)/            # Sign-in/sign-up (Clerk)
    admin/             # Admin CRUD (stores, products, sightings, verification)
    api/               # API routes (webhooks, cron)
    dashboard/         # User dashboard
    leaderboard/       # Reporter rankings
    map/               # Interactive store map
    collection/        # Pokemon collection view
  components/          # React components (ui/ = shadcn, rest = custom)
  db/
    index.ts           # Drizzle client + connection
    schema.ts          # All tables, enums, relations
  lib/                 # Shared utilities and business logic
    utils.ts           # cn() helper, general utils
    badges.ts          # Badge checking logic
    pokemon.ts         # Egg hatching, rarity, shiny logic
    trends.ts          # Restock pattern analysis
    places.ts          # Google Places API integration
drizzle/               # Migration SQL files (0000-0005)
docs/plans/            # Planning documents (plan-a through plan-k)
scripts/               # DB seed scripts
```

## Database Schema (src/db/schema.ts)

**Core tables:** users, stores, products, restock_sightings, restock_patterns, alert_preferences, search_cache

**Gamification tables:** pokemon_catalog (Pokedex 1-151), pokemon_eggs, reporter_badges

**Key enums:** store_type, product_type, stock_status, pokemon_rarity, sighting_source, subscription_tier, badge_type

**Key relationships:**
- restock_sightings → stores (storeId), products (productId, nullable), users (reportedBy)
- pokemon_eggs → users (userId), restock_sightings (sightingId), pokemon_catalog (pokemonId, wildPokemonId)
- reporter_badges → users (userId)
- alert_preferences → users (userId), products (productId, nullable)

## Architecture Patterns

- **Server-first:** Server Components by default, "use client" only when needed
- **Server Actions:** Mutations via "use server" functions in `actions.ts` files colocated with pages
- **Database queries:** Drizzle ORM with type-safe schema inference
- **Auth flow:** Clerk JWT → middleware auth check → DB user lookup (auto-create if missing in dev)
- **Admin check:** `publicMetadata.role === "admin"` from Clerk

## Key Business Logic

- **Sighting reports:** Users report found/not_found at stores. Max 10/day per user, 1 per store/day
- **Trust system:** Users earn trust from verified/corroborated reports. Auto-verify at 50+ trust score
- **Egg hatching:** Each sighting creates an egg. Rarity based on report status. 2% shiny chance. Base Pokemon assigned at creation with upgrade chance (5-35%) at hatch
- **Badges:** 9 types (first_report, verified_10/50, trusted_reporter, top_reporter, streak_7/30, pokedex_50/complete)
- **Restock patterns:** Cron job at 4 AM UTC analyzes historical sightings for day/time trends
- **Places search:** Grid-based 7-day cache to reduce Google API calls. Filters out non-retail venues

## Environment Variables

See `.env.example` for full list. Key groups:
- `DATABASE_URL` — Neon PostgreSQL
- `CLERK_*` — Auth (publishable key, secret key, webhook secret)
- `STRIPE_*` — Payments (secret key, publishable key, webhook secret, price ID)
- `RESEND_API_KEY` — Email
- `NEXT_PUBLIC_GOOGLE_MAPS_*` — Maps (API key, map ID)
- `NEXT_PUBLIC_APP_URL` — Base URL
- `CRON_SECRET` — Cron job auth

## Deployment

Vercel with Neon PostgreSQL. Cron job configured in `vercel.json`.
