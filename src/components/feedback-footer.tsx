"use client";

import { usePathname } from "next/navigation";
import { Bug } from "lucide-react";

export function FeedbackFooter() {
  const pathname = usePathname();
  if (pathname === "/dashboard/map") return null;

  return (
    <footer className="border-t py-4 px-4 text-center">
      <a
        href="mailto:spartanwarriorsz@gmail.com?subject=Cardboard%20Tracker%20Feedback"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <Bug className="w-3.5 h-3.5" />
        Report a bug or send feedback
      </a>
    </footer>
  );
}
