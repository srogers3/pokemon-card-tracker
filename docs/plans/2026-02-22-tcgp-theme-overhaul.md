# TCGP Theme Overhaul Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the Pokemon Card Tracker from a neutral/monochrome design to match the Pokemon TCG Pocket app's light lavender aesthetic with full visual effects.

**Architecture:** CSS-first approach — replace color tokens in globals.css, swap font in layout.tsx, update shadcn component variants, then apply page-specific treatments. All effects are CSS-only (keyframe animations, gradients, box-shadows). No dark mode — single light theme.

**Tech Stack:** Tailwind CSS v4 (OKLCH tokens), Google Fonts (Nunito), CSS animations, shadcn/ui component variants (CVA)

---

### Task 1: Replace Color Tokens in globals.css

**Files:**
- Modify: `src/app/globals.css`

**Step 1: Replace the `:root` color tokens**

Replace lines 50-83 in `src/app/globals.css` with the TCGP lavender palette. Convert hex values to OKLCH for consistency with Tailwind v4. Also remove the `.dark` block (lines 85-117) since we're going light-only. Add new custom properties for accent, highlight, and energy-type colors.

```css
:root {
  --radius: 0.75rem;
  --background: oklch(0.95 0.02 290);
  --foreground: oklch(0.25 0.02 290);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.25 0.02 290);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.25 0.02 290);
  --primary: oklch(0.55 0.15 290);
  --primary-foreground: oklch(1 0 0);
  --secondary: oklch(0.94 0.02 290);
  --secondary-foreground: oklch(0.35 0.05 290);
  --muted: oklch(0.94 0.02 290);
  --muted-foreground: oklch(0.6 0.03 290);
  --accent: oklch(0.7 0.1 180);
  --accent-foreground: oklch(1 0 0);
  --destructive: oklch(0.63 0.2 25);
  --border: oklch(0.88 0.03 290);
  --input: oklch(0.91 0.02 290);
  --ring: oklch(0.55 0.15 290);
  --chart-1: oklch(0.55 0.15 290);
  --chart-2: oklch(0.7 0.1 180);
  --chart-3: oklch(0.75 0.15 85);
  --chart-4: oklch(0.63 0.2 25);
  --chart-5: oklch(0.7 0.15 145);
  --sidebar: oklch(0.96 0.02 290);
  --sidebar-foreground: oklch(0.25 0.02 290);
  --sidebar-primary: oklch(0.55 0.15 290);
  --sidebar-primary-foreground: oklch(1 0 0);
  --sidebar-accent: oklch(0.94 0.02 290);
  --sidebar-accent-foreground: oklch(0.35 0.05 290);
  --sidebar-border: oklch(0.88 0.03 290);
  --sidebar-ring: oklch(0.55 0.15 290);

  /* TCGP custom tokens */
  --color-gold: oklch(0.78 0.13 85);
  --color-teal: oklch(0.7 0.1 180);
  --color-coral: oklch(0.63 0.2 25);

  /* Energy type colors */
  --color-fire: oklch(0.7 0.18 45);
  --color-water: oklch(0.6 0.17 255);
  --color-grass: oklch(0.7 0.18 145);
  --color-electric: oklch(0.8 0.16 95);
  --color-psychic: oklch(0.6 0.2 300);
  --color-fighting: oklch(0.55 0.14 55);
  --color-normal: oklch(0.7 0.01 0);
}
```

**Step 2: Remove the `.dark` block**

Delete the entire `.dark` selector (lines 85-117) and the `@custom-variant dark` line (line 5).

**Step 3: Add TCGP custom color mappings in the `@theme inline` block**

Add these lines inside the `@theme inline` block:

```css
  --color-gold: var(--color-gold);
  --color-teal: var(--color-teal);
  --color-coral: var(--color-coral);
  --color-fire: var(--color-fire);
  --color-water: var(--color-water);
  --color-grass: var(--color-grass);
  --color-electric: var(--color-electric);
  --color-psychic: var(--color-psychic);
  --color-fighting: var(--color-fighting);
  --color-normal: var(--color-normal);
```

**Step 4: Add CSS keyframe animations and utility classes**

