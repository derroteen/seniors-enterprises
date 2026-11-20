import type { ReactNode } from "react";
import { notFound } from "next/navigation";

export default function AdminLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  // Admin UI has no authentication yet, so never expose it in production.
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return children;
}
