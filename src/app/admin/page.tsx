import { db } from "@/db";
import { stores, products, restockSightings, users } from "@/db/schema";
import { count } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminDashboard() {
  const [storeCount] = await db.select({ value: count() }).from(stores);
  const [productCount] = await db.select({ value: count() }).from(products);
  const [sightingCount] = await db
    .select({ value: count() })
    .from(restockSightings);
  const [userCount] = await db.select({ value: count() }).from(users);

  const stats = [
    { label: "Stores", value: storeCount.value },
    { label: "Products", value: productCount.value },
    { label: "Sightings", value: sightingCount.value },
    { label: "Users", value: userCount.value },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
