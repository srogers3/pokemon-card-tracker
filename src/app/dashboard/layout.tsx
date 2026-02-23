import { requireUser } from "@/lib/auth";
import { SiteHeader } from "@/components/site-header";
import { DashboardNav } from "@/components/dashboard-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <div className="px-4 pt-4">
        <DashboardNav isPremium={user.subscriptionTier === "premium"} />
      </div>
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}
