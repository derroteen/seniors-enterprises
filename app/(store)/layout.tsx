import type { ReactNode } from "react";

import { CartProvider } from "@/components/store/cart-provider";
import { SiteFooter } from "@/components/store/site-footer";
import { SiteHeader } from "@/components/store/site-header";
import { StoreNotice } from "@/components/store/store-notice";
import { dataRepository } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function StoreLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const categories = await dataRepository.getCategories();

  return (
    <CartProvider>
      <SiteHeader categories={categories} />
      {process.env.NEXT_PUBLIC_DATA_SOURCE === "supabase" ? <StoreNotice /> : null}
      {children}
      <SiteFooter categories={categories} />
    </CartProvider>
  );
}
