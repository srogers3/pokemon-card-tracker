"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Sightings" },
  { href: "/dashboard/products", label: "Products" },
  { href: "/dashboard/submit", label: "Submit Tip" },
  { href: "/dashboard/leaderboard", label: "Leaderboard" },
  { href: "/dashboard/heatmap", label: "Heatmap", premium: true },
  { href: "/dashboard/alerts", label: "Alerts", premium: true },
];

export function DashboardNav({ isPremium }: { isPremium: boolean }) {
  const pathname = usePathname();

  return (
    <nav className="flex gap-4 border-b pb-4 mb-6">
      {links.map((link) => {
        if (link.premium && !isPremium) return null;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary",
              pathname === link.href
                ? "text-primary"
                : "text-muted-foreground"
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
