import { db } from "@/db";
import { restockSightings, stores, products } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { verifySighting, rejectSighting } from "./actions";

export default async function VerificationPage() {
  const pendingTips = await db
    .select({
      id: restockSightings.id,
      storeName: stores.name,
      storeLocation: stores.locationLabel,
      productName: products.name,
      sightedAt: restockSightings.sightedAt,
      status: restockSightings.status,
      notes: restockSightings.notes,
      reportedBy: restockSightings.reportedBy,
      createdAt: restockSightings.createdAt,
    })
    .from(restockSightings)
    .innerJoin(stores, eq(restockSightings.storeId, stores.id))
    .innerJoin(products, eq(restockSightings.productId, products.id))
    .where(
      and(
        eq(restockSightings.source, "community"),
        eq(restockSightings.verified, false)
      )
    )
    .orderBy(desc(restockSightings.createdAt));

  return (
    <div className="page-fade-in">
      <h2 className="text-xl font-semibold mb-4">
        Pending Community Tips ({pendingTips.length})
      </h2>
      {pendingTips.length === 0 ? (
        <p className="text-muted-foreground">No tips pending verification.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Store</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Sighted At</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pendingTips.map((tip) => (
              <TableRow key={tip.id}>
                <TableCell>
                  {tip.storeName} — {tip.storeLocation}
                </TableCell>
                <TableCell>{tip.productName}</TableCell>
                <TableCell>
                  {new Date(tip.sightedAt).toLocaleString()}
                </TableCell>
                <TableCell>
                  <Badge>{tip.status}</Badge>
                </TableCell>
                <TableCell>{tip.notes ?? "—"}</TableCell>
                <TableCell className="space-x-2">
                  <form
                    action={verifySighting.bind(null, tip.id)}
                    className="inline"
                  >
                    <Button size="sm" type="submit">
                      Approve
                    </Button>
                  </form>
                  <form
                    action={rejectSighting.bind(null, tip.id)}
                    className="inline"
                  >
                    <Button variant="destructive" size="sm" type="submit">
                      Reject
                    </Button>
                  </form>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
