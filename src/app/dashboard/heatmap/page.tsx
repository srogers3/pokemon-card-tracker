import { requirePremium } from "@/lib/auth";
import { db } from "@/db";
import { restockPatterns, stores } from "@/db/schema";
import { eq } from "drizzle-orm";
import { HeatmapGrid } from "@/components/heatmap-grid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function HeatmapPage() {
  await requirePremium();

  // Get all patterns grouped by store
  const patterns = await db
    .select({
      storeId: restockPatterns.storeId,
      storeName: stores.name,
      storeLocation: stores.locationLabel,
      dayOfWeek: restockPatterns.dayOfWeek,
      hourOfDay: restockPatterns.hourOfDay,
      frequencyCount: restockPatterns.frequencyCount,
    })
    .from(restockPatterns)
    .innerJoin(stores, eq(restockPatterns.storeId, stores.id))
    .orderBy(stores.name);

  // Group by store
  const storeMap = new Map<
    string,
    {
      name: string;
      location: string;
      data: { dayOfWeek: number; hourOfDay: number; frequencyCount: number }[];
    }
  >();

  for (const p of patterns) {
    if (!storeMap.has(p.storeId)) {
      storeMap.set(p.storeId, {
        name: p.storeName,
        location: p.storeLocation,
        data: [],
      });
    }
    storeMap.get(p.storeId)!.data.push({
      dayOfWeek: p.dayOfWeek,
      hourOfDay: p.hourOfDay,
      frequencyCount: p.frequencyCount,
    });
  }

  return (
    <div className="page-fade-in">
      <h2 className="text-xl font-semibold mb-6">Restock Heatmaps</h2>
      {storeMap.size === 0 ? (
        <p className="text-muted-foreground">
          Not enough data to generate heatmaps yet.
        </p>
      ) : (
        <div className="space-y-6">
          {Array.from(storeMap.entries()).map(([storeId, store]) => (
            <Card key={storeId}>
              <CardHeader>
                <CardTitle className="text-base">
                  {store.name} — {store.location}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <HeatmapGrid data={store.data} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
