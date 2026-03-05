import { requireUser } from "@/lib/auth";
import { db } from "@/db";
import { alertPreferences, products } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
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
import { groupProductsBySet } from "@/lib/products";

export default async function AlertsPage() {
  await requireUser();
  const { userId } = await auth();

  const [allProducts, alerts] = await Promise.all([
    db.select().from(products).orderBy(products.name),
    db
      .select({
        id: alertPreferences.id,
        productName: products.name,
        zipCode: alertPreferences.zipCode,
        radiusMiles: alertPreferences.radiusMiles,
        region: alertPreferences.region,
      })
      .from(alertPreferences)
      .leftJoin(products, eq(alertPreferences.productId, products.id))
      .where(eq(alertPreferences.userId, userId!)),
  ]);

  const productGroups = groupProductsBySet(allProducts);

  return (
    <div className="container mx-auto py-4 px-4 max-w-2xl page-fade-in">
      <h1 className="text-2xl font-bold mb-6">Restock Alerts</h1>

      <div className="space-y-8">
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">Create Alert</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Get notified by email when a product is restocked near you.
          </p>
          <form action={createAlert} className="space-y-4">
            <div>
              <Label htmlFor="productId">Product (optional)</Label>
              <Select name="productId">
                <SelectTrigger>
                  <SelectValue placeholder="Any product" />
                </SelectTrigger>
                <SelectContent>
                  {productGroups.map((group) => (
                    <SelectGroup key={group.setName}>
                      <SelectLabel>{group.setName}</SelectLabel>
                      {group.products.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="zipCode">Zip Code (optional)</Label>
                <Input
                  name="zipCode"
                  id="zipCode"
                  placeholder="e.g. 90210"
                  maxLength={10}
                />
              </div>
              <div>
                <Label htmlFor="radiusMiles">Radius (miles)</Label>
                <Select name="radiusMiles" defaultValue="25">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 miles</SelectItem>
                    <SelectItem value="10">10 miles</SelectItem>
                    <SelectItem value="25">25 miles</SelectItem>
                    <SelectItem value="50">50 miles</SelectItem>
                    <SelectItem value="100">100 miles</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button type="submit">Create Alert</Button>
          </form>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">
            Your Alerts ({alerts.length})
          </h2>
          {alerts.length === 0 ? (
            <p className="text-muted-foreground">No alerts configured yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alerts.map((alert) => (
                  <TableRow key={alert.id}>
                    <TableCell>{alert.productName ?? "Any product"}</TableCell>
                    <TableCell>
                      {alert.zipCode
                        ? `${alert.zipCode} (${alert.radiusMiles ?? 25} mi)`
                        : alert.region ?? "Anywhere"}
                    </TableCell>
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
    </div>
  );
}
