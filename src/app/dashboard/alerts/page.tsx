import { requirePremium } from "@/lib/auth";
import { db } from "@/db";
import { alertPreferences, products, stores } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createAlert, deleteAlert } from "./actions";

export default async function AlertsPage() {
  await requirePremium();
  const { userId } = await auth();

  const [allProducts, alerts, allStores] = await Promise.all([
    db.select().from(products).orderBy(products.name),
    db
      .select({
        id: alertPreferences.id,
        productName: products.name,
        region: alertPreferences.region,
      })
      .from(alertPreferences)
      .leftJoin(products, eq(alertPreferences.productId, products.id))
      .where(eq(alertPreferences.userId, userId!)),
    db
      .selectDistinct({ locationLabel: stores.locationLabel })
      .from(stores)
      .orderBy(stores.locationLabel),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold mb-4">Add Alert</h2>
        <form action={createAlert} className="space-y-4 max-w-md">
          <div>
            <Label htmlFor="productId">Product (optional)</Label>
            <Select name="productId">
              <SelectTrigger>
                <SelectValue placeholder="Any product" />
              </SelectTrigger>
              <SelectContent>
                {allProducts.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="region">Region (optional)</Label>
            <Select name="region">
              <SelectTrigger>
                <SelectValue placeholder="Any region" />
              </SelectTrigger>
              <SelectContent>
                {allStores.map((s) => (
                  <SelectItem key={s.locationLabel} value={s.locationLabel}>
                    {s.locationLabel}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit">Create Alert</Button>
        </form>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">
          Your Alerts ({alerts.length})
        </h2>
        {alerts.length === 0 ? (
          <p className="text-muted-foreground">No alerts configured yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Region</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alerts.map((alert) => (
                <TableRow key={alert.id}>
                  <TableCell>{alert.productName ?? "Any"}</TableCell>
                  <TableCell>{alert.region ?? "Any"}</TableCell>
                  <TableCell>
                    <form action={deleteAlert.bind(null, alert.id)}>
                      <Button variant="destructive" size="sm" type="submit">
                        Remove
                      </Button>
                    </form>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
