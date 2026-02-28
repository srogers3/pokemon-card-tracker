"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
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
import { UnboxRevealModal, type UnboxData } from "@/components/unbox-reveal-modal";
import type { Product } from "@/db/schema";

export function MapSightingForm({
  storeId,
  products,
  userLatitude,
  userLongitude,
  onCancel,
  onSubmitSuccess,
}: {
  storeId: string;
  products: Product[];
  userLatitude: number | null;
  userLongitude: number | null;
  onCancel: () => void;
  onSubmitSuccess: () => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [status, setStatus] = useState<string>("");
  const [productId, setProductId] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [revealOpenings, setRevealOpenings] = useState<UnboxData[] | null>(null);

  async function handleSubmit(formData: FormData) {
    setError("");
    if (!status) {
      setError("Please select a stock status.");
      return;
    }
    if (status === "found" && !productId) {
      setError("Please select a product.");
      return;
    }
    formData.set("storeId", storeId);
    if (userLatitude !== null && userLongitude !== null) {
      formData.set("userLatitude", userLatitude.toString());
      formData.set("userLongitude", userLongitude.toString());
    }
    const result = await submitTip(formData);
    formRef.current?.reset();
    setStatus("");
    setProductId("");

    if (result?.opened && result.openings?.length) {
      setRevealOpenings(result.openings);
    } else {
      onSubmitSuccess();
      onCancel();
    }
  }

  return (
    <>
    <form ref={formRef} action={handleSubmit} className="space-y-3">
      <h4 className="text-sm font-semibold">Report Sighting</h4>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <div>
        <Label htmlFor="map-status" className="text-xs">Stock Status</Label>
        <Select name="status" required value={status} onValueChange={(v) => { setStatus(v); setError(""); }}>
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="found">Yes — Found cards!</SelectItem>
            <SelectItem value="not_found">No — Shelves were empty</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {status !== "not_found" && (
        <div>
          <Label htmlFor="map-productId" className="text-xs">Product</Label>
          <Select name="productId" required={status === "found"} value={productId} onValueChange={(v) => { setProductId(v); setError(""); }}>
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
      )}

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

    {revealOpenings && revealOpenings.length > 0 && (
      <UnboxRevealModal
        openings={revealOpenings}
        onComplete={() => {
          setRevealOpenings(null);
          onSubmitSuccess();
          onCancel();
        }}
      />
    )}
    </>
  );
}
