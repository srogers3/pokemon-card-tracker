import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { db } from "@/db";
import { restockSightings, stores, products } from "@/db/schema";
import { desc, eq, and, gte } from "drizzle-orm";

export default async function LandingPage() {
  const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

  const recentSightings = await db
    .select({
      storeName: stores.name,
      storeLocation: stores.locationLabel,
      productName: products.name,
      status: restockSightings.status,
      sightedAt: restockSightings.sightedAt,
    })
    .from(restockSightings)
    .innerJoin(stores, eq(restockSightings.storeId, stores.id))
    .innerJoin(products, eq(restockSightings.productId, products.id))
    .where(
      and(
        eq(restockSightings.verified, true),
        gte(restockSightings.sightedAt, fortyEightHoursAgo)
      )
    )
    .orderBy(desc(restockSightings.sightedAt))
    .limit(5);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main>
        {/* Hero */}
        <section className="py-20 px-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Never Miss a Restock
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            Track Pokemon card availability at retail stores near you. Get
            alerts when products restock and discover the best times to check.
          </p>
          <div className="mt-10 flex gap-4 justify-center">
            <Link href="/sign-up">
              <Button size="lg">Start Tracking — Free</Button>
            </Link>
            <Link href="/sign-in">
              <Button variant="outline" size="lg">
                Sign In
              </Button>
            </Link>
          </div>
        </section>

        {/* Recent Sightings */}
        {recentSightings.length > 0 && (
          <section className="py-12 px-4 bg-muted/50">
            <div className="container mx-auto">
              <h2 className="text-2xl font-bold mb-6 text-center">
                Recent Sightings
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto">
                {recentSightings.map((sighting, i) => (
                  <Card key={i}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">
                        {sighting.productName}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        {sighting.storeName} — {sighting.storeLocation}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(sighting.sightedAt).toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Features */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-2xl font-bold mb-8 text-center">
              Why Go Premium?
            </h2>
            <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Restock Heatmaps</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  See the best days and times to check each store based on
                  historical restock patterns.
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Email Alerts</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Get notified when products you want are spotted at stores in
                  your area.
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Full History</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Access all sighting data with advanced filters by store,
                  product, region, and date.
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
