import type { Metadata } from "next";

import { Pagination } from "@/components/store/pagination";
import { ProductGrid } from "@/components/store/product-grid";
import { ShopFilters } from "@/components/store/shop-filters";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { dataRepository } from "@/lib/data";
import type { ProductSort } from "@/lib/data/types";
import { BRAND } from "@/lib/brand";
import {
  firstSearchParam,
  parsePageParam,
  parsePriceParam,
} from "@/lib/store-format";

export const metadata: Metadata = {
  title: "Shop",
  description: `Explore the full ${BRAND.name} collection.`,
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
  const categorySlug = firstSearchParam(params.category);
  const [categories, filterOptions, selectedCategory] = await Promise.all([
    dataRepository.getCategories(),
    dataRepository.getFilterOptions(),
    categorySlug
      ? dataRepository.getCategoryBySlug(categorySlug)
      : Promise.resolve(null),
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

  const { products, totalCount } = await dataRepository.getProducts(
    {
      categoryId: selectedCategory?.id,
      color,
      maxPrice,
      minPrice,
      pageSize: 12,
      query,
      size,
    },
    sort,
    page,
  );

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
