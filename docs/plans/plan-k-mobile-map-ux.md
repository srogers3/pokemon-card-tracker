# Mobile Map UX Improvements Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Improve the mobile map experience by centering on marker tap, replacing the subnav with a hamburger menu, and fixing the store detail panel sizing.

**Architecture:** Pure frontend changes across 4 files. Uses the existing Sheet component for the mobile nav drawer. Map centering uses the Google Maps `panTo`/`panBy` API already available via `useMap()`.

**Tech Stack:** Next.js, React, @vis.gl/react-google-maps, Radix UI Sheet, Tailwind CSS, lucide-react

---

### Task 1: Center map on sprite tap

**Files:**
- Modify: `src/components/map/store-map.tsx:169-174`

**Step 1: Update the marker onClick handler to pan the map**

In `MapContent`, change the `PokeballMarker` onClick from a simple `setSelectedStore` to also pan the map. Replace lines 169-175:

```tsx
{storeData.map((sd) => (
  <PokeballMarker
    key={sd.store.id}
    store={sd.store}
    onClick={() => {
      setSelectedStore(sd);
      if (map && sd.store.latitude && sd.store.longitude) {
        map.panTo({ lat: sd.store.latitude, lng: sd.store.longitude });
        // Offset upward so marker is visible above the bottom panel
        setTimeout(() => map.panBy(0, -150), 300);
      }
    }}
  />
))}
```

The `setTimeout` is needed because `panTo` is animated and we need to wait for it to finish before applying the pixel offset.

**Step 2: Verify visually**

Run: `npm run dev`
- Open on mobile viewport (or Chrome DevTools responsive mode)
- Tap a sprite marker
- Confirm the map pans to center the store, then shifts up so the marker is visible above the bottom panel

**Step 3: Commit**

```bash
git add src/components/map/store-map.tsx
git commit -m "feat: center map on sprite tap with panel offset"
```

---

### Task 2: Hide subnav on mobile

**Files:**
- Modify: `src/components/dashboard-nav.tsx:22`
- Modify: `src/app/dashboard/layout.tsx:15-17`

**Step 1: Make the nav desktop-only**

In `src/components/dashboard-nav.tsx`, change the nav className on line 22 from:

```tsx
<nav className="flex gap-1 border-b border-border/50 pb-4 mb-6">
```

to:

```tsx
<nav className="hidden md:flex gap-1 border-b border-border/50 pb-4 mb-6">
```

**Step 2: Hide the nav wrapper div on mobile**

In `src/app/dashboard/layout.tsx`, change line 15 from:

```tsx
<div className="px-4 pt-4">
```

to:

```tsx
<div className="hidden md:block px-4 pt-4">
```

This prevents the wrapper's padding from taking space on mobile even though the nav is hidden.

**Step 3: Verify visually**

Run: `npm run dev`
- Mobile viewport: subnav tabs should be completely gone, map fills more vertical space
- Desktop viewport (>768px): subnav tabs should still appear normally

**Step 4: Commit**

```bash
git add src/components/dashboard-nav.tsx src/app/dashboard/layout.tsx
git commit -m "feat: hide subnav on mobile to maximize map space"
```

---

### Task 3: Add hamburger menu to site header

**Files:**
- Modify: `src/components/site-header.tsx`
- Modify: `src/app/dashboard/layout.tsx`

**Step 1: Update SiteHeader to accept isPremium and show mobile nav**

Replace the entire `src/components/site-header.tsx` with:

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";

const dashboardLinks = [
  { href: "/dashboard", label: "Map" },
  { href: "/dashboard/sightings", label: "Sightings" },
  { href: "/dashboard/products", label: "Products" },
  { href: "/dashboard/submit", label: "Submit Tip" },
  { href: "/dashboard/collection", label: "Collection" },
  { href: "/dashboard/leaderboard", label: "Leaderboard" },
  { href: "/dashboard/heatmap", label: "Heatmap", premium: true },
  { href: "/dashboard/alerts", label: "Alerts", premium: true },
];

