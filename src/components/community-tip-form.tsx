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
import { submitTip } from "@/app/dashboard/submit/actions";
import type { Store, Product } from "@/db/schema";

export function CommunityTipForm({
  stores,
  products,
}: {
  stores: Store[];
  products: Product[];
}) {
  return (
    <form action={submitTip} className="space-y-4 max-w-md">
      <div>
        <Label htmlFor="storeId">Store</Label>
        <Select name="storeId" required>
          <SelectTrigger>
            <SelectValue placeholder="Select a store" />
          </SelectTrigger>
          <SelectContent>
            {stores.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name} — {s.locationLabel}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="productId">Product</Label>
        <Select name="productId" required>
          <SelectTrigger>
            <SelectValue placeholder="Select a product" />
          </SelectTrigger>
          <SelectContent>
            {products.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="status">Stock Status</Label>
        <Select name="status" required>
          <SelectTrigger>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="in_stock">In Stock</SelectItem>
            <SelectItem value="limited">Limited</SelectItem>
            <SelectItem value="out_of_stock">Out of Stock</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="sightedAt">Sighted At</Label>
        <Input
          type="datetime-local"
          name="sightedAt"
          id="sightedAt"
          required
        />
      </div>

      <div>
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea name="notes" id="notes" rows={3} />
      </div>

      <Button type="submit">Submit Tip</Button>
    </form>
  );
}
