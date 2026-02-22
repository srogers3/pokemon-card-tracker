"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createAdminSighting } from "@/app/admin/sightings/actions";
import type { Store, Product } from "@/db/schema";

export function SightingForm({
  stores,
  products,
}: {
  stores: Store[];
  products: Product[];
}) {
  return (
    <form action={createAdminSighting} className="space-y-4 max-w-md">
      <div>
        <Label htmlFor="storeId">Store</Label>
        <Select name="storeId" required>
          <SelectTrigger>
            <SelectValue placeholder="Select store" />
          </SelectTrigger>
          <SelectContent>
            {stores.map((store) => (
              <SelectItem key={store.id} value={store.id}>
                {store.name} — {store.locationLabel}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="productId">Product</Label>
        <Select name="productId" required>
          <SelectTrigger>
            <SelectValue placeholder="Select product" />
          </SelectTrigger>
          <SelectContent>
            {products.map((product) => (
              <SelectItem key={product.id} value={product.id}>
                {product.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="sightedAt">Sighted At</Label>
        <Input
          id="sightedAt"
          name="sightedAt"
          type="datetime-local"
          required
        />
      </div>
      <div>
        <Label htmlFor="status">Stock Status</Label>
        <Select name="status" required>
          <SelectTrigger>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="found">Found</SelectItem>
            <SelectItem value="not_found">Not Found</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea id="notes" name="notes" placeholder="Any details..." />
      </div>
      <Button type="submit">Report Sighting</Button>
    </form>
  );
}
