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
