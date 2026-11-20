import type { Metadata } from "next";

import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { mockRepository } from "@/lib/data/mock/repository";

export const metadata: Metadata = {
  title: "Demo admin",
  description: "Local-only demo administration for Seniors Enterprises.",
};

export default async function AdminPage() {
  const [categories, productResults] = await Promise.all([
    mockRepository.getCategories(),
    mockRepository.getProducts({ pageSize: 100 }, "newest", 1),
  ]);

  return (
    <main>
      <AdminDashboard
        initialCatalog={{
          categories,
          products: productResults.products,
        }}
      />
    </main>
  );
}
