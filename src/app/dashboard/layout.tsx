import { requireUser } from "@/lib/auth";
import { SiteHeader } from "@/components/site-header";
import { getUnviewedOpenings } from "@/lib/boxes";
import { UnboxRevealModal } from "@/components/unbox-reveal-modal";
import { PersistentMap } from "@/components/map/persistent-map";
import { getDevOverrides } from "@/lib/dev";
import { Bug } from "lucide-react";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const unviewedOpenings = await getUnviewedOpenings(user.id);
  const devOverrides = await getDevOverrides();
  const isPremium = user.subscriptionTier === "premium" || devOverrides.simulatePremium;

  return (
    <div className="min-h-[100dvh] flex flex-col overflow-x-hidden">
      <SiteHeader isPremium={isPremium} />
      <div className="flex-1">
        <PersistentMap />
        {children}
      </div>
      <footer className="border-t py-4 px-4 text-center">
        <a
          href="mailto:spartanwarriorsz@gmail.com?subject=Cardboard%20Tracker%20Feedback"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Bug className="w-3.5 h-3.5" />
          Report a bug or send feedback
        </a>
      </footer>
      {unviewedOpenings.length > 0 && (
        <UnboxRevealModal openings={unviewedOpenings} />
      )}
    </div>
  );
}
