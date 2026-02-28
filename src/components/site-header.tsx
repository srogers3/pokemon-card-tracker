"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";

const dashboardLinks = [
  { href: "/dashboard", label: "Home" },
  { href: "/dashboard/map", label: "Map" },
  { href: "/dashboard/sightings", label: "Sightings" },
  { href: "/dashboard/collection", label: "Collection" },
  { href: "/dashboard/leaderboard", label: "Leaderboard" },
  { href: "/dashboard/heatmap", label: "Heatmap", premium: true },
  { href: "/dashboard/alerts", label: "Alerts", premium: true },
];

export function SiteHeader({ isPremium }: { isPremium?: boolean }) {
  const [open, setOpen] = useState(false);
  const [sheetMounted, setSheetMounted] = useState(true);
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith("/dashboard");

  // Re-mount sheet and ensure closed after navigation completes
  useEffect(() => {
    setSheetMounted(true);
    setOpen(false);
  }, [pathname]);

  // Instantly unmount sheet (skip exit animation) when navigating via link
  const handleNavClick = useCallback(() => {
    setSheetMounted(false);
    setOpen(false);
  }, []);

  return (
    <header className="sticky top-0 z-50">
      {/* Frosted glass backdrop — extends below header and masks overflow for soft blur edge */}
      <div
        className="pointer-events-none absolute inset-0 h-[200%] backdrop-blur-xl"
        style={{
          maskImage: "linear-gradient(to bottom, black 0% 50%, transparent 50% 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, black 0% 50%, transparent 50% 100%)",
          background: "linear-gradient(to bottom, hsl(var(--card) / 0.85), transparent 50%)",
        }}
        aria-hidden="true"
      />
      <div className="container relative mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-xl font-bold text-primary">
            Cardboard Tracker
          </Link>
          {isDashboard && (
            <nav className="hidden md:flex items-center gap-1">
              {dashboardLinks.map((link) => {
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
          )}
        </div>
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
            {!isDashboard && (
              <Link href="/dashboard" className="hidden md:block">
                <Button variant="ghost" size="sm">
                  Dashboard
                </Button>
              </Link>
            )}
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

      {isDashboard && sheetMounted && (
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
                    onClick={handleNavClick}
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