After the `@layer base` block, add:

```css
/* TCGP Visual Effects */
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

@keyframes pulse-badge {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

@keyframes glow-pulse {
  0%, 100% { box-shadow: 0 0 8px rgba(212, 168, 67, 0.3); }
  50% { box-shadow: 0 0 16px rgba(212, 168, 67, 0.5); }
}

@layer utilities {
  .tcgp-gradient {
    background: linear-gradient(180deg, oklch(0.93 0.03 290) 0%, oklch(0.96 0.02 290) 50%, oklch(0.98 0.01 290) 100%);
  }

  .shimmer {
    position: relative;
    overflow: hidden;
  }

  .shimmer::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(
      110deg,
      transparent 25%,
      rgba(255, 255, 255, 0.4) 37%,
      transparent 63%
    );
    background-size: 200% 100%;
    animation: shimmer 2.5s ease-in-out infinite;
    pointer-events: none;
  }

  .gold-glow {
    box-shadow: 0 0 12px rgba(212, 168, 67, 0.3);
  }

  .gold-glow-pulse {
    animation: glow-pulse 2s ease-in-out infinite;
  }

  .badge-pulse {
    animation: pulse-badge 2s ease-in-out infinite;
  }

  .egg-float {
    animation: float 3s ease-in-out infinite;
  }

  .pokemon-uncaught {
    filter: grayscale(1) opacity(0.4);
  }

  .pokemon-caught {
    transition: all 0.2s ease;
  }

  .pokemon-caught:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(124, 92, 191, 0.2);
  }

  .card-hover {
    transition: all 0.2s ease;
  }

  .card-hover:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 20px rgba(124, 92, 191, 0.15);
  }
}
```

**Step 5: Update the base body styles**

Update the `@layer base` block to add the gradient background:

```css
@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground tcgp-gradient;
    min-height: 100vh;
  }
}
```

**Step 6: Run build to verify no CSS errors**

Run: `npx next build 2>&1 | head -30`
Expected: Build succeeds or only shows non-CSS warnings

**Step 7: Commit**

```bash
git add src/app/globals.css
git commit -m "feat: replace neutral theme with TCGP lavender color palette and add CSS effects"
```

---

### Task 2: Swap Font to Nunito

**Files:**
- Modify: `src/app/layout.tsx`

**Step 1: Replace Inter with Nunito**

Change the import and font config:

```tsx
import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";

const nunito = Nunito({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Pokemon Card Tracker",
  description: "Track Pokemon card restocks at retail stores",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={nunito.className}>{children}</body>
      </html>
    </ClerkProvider>
  );
}
```

**Step 2: Run dev server to verify font loads**

Run: `npx next build 2>&1 | head -20`
Expected: Build succeeds, Nunito font loads

**Step 3: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat: swap Inter font to Nunito for TCGP rounded feel"
```

---

### Task 3: Update Card Component with Purple Shadow

**Files:**
- Modify: `src/components/ui/card.tsx`

**Step 1: Update Card base styles**

Replace the Card className (line 10) to add purple shadow and increased border-radius:

Old:
```tsx
"bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm",
```

New:
```tsx
"bg-card text-card-foreground flex flex-col gap-6 rounded-2xl border py-6 shadow-[0_2px_12px_rgba(124,92,191,0.08)]",
```

**Step 2: Commit**

```bash
git add src/components/ui/card.tsx
git commit -m "feat: update Card component with purple shadow and rounded-2xl"
```

---

### Task 4: Update Button Component with TCGP Variants

**Files:**
- Modify: `src/components/ui/button.tsx`

**Step 1: Update button base and variants**

Update the base class string (line 8) to use `rounded-lg` default and update variant styles:

Replace the entire `buttonVariants` definition:

```tsx
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-md hover:bg-primary/90 hover:shadow-lg",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20",
        outline:
          "border bg-background shadow-xs hover:bg-accent/10 hover:text-accent-foreground hover:border-accent",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-muted hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        accent: "bg-accent text-accent-foreground rounded-full shadow-md hover:bg-accent/90 hover:shadow-lg",
        gold: "bg-gold text-white rounded-full shadow-md hover:bg-gold/90 hover:shadow-lg",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        xs: "h-6 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-lg px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-xs": "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
