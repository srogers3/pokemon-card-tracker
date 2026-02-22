import { db } from "@/db";
import { restockSightings, stores, products } from "@/db/schema";
import { desc, eq, and, gte } from "drizzle-orm";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getCurrentUser } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const isPremium = user?.subscriptionTier === "premium";
  const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

  const sightings = await db
    .select({
      id: restockSightings.id,
      storeName: stores.name,
      storeLocation: stores.locationLabel,
      productName: products.name,
      sightedAt: restockSightings.sightedAt,
      status: restockSightings.status,
      notes: restockSightings.notes,
    })
    .from(restockSightings)
    .innerJoin(stores, eq(restockSightings.storeId, stores.id))
    .innerJoin(products, eq(restockSightings.productId, products.id))
    .where(
      and(
        eq(restockSightings.verified, true),
        isPremium ? undefined : gte(restockSightings.sightedAt, fortyEightHoursAgo)
      )
    )
    .orderBy(desc(restockSightings.sightedAt))
    .limit(isPremium ? 200 : 50);

  const statusVariant = (status: string) => {
    if (status === "found") return "found" as const;
    return "notFound" as const;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">
          {isPremium ? "All Sightings" : "Recent Sightings (Last 48h)"}
        </h2>
        {!isPremium && (
          <Link href="/dashboard/upgrade">
            <Button variant="gold" size="sm">Upgrade for Full History</Button>
          </Link>
        )}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>Store</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Sighted</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sightings.map((s, i) => (
            <TableRow key={s.id} className={i % 2 === 0 ? "" : "bg-muted/30"}>
              <TableCell className="font-medium">{s.productName}</TableCell>
              <TableCell>{s.storeName}</TableCell>
              <TableCell>{s.storeLocation}</TableCell>
              <TableCell>
                <Badge variant={statusVariant(s.status)}>{s.status === "found" ? "Found" : "Not Found"}</Badge>
              </TableCell>
              <TableCell>
                {new Date(s.sightedAt).toLocaleString()}
              </TableCell>
            </TableRow>
          ))}
          {sightings.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                No sightings found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Premium teaser */}
      {!isPremium && (
        <Card className="mt-8 card-hover border-gold/30 gold-glow">
          <CardHeader>
            <CardTitle className="text-base">Unlock More Features</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Premium members get full sighting history, restock heatmaps, email
            alerts, and the ability to submit community tips.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
