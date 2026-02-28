import { requireUser } from "@/lib/auth";
import { SiteHeader } from "@/components/site-header";
import { getUnviewedOpenings } from "@/lib/boxes";
import { UnboxRevealModal } from "@/components/unbox-reveal-modal";
import { PersistentMap } from "@/components/map/persistent-map";
import { getDevOverrides } from "@/lib/dev";

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
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <SiteHeader isPremium={isPremium} />
      <div className="flex-1">
        <PersistentMap />
        {children}
      </div>
      {unviewedOpenings.length > 0 && (
        <UnboxRevealModal openings={unviewedOpenings} />
      )}
    </div>
  );
}