export function SiteHeader({ isPremium }: { isPremium?: boolean }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith("/dashboard");

  return (
    <header className="border-b border-border/50 bg-card/80 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold text-primary">
          Pokemon Card Tracker
        </Link>
        <nav className="flex items-center gap-4">
          <SignedIn>
            {isDashboard && (
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden"
                onClick={() => setOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </Button>
            )}
            <Link href="/dashboard" className="hidden md:block">
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

      {isDashboard && (
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent side="left" showCloseButton>
            <SheetHeader>
              <SheetTitle>Navigation</SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-1 px-4">
              {dashboardLinks.map((link) => {
                if (link.premium && !isPremium) return null;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "text-sm font-medium px-3 py-2.5 rounded-lg transition-all",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </SheetContent>
        </Sheet>
      )}
    </header>
  );
}
```

Key changes:
- Component is now `"use client"` (was server component) — needed for Sheet state and `usePathname`
- Hamburger button visible only on mobile (`md:hidden`) and only on dashboard routes
- Uses existing Sheet component with `side="left"` for a slide-in drawer
- Links close the drawer on click
- Same styling as the existing DashboardNav pills but in vertical layout
- Dashboard link in header hidden on mobile (`hidden md:block`) since it's in the drawer

**Step 2: Pass isPremium to SiteHeader from layout**

In `src/app/dashboard/layout.tsx`, change:

```tsx
<SiteHeader />
```

to:

```tsx
<SiteHeader isPremium={user.subscriptionTier === "premium"} />
```

**Step 3: Verify visually**

Run: `npm run dev`
- Mobile: hamburger icon visible in header bar, tapping opens a left-side drawer with all nav links
- Tapping a link navigates and closes the drawer
- Desktop: hamburger hidden, horizontal tabs still visible below header
- Non-dashboard pages (e.g. landing page): no hamburger icon

**Step 4: Commit**

```bash
git add src/components/site-header.tsx src/app/dashboard/layout.tsx
git commit -m "feat: add hamburger menu for mobile dashboard navigation"
```

---

### Task 4: Fix store detail panel sizing

**Files:**
- Modify: `src/components/map/store-detail-panel.tsx:32`

**Step 1: Update panel classes for compact mobile and expandable form**

In `src/components/map/store-detail-panel.tsx`, replace line 32 (the outer div) from:

```tsx
<div className="absolute bottom-0 left-0 right-0 z-10 max-h-[60vh] overflow-y-auto bg-card rounded-t-2xl shadow-lg border-t border-border/50 md:absolute md:right-4 md:bottom-4 md:left-auto md:w-96 md:rounded-2xl md:border md:max-h-[70vh]">
```

to:

```tsx
<div className={cn(
  "absolute bottom-0 left-0 right-0 z-10 overflow-y-auto bg-card rounded-t-2xl shadow-lg border-t border-border/50 transition-[max-height] duration-300 ease-in-out",
  showForm ? "max-h-[70vh]" : "max-h-[40vh]",
  "md:absolute md:right-4 md:bottom-4 md:left-auto md:w-96 md:rounded-2xl md:border md:max-h-[70vh]"
)}>
```

Also add the `cn` import if not already present. Check current imports at line 6:

```tsx
import { cn } from "@/lib/utils";
```

**Step 2: Verify visually**

Run: `npm run dev`
- Mobile: tap a marker, panel should be compact (~40% of screen), map mostly visible
- Tap "Report Sighting" — panel smoothly expands to ~70% to show the full form
- Tap "Cancel" — panel shrinks back to compact
- Desktop: panel always has max-h-[70vh], no change in behavior

**Step 3: Commit**

```bash
git add src/components/map/store-detail-panel.tsx
git commit -m "feat: compact store detail panel on mobile with expandable form"
```

---

### Task 5: Final visual check and cleanup

**Step 1: Full flow verification on mobile viewport**

Run: `npm run dev` with Chrome DevTools in mobile mode (iPhone 12/13 viewport).

Verify:
1. Map fills the screen below the header (no subnav gap)
2. Hamburger icon in header opens nav drawer
3. Tapping a sprite centers the map and offsets for the panel
4. Panel is compact, doesn't hide the marker
5. "Report Sighting" expands the panel, form is fully usable
6. Closing the panel returns map to normal

**Step 2: Verify desktop is unchanged**

Switch to desktop viewport (>768px):
1. Subnav tabs visible below header
2. No hamburger icon
3. Store detail panel shows as card in bottom-right corner

**Step 3: Run build to check for type errors**

Run: `npm run build`
Expected: Clean build with no type errors.

**Step 4: Commit any fixes if needed**

```bash
git add -A
git commit -m "chore: fix any issues from mobile UX review"
```
