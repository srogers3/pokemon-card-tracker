# Pokemon Card Tracker - Implementation Plan C: Admin CRUD

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a Next.js web app for tracking Pokemon card restock sightings at retail stores, with free/premium tiers, admin tools, and pattern analytics.

**Architecture:** Next.js 14 App Router with server components by default. Neon PostgreSQL via Drizzle ORM for data. Clerk for auth with DB-stored subscription tiers. Stripe for payments. Server actions and API routes for mutations.

**Tech Stack:** Next.js 14+, TypeScript, Tailwind CSS, shadcn/ui, Drizzle ORM, Neon PostgreSQL, Clerk, Stripe, Resend, Vercel

**Reference:** Design doc at `docs/plans/2026-02-21-pokemon-card-tracker-design.md`

**Prerequisites:** Plans A-B completed (project scaffolded, database ready, Clerk auth configured).

---

## Phase 4: Admin — Stores & Products CRUD

### Task 4.1: Create Admin Layout with Navigation

**Files:**
- Create: `src/app/admin/layout.tsx`
- Create: `src/app/admin/page.tsx`
- Create: `src/components/admin-nav.tsx`

**Step 1: Create admin nav component**

Create `src/components/admin-nav.tsx`:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/stores", label: "Stores" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/sightings", label: "Sightings" },
  { href: "/admin/verification", label: "Verification Queue" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-4 border-b pb-4 mb-6">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            "text-sm font-medium transition-colors hover:text-primary",
            pathname === link.href
              ? "text-primary"
              : "text-muted-foreground"
          )}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
```

**Step 2: Create admin layout**

Create `src/app/admin/layout.tsx`:

```tsx
import { requireAdmin } from "@/lib/auth";
import { AdminNav } from "@/components/admin-nav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      <AdminNav />
      {children}
    </div>
  );
}
```

**Step 3: Create admin index page**

Create `src/app/admin/page.tsx`:

```tsx
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
```

**Step 4: Verify build**

Run: `npm run build`
Expected: Build succeeds.

**Step 5: Commit**

```bash
git add src/app/admin/ src/components/admin-nav.tsx
git commit -m "feat: add admin layout with navigation and stats dashboard"
```

### Task 4.2: Admin Stores CRUD

**Files:**
- Create: `src/app/admin/stores/page.tsx`
- Create: `src/app/admin/stores/actions.ts`
- Create: `src/components/store-form.tsx`

**Step 1: Create server actions for stores**

Create `src/app/admin/stores/actions.ts`:

```typescript
"use server";

import { db } from "@/db";
import { stores, NewStore } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createStore(data: Omit<NewStore, "id" | "createdAt">) {
  await requireAdmin();
  await db.insert(stores).values(data);
  revalidatePath("/admin/stores");
}

export async function deleteStore(id: string) {
  await requireAdmin();
  await db.delete(stores).where(eq(stores.id, id));
  revalidatePath("/admin/stores");
}
```

**Step 2: Create store form component**

Create `src/components/store-form.tsx`:

```tsx
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
import { useActionState } from "react";

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
```

**Step 3: Create stores list page**

Create `src/app/admin/stores/page.tsx`:

```tsx
import { db } from "@/db";
import { stores } from "@/db/schema";
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
import { StoreForm } from "@/components/store-form";
import { Button } from "@/components/ui/button";
import { deleteStore } from "./actions";

