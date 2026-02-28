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
import { createProduct } from "@/app/admin/products/actions";

const productTypes = [
  { value: "etb", label: "Elite Trainer Box" },
  { value: "booster_box", label: "Booster Box" },
  { value: "tin", label: "Tin" },
  { value: "blister", label: "Blister Pack" },
  { value: "collection_box", label: "Collection Box" },
  { value: "other", label: "Other" },
] as const;

export function ProductForm() {
  async function handleSubmit(formData: FormData) {
    await createProduct({
      name: formData.get("name") as string,
      setName: formData.get("setName") as string,
      productType: formData.get("productType") as
        | "etb"
        | "booster_box"
        | "tin"
        | "blister"
        | "collection_box"
        | "other",
      releaseDate: new Date(formData.get("releaseDate") as string),
      imageUrl: (formData.get("imageUrl") as string) || null,
    });
  }

  return (
    <form action={handleSubmit} className="space-y-4 max-w-md">
      <div>
        <Label htmlFor="name">Product Name</Label>
        <Input
          id="name"
          name="name"
          required
          placeholder="e.g., Prismatic Evolutions ETB"
        />
      </div>
      <div>
        <Label htmlFor="setName">Set Name</Label>
        <Input
          id="setName"
          name="setName"
          required
          placeholder="e.g., Prismatic Evolutions"
        />
      </div>
      <div>
        <Label htmlFor="productType">Product Type</Label>
        <Select name="productType" required>
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            {productTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="releaseDate">Release Date</Label>
        <Input
          id="releaseDate"
          name="releaseDate"
          type="date"
          required
        />
      </div>
      <div>
        <Label htmlFor="imageUrl">Image URL (optional)</Label>
        <Input
          id="imageUrl"
          name="imageUrl"
          placeholder="https://..."
        />
      </div>
      <Button type="submit">Add Product</Button>
    </form>
  );
}
