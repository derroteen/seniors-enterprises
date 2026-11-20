import type { ReactNode } from "react";

import { CartProvider } from "@/components/store/cart-provider";
import { SiteFooter } from "@/components/store/site-footer";
import { SiteHeader } from "@/components/store/site-header";
import { StoreNotice } from "@/components/store/store-notice";
import { getCategories } from "@/lib/store-data";
import {
  createStoreSupabaseClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function StoreLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const client = createStoreSupabaseClient();
  const categories = client ? await getCategories(client) : [];

  return (
    <CartProvider>
      <SiteHeader categories={categories} />
      {!isSupabaseConfigured() ? <StoreNotice /> : null}
      {children}
      <SiteFooter categories={categories} />
    </CartProvider>
  );
}
