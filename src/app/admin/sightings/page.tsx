import { db } from "@/db";
import { restockSightings, stores, products } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
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
import { SightingForm } from "@/components/sighting-form";
import { deleteSighting } from "./actions";

export default async function AdminSightingsPage() {
  const [allStores, allProducts, allSightings] = await Promise.all([
    db.select().from(stores).orderBy(stores.name),
    db.select().from(products).orderBy(desc(products.releaseDate), products.name),
    db
      .select({
        id: restockSightings.id,
        storeName: stores.name,
        storeLocation: stores.locationLabel,
        productName: products.name,
        sightedAt: restockSightings.sightedAt,
        status: restockSightings.status,
        source: restockSightings.source,
        verified: restockSightings.verified,
        notes: restockSightings.notes,
      })
      .from(restockSightings)
      .innerJoin(stores, eq(restockSightings.storeId, stores.id))
      .innerJoin(products, eq(restockSightings.productId, products.id))
      .orderBy(desc(restockSightings.sightedAt))
      .limit(100),
  ]);

  return (
    <div className="space-y-8 page-fade-in">
      <div>
        <h2 className="text-xl font-semibold mb-4">Report Sighting</h2>
        <SightingForm stores={allStores} products={allProducts} />
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Recent Sightings</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Store</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Sighted At</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Verified</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allSightings.map((sighting) => (
              <TableRow key={sighting.id}>
                <TableCell>
                  {sighting.storeName} — {sighting.storeLocation}
                </TableCell>
                <TableCell>{sighting.productName}</TableCell>
                <TableCell>
                  {new Date(sighting.sightedAt).toLocaleString()}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      sighting.status === "found"
                        ? "default"
                        : "destructive"
                    }
                  >
                    {sighting.status === "found" ? "Found" : "Not Found"}
                  </Badge>
                </TableCell>
                <TableCell>{sighting.source}</TableCell>
                <TableCell>{sighting.verified ? "Yes" : "No"}</TableCell>
                <TableCell>
                  <form action={deleteSighting.bind(null, sighting.id)}>
                    <Button variant="destructive" size="sm" type="submit">
                      Delete
                    </Button>
                  </form>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
