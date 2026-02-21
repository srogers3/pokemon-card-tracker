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
    <div className="min-h-screen">
      <SiteHeader />
      <div className="container mx-auto py-8 px-4">
        <DashboardNav isPremium={user.subscriptionTier === "premium"} />
        {children}
      </div>
    </div>
  );
}
