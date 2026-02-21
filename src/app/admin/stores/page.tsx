import { db } from "@/db";
import { stores } from "@/db/schema";
import { desc } from "drizzle-orm";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { StoreForm } from "@/components/store-form";
import { Button } from "@/components/ui/button";
import { deleteStore } from "./actions";

export default async function AdminStoresPage() {
  const allStores = await db
    .select()
    .from(stores)
    .orderBy(desc(stores.createdAt));

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold mb-4">Add Store</h2>
        <StoreForm />
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">
          All Stores ({allStores.length})
        </h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Specific Location</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allStores.map((store) => (
              <TableRow key={store.id}>
                <TableCell className="font-medium">{store.name}</TableCell>
                <TableCell>{store.locationLabel}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{store.storeType}</Badge>
                </TableCell>
                <TableCell>{store.specificLocation ?? "—"}</TableCell>
                <TableCell>
                  <form action={deleteStore.bind(null, store.id)}>
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
