import type { ReactNode } from "react";

import { CartProvider } from "@/components/store/cart-provider";
import { CatalogUnavailable } from "@/components/store/catalog-unavailable";
import { SiteFooter } from "@/components/store/site-footer";
import { SiteHeader } from "@/components/store/site-header";
import { dataRepository } from "@/lib/data";
import type { Category } from "@/lib/data/types";

export const revalidate = 60;

export default async function StoreLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  let categories: Category[];
  try {
    categories = await dataRepository.getCategories();
  } catch (error) {
    console.error("Could not load catalog categories.", error);
    if ((process.env.NEXT_PUBLIC_DATA_SOURCE ?? "supabase") !== "mock") {
      return (
        <CatalogUnavailable
          errorMessage={
            process.env.NODE_ENV === "development"
              ? error instanceof Error
                ? error.message
                : String(error)
              : undefined
          }
        />
      );
    }
    throw error;
  }

  return (
    <CartProvider>
      <SiteHeader categories={categories} />
      {children}
      <SiteFooter categories={categories} />
    </CartProvider>
  );
}