```

**Step 2: Commit**

```bash
git add src/components/ui/button.tsx
git commit -m "feat: add TCGP button variants (accent pill, gold) and update base styles"
```

---

### Task 5: Update Badge Component with TCGP Semantic Variants

**Files:**
- Modify: `src/components/ui/badge.tsx`

**Step 1: Add TCGP semantic badge variants**

Replace the `badgeVariants` definition with additional variants:

```tsx
const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border border-transparent px-2.5 py-0.5 text-xs font-semibold w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary:
          "bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive:
          "bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20",
        outline:
          "border-border text-foreground [a&]:hover:bg-accent/10 [a&]:hover:text-accent-foreground",
        ghost: "[a&]:hover:bg-accent/10 [a&]:hover:text-accent-foreground",
        link: "text-primary underline-offset-4 [a&]:hover:underline",
        found: "bg-teal text-white",
        notFound: "bg-coral text-white",
        verified: "bg-gold text-white",
        gold: "bg-gold text-white",
        teal: "bg-teal text-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)
```

**Step 2: Commit**

```bash
git add src/components/ui/badge.tsx
git commit -m "feat: add TCGP semantic badge variants (found, notFound, verified, gold, teal)"
```

---

### Task 6: Update Site Header with TCGP Styling

**Files:**
- Modify: `src/components/site-header.tsx`

**Step 1: Apply lavender header styling**

```tsx
import Link from "next/link";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="border-b border-border/50 bg-card/80 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold text-primary">
          Pokemon Card Tracker
        </Link>
        <nav className="flex items-center gap-4">
          <SignedIn>
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                Dashboard
              </Button>
            </Link>
            <UserButton />
          </SignedIn>
          <SignedOut>
            <Link href="/sign-in">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/sign-up">
              <Button variant="accent" size="sm">Get Started</Button>
            </Link>
          </SignedOut>
        </nav>
      </div>
    </header>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/site-header.tsx
git commit -m "feat: style site header with TCGP lavender theme and teal CTA"
```

---

### Task 7: Update Dashboard Nav with Active Pill Indicators

**Files:**
- Modify: `src/components/dashboard-nav.tsx`

**Step 1: Add pill-style active indicators**

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Sightings" },
  { href: "/dashboard/products", label: "Products" },
  { href: "/dashboard/submit", label: "Submit Tip" },
  { href: "/dashboard/collection", label: "Collection" },
  { href: "/dashboard/leaderboard", label: "Leaderboard" },
  { href: "/dashboard/heatmap", label: "Heatmap", premium: true },
  { href: "/dashboard/alerts", label: "Alerts", premium: true },
];

export function DashboardNav({ isPremium }: { isPremium: boolean }) {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 border-b border-border/50 pb-4 mb-6">
      {links.map((link) => {
        if (link.premium && !isPremium) return null;
        const isActive = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "text-sm font-medium px-3 py-1.5 rounded-full transition-all",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/dashboard-nav.tsx
git commit -m "feat: style dashboard nav with TCGP pill-style active indicators"
```

---

### Task 8: Restyle Landing Page

**Files:**
- Modify: `src/app/page.tsx`

**Step 1: Apply TCGP gradient hero and card hover effects**

Update the JSX return in `src/app/page.tsx`. Key changes:
- Hero section: add gradient overlay, larger text with purple color
- CTA buttons: use `accent` variant (teal pill) for primary, `outline` for secondary
- Sightings section: use `bg-card/50` background
- Feature cards: add `card-hover` class and type-colored left borders
- Status display: use `found`/`notFound` badge variants

