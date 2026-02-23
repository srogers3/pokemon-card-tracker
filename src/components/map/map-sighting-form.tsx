"use client";

import { useRef } from "react";
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
import type { Product } from "@/db/schema";

export function MapSightingForm({
  storeId,
  products,
  onCancel,
}: {
  storeId: string;
  products: Product[];
  onCancel: () => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(formData: FormData) {
    formData.set("storeId", storeId);
    await submitTip(formData);
    formRef.current?.reset();
    onCancel();
  }

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-3">
      <h4 className="text-sm font-semibold">Report Sighting</h4>

      <input type="hidden" name="storeId" value={storeId} />

      <div>
        <Label htmlFor="map-productId" className="text-xs">Product</Label>
        <Select name="productId" required>
          <SelectTrigger className="h-9">
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
        <Label htmlFor="map-status" className="text-xs">Stock Status</Label>
        <Select name="status" required>
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="found">Yes — Found cards!</SelectItem>
            <SelectItem value="not_found">No — Shelves were empty</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="map-sightedAt" className="text-xs">When</Label>
        <Input
          type="datetime-local"
          name="sightedAt"
          id="map-sightedAt"
          className="h-9"
          required
          defaultValue={new Date().toISOString().slice(0, 16)}
        />
      </div>

      <div>
        <Label htmlFor="map-notes" className="text-xs">Notes (optional)</Label>
        <Textarea name="notes" id="map-notes" rows={2} className="text-sm" />
      </div>

      <div className="flex gap-2">
        <Button type="submit" variant="accent" size="sm" className="flex-1">
          Submit
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
