import { requirePremium } from "@/lib/auth";
import { db } from "@/db";
import { stores, products } from "@/db/schema";
import { CommunityTipForm } from "@/components/community-tip-form";

export default async function SubmitTipPage() {
  await requirePremium();

  const [allStores, allProducts] = await Promise.all([
    db.select().from(stores).orderBy(stores.name),
    db.select().from(products).orderBy(products.name),
  ]);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Submit a Restock Tip</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Your tip will be reviewed by our team before becoming visible.
      </p>
      <CommunityTipForm stores={allStores} products={allProducts} />
    </div>
  );
}
