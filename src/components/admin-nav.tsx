"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/stores", label: "Stores" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/sightings", label: "Sightings" },
  { href: "/admin/verification", label: "Verification Queue" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-4 border-b pb-4 mb-6">
      {links.map((link) => (
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
      ))}
    </nav>
  );
}
