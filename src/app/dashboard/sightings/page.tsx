import { getCurrentUser } from "@/lib/auth";
import { SightingsFeed } from "@/components/sightings-feed";

export default async function SightingsPage() {
  const user = await getCurrentUser();
  const isPremium = user?.subscriptionTier === "premium";

  return (
    <div className="w-full mx-auto py-4 px-4 max-w-2xl page-fade-in">
      <h2 className="text-xl font-semibold mb-4">Sightings</h2>
      <SightingsFeed isPremium={isPremium} />
    </div>
  );
}
