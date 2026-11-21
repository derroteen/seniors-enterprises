import type { ReactNode } from "react";

import { requireAdminPage } from "@/lib/admin/auth";

export default async function ProtectedAdminLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  await requireAdminPage();
  return children;
}
