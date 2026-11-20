import type { Metadata } from "next";

import { Pagination } from "@/components/store/pagination";
import { ProductGrid } from "@/components/store/product-grid";
import { ShopFilters } from "@/components/store/shop-filters";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import {
  getCategories,
  getCategoryBySlug,
  getFilterOptions,
  getProducts,
  type ProductSort,
} from "@/lib/store-data";
import {
  firstSearchParam,
  parsePageParam,
  parsePriceParam,
} from "@/lib/store-format";
import { createStoreSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Shop",
  description: "Explore the full Senior Enterprises collection.",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function parseSort(value: string | undefined): ProductSort {
  if (value === "price-asc" || value === "price-desc") {
    return value;
  }
  return "newest";
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const client = createStoreSupabaseClient();

  if (!client) {
    return (
      <main>
        <Section>
          <Container>
            <h1 className="font-display text-4xl font-semibold">Shop</h1>
            <p className="mt-3 text-muted-foreground">
              Products will appear here when the catalog is connected.
            </p>
          </Container>
        </Section>
      </main>
    );
  }

  const categorySlug = firstSearchParam(params.category);
  const [categories, filterOptions, selectedCategory] = await Promise.all([
    getCategories(client),
    getFilterOptions(client),
    categorySlug ? getCategoryBySlug(client, categorySlug) : Promise.resolve(null),
  ]);
  const query = firstSearchParam(params.q)?.trim().slice(0, 100) ?? "";
  const size = firstSearchParam(params.size) ?? "";
  const color = firstSearchParam(params.color) ?? "";
  const minPriceValue = firstSearchParam(params.minPrice);
  const maxPriceValue = firstSearchParam(params.maxPrice);
  const minPrice = parsePriceParam(minPriceValue);
  const maxPrice = parsePriceParam(maxPriceValue);
  const sort = parseSort(firstSearchParam(params.sort));
  const page = parsePageParam(firstSearchParam(params.page));

  const { products, totalCount } = selectedCategory || !categorySlug
    ? await getProducts(client, {
        categoryId: selectedCategory?.id,
        color,
        maxPrice,
        minPrice,
        page,
        query,
        size,
        sort,
      })
    : { products: [], totalCount: 0 };

  const pageSize = 12;
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(page, pageCount);

  return (
    <main>
      <Section>
        <Container>
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary">
            {query ? "Search" : "The collection"}
          </p>
          <h1 className="mt-2 font-display text-4xl font-semibold">
            {query ? `Results for “${query}”` : selectedCategory?.name ?? "Shop all"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {totalCount} {totalCount === 1 ? "product" : "products"}
          </p>

          <div className="mt-7">
            <ShopFilters
              activeCategorySlug={selectedCategory?.slug ?? null}
              categories={categories}
              colors={filterOptions.colors}
              formPath="/shop"
              sizes={filterOptions.sizes}
              values={{
                color,
                maxPrice: maxPriceValue ?? "",
                minPrice: minPriceValue ?? "",
                query,
                size,
                sort,
              }}
            />
          </div>

          <div className="mt-8">
            <ProductGrid products={products} />
            <Pagination
              currentPage={safePage}
              pageCount={pageCount}
              pathname="/shop"
              searchParams={params}
            />
          </div>
        </Container>
      </Section>
    </main>
  );
}
