import type { ReactNode } from "react";
import { connection } from "next/server";

import { CartProvider } from "@/components/store/cart-provider";
import { CatalogUnavailable } from "@/components/store/catalog-unavailable";
import { SiteFooter } from "@/components/store/site-footer";
import { SiteHeader } from "@/components/store/site-header";
import { getHeaderAuthState } from "@/lib/auth/session";
import { dataRepository } from "@/lib/data";
import type { Category } from "@/lib/data/types";

export const revalidate = 60;

export default async function StoreLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  await connection();

  let categories: Category[];
  let authState: Awaited<ReturnType<typeof getHeaderAuthState>>;
  try {
    [categories, authState] = await Promise.all([
      dataRepository.getCategories(),
      getHeaderAuthState(),
    ]);
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
      <SiteHeader
        categories={categories}
        isSignedIn={authState.isSignedIn}
        showDashboard={authState.isAdmin}
      />
      {children}
      <SiteFooter categories={categories} />
    </CartProvider>
  );
}