```tsx
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main>
        {/* Hero */}
        <section className="py-24 px-4 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
          <div className="relative">
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl text-foreground">
              Never Miss a <span className="text-primary">Restock</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
              Track Pokemon card availability at retail stores near you. Get
              alerts when products restock and discover the best times to check.
            </p>
            <div className="mt-10 flex gap-4 justify-center">
              <Link href="/sign-up">
                <Button variant="accent" size="lg" className="px-8">Start Tracking — Free</Button>
              </Link>
              <Link href="/sign-in">
                <Button variant="outline" size="lg">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Recent Sightings */}
        {recentSightings.length > 0 && (
          <section className="py-12 px-4 bg-card/50">
            <div className="container mx-auto">
              <h2 className="text-2xl font-bold mb-6 text-center">
                Recent Sightings
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto">
                {recentSightings.map((sighting, i) => (
                  <Card key={i} className="card-hover">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">
                        {sighting.productName}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        {sighting.storeName} — {sighting.storeLocation}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-muted-foreground">
                          {new Date(sighting.sightedAt).toLocaleString()}
                        </p>
                        <Badge variant={sighting.status === "found" ? "found" : "notFound"}>
                          {sighting.status === "found" ? "Found" : "Not Found"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Features */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-2xl font-bold mb-8 text-center">
              Why Go <span className="text-gold">Premium</span>?
            </h2>
            <div className="grid gap-6 md:grid-cols-3">
              <Card className="card-hover border-l-4 border-l-psychic">
                <CardHeader>
                  <CardTitle className="text-base">Restock Heatmaps</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  See the best days and times to check each store based on
                  historical restock patterns.
                </CardContent>
              </Card>
              <Card className="card-hover border-l-4 border-l-water">
                <CardHeader>
                  <CardTitle className="text-base">Email Alerts</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Get notified when products you want are spotted at stores in
                  your area.
                </CardContent>
              </Card>
              <Card className="card-hover border-l-4 border-l-grass">
                <CardHeader>
                  <CardTitle className="text-base">Full History</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Access all sighting data with advanced filters by store,
                  product, region, and date.
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
```

Note: Need to add `Badge` import at top:
```tsx
import { Badge } from "@/components/ui/badge";
```

**Step 2: Verify the page renders**

Run: `npx next build 2>&1 | head -30`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: restyle landing page with TCGP gradient hero, teal CTAs, and type-colored feature cards"
```

---

### Task 9: Restyle Dashboard Sightings Page

**Files:**
- Modify: `src/app/dashboard/page.tsx`

**Step 1: Update status badges and table styling**

Key changes:
- Use `found`/`notFound` badge variants instead of `default`/`destructive`
- Add `card-hover` to premium teaser card
- Use `gold` variant button for upgrade CTA
- Add alternating row tints

Update the `statusVariant` function and badge usage:

```tsx
  const statusVariant = (status: string) => {
    if (status === "found") return "found" as const;
    return "notFound" as const;
  };
