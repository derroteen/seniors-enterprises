import type { Metadata } from "next";

import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { getAdminDashboardData } from "@/lib/admin/data";

export const metadata: Metadata = {
  title: "Store admin | Seniors Enterprises",
  description: "Manage the Seniors Enterprises catalog and orders.",
};

export default async function AdminPage() {
  const { categories, products, orders } = await getAdminDashboardData();

  return (
    <main>
      <AdminDashboard
        initialCatalog={{ categories, products }}
        initialOrders={orders}
      />
    </main>
  );
}
