import type { Product } from "@/db/schema";

export type ProductGroup = {
  setName: string;
  releaseDate: Date;
  products: Product[];
};

export function groupProductsBySet(products: Product[]): ProductGroup[] {
  const groups = new Map<string, ProductGroup>();

  for (const product of products) {
    const existing = groups.get(product.setName);
    if (existing) {
      existing.products.push(product);
    } else {
      groups.set(product.setName, {
        setName: product.setName,
        releaseDate: product.releaseDate,
        products: [product],
      });
    }
  }

  const sorted = Array.from(groups.values());
  sorted.sort((a, b) => b.releaseDate.getTime() - a.releaseDate.getTime());
  for (const group of sorted) {
    group.products.sort((a, b) => a.name.localeCompare(b.name));
  }
  return sorted;
}
