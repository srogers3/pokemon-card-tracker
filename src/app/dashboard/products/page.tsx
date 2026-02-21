import { db } from "@/db";
import { products, restockSightings } from "@/db/schema";
import { gte, count } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function ProductCatalogPage() {
  const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

  const allProducts = await db.select().from(products).orderBy(products.setName, products.name);

  // Get recent sighting counts per product
  const recentCounts = await db
    .select({
      productId: restockSightings.productId,
      sightingCount: count(),
    })
    .from(restockSightings)
    .where(
      gte(restockSightings.sightedAt, fortyEightHoursAgo)
    )
    .groupBy(restockSightings.productId);

  const countMap = new Map(
    recentCounts.map((r) => [r.productId, r.sightingCount])
  );

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Product Catalog</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {allProducts.map((product) => {
          const recentCount = countMap.get(product.id) ?? 0;
          return (
            <Card key={product.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{product.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">{product.setName}</Badge>
                  <Badge variant="secondary">{product.productType}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {recentCount > 0
                    ? `${recentCount} sighting${recentCount > 1 ? "s" : ""} in last 48h`
                    : "No recent sightings"}
                </p>
              </CardContent>
            </Card>
          );
        })}
        {allProducts.length === 0 && (
          <p className="text-muted-foreground col-span-full">
            No products being tracked yet.
          </p>
        )}
      </div>
    </div>
  );
}
