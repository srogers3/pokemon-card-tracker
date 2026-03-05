import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { db } from "@/db";
import { restockSightings, stores, products } from "@/db/schema";
import { desc, eq, and, gte } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function LandingPage() {
  const { userId } = await auth();
  if (userId) {
    redirect("/dashboard");
  }

  // eslint-disable-next-line react-hooks/purity -- server component, Date.now() is deterministic per request
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
        <section className="py-24 px-4 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
          <div className="relative">
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl text-foreground">
              Never Miss a <span className="text-primary">Restock</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
              Track trading card availability at retail stores near you. Get
              alerts when products restock and discover the best times to check.
            </p>
            <div className="mt-10 flex gap-4 justify-center">
              <Link href="/sign-up">
                <Button variant="accent" size="lg" className="px-8">Start Tracking — Free</Button>
              </Link>
              <Link href="/sign-in">
                <Button variant="outline" size="lg">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Recent Sightings */}
        {recentSightings.length > 0 && (
          <section className="py-12 px-4 bg-card/50">
            <div className="container mx-auto">
              <h2 className="text-2xl font-bold mb-6 text-center">
                Recent Sightings
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto">
                {recentSightings.map((sighting, i) => (
                  <Card key={i} className="card-hover">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">
                        {sighting.productName}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        {sighting.storeName} — {sighting.storeLocation}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-muted-foreground">
                          {new Date(sighting.sightedAt).toLocaleString()}
                        </p>
                        <Badge variant={sighting.status === "found" ? "found" : "notFound"}>
                          {sighting.status === "found" ? "Found" : "Not Found"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Beta Notice */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-2xl text-center">
            <Badge variant="outline" className="mb-4 text-sm px-3 py-1">Beta</Badge>
            <h2 className="text-2xl font-bold mb-4">
              We&apos;re Just Getting Started
            </h2>
            <p className="text-muted-foreground mb-6">
              Cardboard Tracker is currently in beta. Help us build the best restock tracker
              by reporting sightings at your local stores. All features are free while we&apos;re
              in beta — jump in and let us know what you think!
            </p>
            <div className="grid gap-4 md:grid-cols-3 text-left mt-8">
              <Card className="card-hover border-l-4 border-l-psychic">
                <CardHeader>
                  <CardTitle className="text-base">Report Sightings</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Spot trading cards at a store? Report it to help the community
                  know where to find them.
                </CardContent>
              </Card>
              <Card className="card-hover border-l-4 border-l-water">
                <CardHeader>
                  <CardTitle className="text-base">Explore the Map</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  See nearby stores, recent reports, and discover creatures hiding
                  at each location.
                </CardContent>
              </Card>
              <Card className="card-hover border-l-4 border-l-grass">
                <CardHeader>
                  <CardTitle className="text-base">Collect Creatures</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Every report earns you a mystery box. Open them to discover and
                  collect unique cardboard creatures.
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* TODO: re-enable when premium tier launches
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-2xl font-bold mb-8 text-center">
              Why Go <span className="text-gold">Premium</span>?
            </h2>
            <div className="grid gap-6 md:grid-cols-3">
              <Card className="card-hover border-l-4 border-l-psychic">
                <CardHeader>
                  <CardTitle className="text-base">Restock Heatmaps</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  See the best days and times to check each store based on
                  historical restock patterns.
                </CardContent>
              </Card>
              <Card className="card-hover border-l-4 border-l-water">
                <CardHeader>
                  <CardTitle className="text-base">Email Alerts</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Get notified when products you want are spotted at stores in
                  your area.
                </CardContent>
              </Card>
              <Card className="card-hover border-l-4 border-l-grass">
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
        */}
      </main>
    </div>
  );
}
