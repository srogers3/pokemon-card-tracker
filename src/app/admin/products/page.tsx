import { db } from "@/db";
import { products } from "@/db/schema";
import { desc } from "drizzle-orm";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ProductForm } from "@/components/product-form";
import { Button } from "@/components/ui/button";
import { deleteProduct } from "./actions";

export default async function AdminProductsPage() {
  const allProducts = await db
    .select()
    .from(products)
    .orderBy(desc(products.createdAt));

  return (
    <div className="space-y-8 page-fade-in">
      <div>
        <h2 className="text-xl font-semibold mb-4">Add Product</h2>
        <ProductForm />
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">
          All Products ({allProducts.length})
        </h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Set</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allProducts.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell>{product.setName}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{product.productType}</Badge>
                </TableCell>
                <TableCell>
                  <form action={deleteProduct.bind(null, product.id)}>
                    <Button variant="destructive" size="sm" type="submit">
                      Delete
                    </Button>
                  </form>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