export default async function AdminStoresPage() {
  const allStores = await db
    .select()
    .from(stores)
    .orderBy(desc(stores.createdAt));

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold mb-4">Add Store</h2>
        <StoreForm />
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">
          All Stores ({allStores.length})
        </h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Specific Location</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allStores.map((store) => (
              <TableRow key={store.id}>
                <TableCell className="font-medium">{store.name}</TableCell>
                <TableCell>{store.locationLabel}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{store.storeType}</Badge>
                </TableCell>
                <TableCell>{store.specificLocation ?? "—"}</TableCell>
                <TableCell>
                  <form action={deleteStore.bind(null, store.id)}>
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
```

**Step 4: Verify build**

Run: `npm run build`
Expected: Build succeeds.

**Step 5: Commit**

```bash
git add src/app/admin/stores/ src/components/store-form.tsx
git commit -m "feat: add admin stores CRUD (create, list, delete)"
```

### Task 4.3: Admin Products CRUD

**Files:**
- Create: `src/app/admin/products/page.tsx`
- Create: `src/app/admin/products/actions.ts`
- Create: `src/components/product-form.tsx`

**Step 1: Create server actions for products**

Create `src/app/admin/products/actions.ts`:

```typescript
"use server";

import { db } from "@/db";
import { products, NewProduct } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createProduct(
  data: Omit<NewProduct, "id" | "createdAt">
) {
  await requireAdmin();
  await db.insert(products).values(data);
  revalidatePath("/admin/products");
}

export async function deleteProduct(id: string) {
  await requireAdmin();
  await db.delete(products).where(eq(products.id, id));
  revalidatePath("/admin/products");
}
```

**Step 2: Create product form component**

Create `src/components/product-form.tsx`:

```tsx
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
```

**Step 3: Create products list page**

Create `src/app/admin/products/page.tsx`:

```tsx
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
    <div className="space-y-8">
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
```

**Step 4: Verify build**

Run: `npm run build`
Expected: Build succeeds.

**Step 5: Commit**

```bash
git add src/app/admin/products/ src/components/product-form.tsx
git commit -m "feat: add admin products CRUD (create, list, delete)"
```

---

## Phase 5: Admin — Sightings Management

### Task 5.1: Admin Sightings Entry

**Files:**
- Create: `src/app/admin/sightings/page.tsx`
- Create: `src/app/admin/sightings/actions.ts`
- Create: `src/components/sighting-form.tsx`

**Step 1: Create server actions for sightings**

Create `src/app/admin/sightings/actions.ts`:

```typescript
"use server";

import { db } from "@/db";
import { restockSightings } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";

export async function createAdminSighting(formData: FormData) {
  const user = await requireAdmin();
  const { userId } = await auth();

  await db.insert(restockSightings).values({
    storeId: formData.get("storeId") as string,
    productId: formData.get("productId") as string,
    reportedBy: userId!,
    sightedAt: new Date(formData.get("sightedAt") as string),
    status: formData.get("status") as "in_stock" | "limited" | "out_of_stock",
    verified: true, // Admin sightings are auto-verified
    source: "admin",
    notes: (formData.get("notes") as string) || null,
  });

  revalidatePath("/admin/sightings");
}

export async function deleteSighting(id: string) {
  await requireAdmin();
  await db.delete(restockSightings).where(eq(restockSightings.id, id));
  revalidatePath("/admin/sightings");
}
```

**Step 2: Create sighting form**

Create `src/components/sighting-form.tsx`:

```tsx
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
            <SelectItem value="in_stock">In Stock</SelectItem>
            <SelectItem value="limited">Limited</SelectItem>
            <SelectItem value="out_of_stock">Out of Stock</SelectItem>
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
```

**Step 3: Create sightings list page**

Create `src/app/admin/sightings/page.tsx`:

```tsx
import { db } from "@/db";
import { restockSightings, stores, products } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SightingForm } from "@/components/sighting-form";
import { deleteSighting } from "./actions";

export default async function AdminSightingsPage() {
  const [allStores, allProducts, allSightings] = await Promise.all([
    db.select().from(stores).orderBy(stores.name),
    db.select().from(products).orderBy(products.name),
    db
      .select({
        id: restockSightings.id,
        storeName: stores.name,
        storeLocation: stores.locationLabel,
        productName: products.name,
        sightedAt: restockSightings.sightedAt,
        status: restockSightings.status,
        source: restockSightings.source,
        verified: restockSightings.verified,
        notes: restockSightings.notes,
      })
      .from(restockSightings)
      .innerJoin(stores, eq(restockSightings.storeId, stores.id))
      .innerJoin(products, eq(restockSightings.productId, products.id))
      .orderBy(desc(restockSightings.sightedAt))
      .limit(100),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold mb-4">Report Sighting</h2>
        <SightingForm stores={allStores} products={allProducts} />
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Recent Sightings</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Store</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Sighted At</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Verified</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allSightings.map((sighting) => (
              <TableRow key={sighting.id}>
                <TableCell>
                  {sighting.storeName} — {sighting.storeLocation}
                </TableCell>
                <TableCell>{sighting.productName}</TableCell>
                <TableCell>
                  {new Date(sighting.sightedAt).toLocaleString()}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      sighting.status === "in_stock"
                        ? "default"
                        : sighting.status === "limited"
                        ? "secondary"
                        : "destructive"
                    }
                  >
                    {sighting.status}
                  </Badge>
                </TableCell>
                <TableCell>{sighting.source}</TableCell>
                <TableCell>{sighting.verified ? "Yes" : "No"}</TableCell>
                <TableCell>
                  <form action={deleteSighting.bind(null, sighting.id)}>
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
```

**Step 4: Verify build**

Run: `npm run build`
Expected: Build succeeds.

**Step 5: Commit**

```bash
git add src/app/admin/sightings/ src/components/sighting-form.tsx
git commit -m "feat: add admin sightings management (create, list, delete)"
```

### Task 5.2: Community Tip Verification Queue

**Files:**
- Create: `src/app/admin/verification/page.tsx`
- Create: `src/app/admin/verification/actions.ts`

**Step 1: Create verification actions**

Create `src/app/admin/verification/actions.ts`:

```typescript
"use server";

import { db } from "@/db";
import { restockSightings } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function verifySighting(id: string) {
  await requireAdmin();
  await db
    .update(restockSightings)
    .set({ verified: true })
    .where(eq(restockSightings.id, id));
  revalidatePath("/admin/verification");
}

export async function rejectSighting(id: string) {
  await requireAdmin();
  await db.delete(restockSightings).where(eq(restockSightings.id, id));
  revalidatePath("/admin/verification");
}
```

**Step 2: Create verification queue page**

Create `src/app/admin/verification/page.tsx`:

```tsx
import { db } from "@/db";
import { restockSightings, stores, products } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { verifySighting, rejectSighting } from "./actions";

export default async function VerificationPage() {
  const pendingTips = await db
    .select({
      id: restockSightings.id,
      storeName: stores.name,
      storeLocation: stores.locationLabel,
      productName: products.name,
      sightedAt: restockSightings.sightedAt,
      status: restockSightings.status,
      notes: restockSightings.notes,
      reportedBy: restockSightings.reportedBy,
      createdAt: restockSightings.createdAt,
    })
    .from(restockSightings)
    .innerJoin(stores, eq(restockSightings.storeId, stores.id))
    .innerJoin(products, eq(restockSightings.productId, products.id))
    .where(
      and(
        eq(restockSightings.source, "community"),
        eq(restockSightings.verified, false)
      )
    )
    .orderBy(desc(restockSightings.createdAt));

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">
        Pending Community Tips ({pendingTips.length})
      </h2>
      {pendingTips.length === 0 ? (
        <p className="text-muted-foreground">No tips pending verification.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Store</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Sighted At</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pendingTips.map((tip) => (
              <TableRow key={tip.id}>
                <TableCell>
                  {tip.storeName} — {tip.storeLocation}
                </TableCell>
                <TableCell>{tip.productName}</TableCell>
                <TableCell>
                  {new Date(tip.sightedAt).toLocaleString()}
                </TableCell>
                <TableCell>
                  <Badge>{tip.status}</Badge>
                </TableCell>
                <TableCell>{tip.notes ?? "—"}</TableCell>
                <TableCell className="space-x-2">
                  <form
                    action={verifySighting.bind(null, tip.id)}
                    className="inline"
                  >
                    <Button size="sm" type="submit">
                      Approve
                    </Button>
                  </form>
                  <form
                    action={rejectSighting.bind(null, tip.id)}
                    className="inline"
                  >
                    <Button variant="destructive" size="sm" type="submit">
                      Reject
                    </Button>
                  </form>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
```

**Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds.

**Step 4: Commit**

```bash
git add src/app/admin/verification/
git commit -m "feat: add community tip verification queue for admins"
```

---
