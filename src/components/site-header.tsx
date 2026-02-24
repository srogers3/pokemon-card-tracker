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
          Cardboard Tracker
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
