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
import { createStore } from "@/app/admin/stores/actions";

const storeTypes = [
  { value: "big_box", label: "Big Box" },
  { value: "lgs", label: "Local Game Store" },
  { value: "grocery", label: "Grocery" },
  { value: "pharmacy", label: "Pharmacy" },
  { value: "other", label: "Other" },
] as const;

export function StoreForm() {
  async function handleSubmit(formData: FormData) {
    await createStore({
      name: formData.get("name") as string,
      locationLabel: formData.get("locationLabel") as string,
      storeType: formData.get("storeType") as
        | "big_box"
        | "lgs"
        | "grocery"
        | "pharmacy"
        | "other",
      specificLocation: (formData.get("specificLocation") as string) || null,
    });
  }

  return (
    <form action={handleSubmit} className="space-y-4 max-w-md">
      <div>
        <Label htmlFor="name">Store Name</Label>
        <Input id="name" name="name" required placeholder="e.g., Target" />
      </div>
      <div>
        <Label htmlFor="locationLabel">Location</Label>
        <Input
          id="locationLabel"
          name="locationLabel"
          required
          placeholder="e.g., Columbus, OH"
        />
      </div>
      <div>
        <Label htmlFor="storeType">Store Type</Label>
        <Select name="storeType" required>
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            {storeTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="specificLocation">Specific Location (optional)</Label>
        <Input
          id="specificLocation"
          name="specificLocation"
          placeholder="e.g., Main St location"
        />
      </div>
      <Button type="submit">Add Store</Button>
    </form>
  );
}
