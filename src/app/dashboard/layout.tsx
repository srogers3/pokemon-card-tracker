import { requireUser } from "@/lib/auth";
import { SiteHeader } from "@/components/site-header";
import { DashboardNav } from "@/components/dashboard-nav";
import { getUnviewedOpenings } from "@/lib/boxes";
import { UnboxRevealModal } from "@/components/unbox-reveal-modal";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const unviewedOpenings = await getUnviewedOpenings(user.id);

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader isPremium={user.subscriptionTier === "premium"} />
      <div className="hidden md:block px-4 pt-4">
        <DashboardNav isPremium={user.subscriptionTier === "premium"} />
      </div>
      <div className="flex-1">
        {children}
      </div>
      {unviewedOpenings.length > 0 && (
        <UnboxRevealModal openings={unviewedOpenings} />
      )}
    </div>
  );
}