```

Update the upgrade button (line 59):
```tsx
<Button variant="gold" size="sm">Upgrade for Full History</Button>
```

Update the premium teaser card (line 99):
```tsx
<Card className="mt-8 card-hover border-gold/30 gold-glow">
```

Add even-row tinting by updating each `<TableRow>` in the map (line 74):
```tsx
<TableRow key={s.id} className={i % 2 === 0 ? "" : "bg-muted/30"}>
```

Note: The map callback needs the index parameter added: `sightings.map((s, i) => (`

**Step 2: Commit**

```bash
git add src/app/dashboard/page.tsx
git commit -m "feat: restyle sightings page with TCGP badge variants and gold premium accents"
```

---

### Task 10: Restyle Collection Page with Effects

**Files:**
- Modify: `src/app/dashboard/collection/page.tsx`

**Step 1: Apply TCGP effects to Pokemon collection**

Key changes:
- Progress bar: use purple gradient fill
- Pending eggs: add `egg-float` animation and `gold-glow` to container
- Pokemon grid:
  - Caught Pokemon: add `pokemon-caught` class, type-colored top border based on rarity
  - Uncaught Pokemon: use `pokemon-uncaught` class with dashed border
  - Shiny Pokemon: add `shimmer` class overlay
- Count badges: use teal background instead of primary

Update the progress bar (line 42-45):
```tsx
      <div className="w-full bg-muted rounded-full h-3 mb-6 overflow-hidden">
        <div
          className="bg-gradient-to-r from-primary to-accent rounded-full h-3 transition-all"
          style={{ width: `${(uniqueCaught / 151) * 100}%` }}
        />
      </div>
```

Update the pending eggs card (line 50):
```tsx
<Card className="mb-6 gold-glow">
```

Update individual egg items (lines 59-65):
```tsx
                <div
                  key={egg.id}
                  className="w-12 h-12 bg-gold/10 rounded-lg flex items-center justify-center text-lg egg-float"
                  title={`Egg from ${egg.reportStatus} report — waiting for verification`}
                  style={{ animationDelay: `${Math.random() * 2}s` }}
                >
                  🥚
                </div>
```

Update the Pokemon grid cards (lines 82-113):
```tsx
            <div
              key={pokemon.id}
              className={cn(
                "relative aspect-square rounded-xl border p-1 flex flex-col items-center justify-center",
                isCaught
                  ? "bg-card border-primary/20 pokemon-caught shadow-sm"
                  : "bg-muted/30 border-dashed border-border pokemon-uncaught"
              )}
              title={
                isCaught
                  ? `#${pokemon.id} ${pokemon.name} (${caught.count}x${caught.shinyCount > 0 ? `, ${caught.shinyCount} shiny` : ""})`
                  : `#${pokemon.id} ???`
              }
            >
              {isCaught && caught.shinyCount > 0 && (
                <div className="absolute inset-0 shimmer rounded-xl" />
              )}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getSpriteUrl(pokemon.id)}
                alt={isCaught ? pokemon.name : "???"}
                className={cn("w-10 h-10 relative z-10", !isCaught && "brightness-0 opacity-30")}
                loading="lazy"
              />
              {isCaught && caught.shinyCount > 0 && (
                <span className="absolute top-0 right-0 text-xs z-10">✨</span>
              )}
              {isCaught && caught.count > 1 && (
                <span className="absolute bottom-0 right-0 text-[10px] bg-teal text-white rounded-full w-4 h-4 flex items-center justify-center z-10">
                  {caught.count}
                </span>
              )}
              <span className="text-[9px] text-muted-foreground truncate w-full text-center relative z-10">
                {isCaught ? pokemon.name : `#${pokemon.id}`}
              </span>
            </div>
```

Note: Add `cn` import if not already present:
```tsx
import { cn } from "@/lib/utils";
```

**Step 2: Commit**

```bash
git add src/app/dashboard/collection/page.tsx
git commit -m "feat: add TCGP effects to collection page - shimmer, float, glow animations"
```

---

### Task 11: Restyle Leaderboard Page

**Files:**
- Modify: `src/app/dashboard/leaderboard/page.tsx`

**Step 1: Add medal colors for top 3 and improve badge display**

Key changes:
- Top 3 rows get gold/silver/bronze left border accent
- Current user stats card gets a subtle purple border
- Trust score badges use semantic colors
- Leaderboard badges use teal/gold colors

Add a rank accent function:
```tsx
  const rankAccent = (rank: number) => {
    if (rank === 1) return "border-l-4 border-l-gold";
    if (rank === 2) return "border-l-4 border-l-[#a8a8b0]";
    if (rank === 3) return "border-l-4 border-l-[#cd7f32]";
    return "";
  };
```

Update the current user card (line 93):
```tsx
<Card className="mb-6 border-primary/30">
```

Update each `<TableRow>` in the leaderboard (line 143):
```tsx
<TableRow key={reporter.id} className={cn(
  isCurrentUser ? "bg-primary/5" : i % 2 !== 0 ? "bg-muted/30" : "",
  rankAccent(i + 1)
)}>
```

Update the trust level badge (line 151):
```tsx
<Badge variant={reporter.trustScore >= 50 ? "gold" : reporter.trustScore >= 10 ? "teal" : "outline"}>
  {trustLevel(reporter.trustScore)}
</Badge>
```

Update the individual badges display (line 158):
```tsx
<Badge key={b} variant="secondary" className="text-xs">
  {BADGE_LABELS[b] ?? b}
</Badge>
```

Note: Add `cn` import:
```tsx
import { cn } from "@/lib/utils";
```

**Step 2: Commit**

```bash
git add src/app/dashboard/leaderboard/page.tsx
git commit -m "feat: add gold/silver/bronze medal accents and trust-colored badges to leaderboard"
```

---

### Task 12: Restyle Heatmap Grid with Purple Palette

**Files:**
- Modify: `src/components/heatmap-grid.tsx`

**Step 1: Replace green heatmap colors with purple palette**

Update the `getColor` function to use TCGP purple tones:

```tsx
function getColor(count: number, max: number) {
  if (count === 0) return "bg-muted";
  const intensity = count / max;
  if (intensity < 0.25) return "bg-primary/20";
  if (intensity < 0.5) return "bg-primary/40";
  if (intensity < 0.75) return "bg-primary/60";
  return "bg-primary/90";
}
```

Also add `rounded-md` to each heatmap cell (line 55):
```tsx
"w-6 h-6 rounded-md transition-colors",
```

**Step 2: Commit**

```bash
git add src/components/heatmap-grid.tsx
git commit -m "feat: replace green heatmap colors with TCGP purple palette"
```

---

### Task 13: Restyle Upgrade Page with Gold Treatment

**Files:**
- Modify: `src/app/dashboard/upgrade/upgrade-client.tsx`

**Step 1: Apply gold premium styling**

```tsx
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function UpgradeClient() {
  async function handleUpgrade() {
    const res = await fetch("/api/stripe/checkout", { method: "POST" });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center">
        Go <span className="text-gold">Premium</span>
      </h2>
      <Card className="gold-glow border-gold/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Premium Membership
            <Badge variant="gold">PRO</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2"><span className="text-teal">✓</span> Full sighting history (no 48h limit)</li>
            <li className="flex items-center gap-2"><span className="text-teal">✓</span> Restock heatmaps by store and region</li>
            <li className="flex items-center gap-2"><span className="text-teal">✓</span> Email alerts for products you want</li>
            <li className="flex items-center gap-2"><span className="text-teal">✓</span> Submit community restock tips</li>
            <li className="flex items-center gap-2"><span className="text-teal">✓</span> Advanced filters (date range, store, product)</li>
          </ul>
          <Button onClick={handleUpgrade} variant="gold" className="w-full">
            Subscribe Now
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/dashboard/upgrade/upgrade-client.tsx
git commit -m "feat: restyle upgrade page with gold glow premium treatment"
```

---

### Task 14: Update Table Component with Lavender Tinting

**Files:**
- Modify: `src/components/ui/table.tsx`

**Step 1: Update TableRow hover color**

Update the TableRow className (line 60):

Old:
```tsx
"hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors",
```

New:
```tsx
"hover:bg-primary/5 data-[state=selected]:bg-primary/10 border-b border-border/50 transition-colors",
```

**Step 2: Update TableHead text color**

Update TableHead (line 73) to use slightly more prominent color:

Old:
```tsx
"text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
```

New:
```tsx
"text-muted-foreground h-10 px-2 text-left align-middle font-semibold whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
```

**Step 3: Commit**

```bash
git add src/components/ui/table.tsx
git commit -m "feat: update table component with TCGP lavender hover and border styling"
```

---

### Task 15: Update Dashboard Layout Background

**Files:**
- Modify: `src/app/dashboard/layout.tsx`

**Step 1: No changes needed — the body gradient from globals.css covers this**

The `tcgp-gradient` class on `body` already applies the lavender gradient to all pages. The dashboard layout inherits it naturally.

Skip this task — already handled by Task 1.

---

### Task 16: Final Build Verification and Cleanup

**Files:**
- All modified files

**Step 1: Run full build**

Run: `npx next build`
Expected: Build succeeds with no errors

**Step 2: Fix any build errors**

Address any TypeScript or CSS compilation errors.

**Step 3: Review all dark mode references**

Search for any remaining `dark:` prefixed classes in page files and remove them. The shadcn UI components may still have `dark:` variants which is fine (they're inert without a `.dark` class on the page).

Run: Search codebase for `dark:` usage in non-UI-component files.
- Remove any `dark:` classes from page-level code in `src/app/` and `src/components/` (excluding `src/components/ui/`)

**Step 4: Final commit**

```bash
git add -A
git commit -m "chore: cleanup dark mode references and fix build errors"
```
