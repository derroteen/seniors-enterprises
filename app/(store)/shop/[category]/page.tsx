import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

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

type PageProps = {
  params: Promise<{ category: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function parseSort(value: string | undefined): ProductSort {
  if (value === "price-asc" || value === "price-desc") {
    return value;
  }
  return "newest";
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category: categorySlug } = await params;
  const category = await dataRepository.getCategoryBySlug(categorySlug);
  return {
    title: category?.name ?? "Shop category",
    description: category
      ? `Explore ${category.name} from ${BRAND.name}.`
      : `Explore the ${BRAND.name} collection.`,
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: PageProps) {
  const [{ category: categorySlug }, queryParams] = await Promise.all([
    params,
    searchParams,
  ]);
  const category = await dataRepository.getCategoryBySlug(categorySlug);
  if (!category) {
    notFound();
  }

  const [categories, filterOptions] = await Promise.all([
    dataRepository.getCategories(),
    dataRepository.getFilterOptions(),
  ]);
  const query = firstSearchParam(queryParams.q)?.trim().slice(0, 100) ?? "";
  const size = firstSearchParam(queryParams.size) ?? "";
  const color = firstSearchParam(queryParams.color) ?? "";
  const minPriceValue = firstSearchParam(queryParams.minPrice);
  const maxPriceValue = firstSearchParam(queryParams.maxPrice);
  const sort = parseSort(firstSearchParam(queryParams.sort));
  const page = parsePageParam(firstSearchParam(queryParams.page));
  const { products, totalCount } = await dataRepository.getProducts(
    {
      categoryId: category.id,
      color,
      maxPrice: parsePriceParam(maxPriceValue),
      minPrice: parsePriceParam(minPriceValue),
      pageSize: 12,
      query,
      size,
    },
    sort,
    page,
  );
  const pageSize = 12;
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));

  // A category with no products at all gets a clean empty state — no filters
  // or sort controls that cannot return anything.
  let categoryIsEmpty = false;
  if (products.length === 0) {
    const unfiltered = await dataRepository.getProducts(
      { categoryId: category.id, pageSize: 1 },
      "newest",
      1,
    );
    categoryIsEmpty = unfiltered.totalCount === 0;
  }
  const hasActiveFilters = Boolean(
    query || size || color || minPriceValue || maxPriceValue || page > 1,
  );

  if (categoryIsEmpty) {
    return (
      <main>
        <Section>
          <Container>
            <p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary">
              Collection
            </p>
            <h1 className="mt-2 font-display text-4xl font-semibold">
              {category.name}
            </h1>
            <div className="mt-8 rounded-2xl border border-dashed border-border bg-surface px-6 py-12 text-center">
              <h2 className="font-display text-xl font-semibold">
                No products in this category yet.
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Check back soon, or browse everything else in the shop.
              </p>
              <Link
                href="/shop"
                className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                Back to shop
              </Link>
            </div>
          </Container>
        </Section>
      </main>
    );
  }

  return (
    <main>
      <Section>
        <Container>
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary">
            Collection
          </p>
          <h1 className="mt-2 font-display text-4xl font-semibold">
            {category.name}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {totalCount} {totalCount === 1 ? "product" : "products"}
          </p>

          <div className="mt-7">
            <ShopFilters
              activeCategorySlug={category.slug}
              categories={categories}
              colors={filterOptions.colors}
              formPath={`/shop/${category.slug}`}
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
            <ProductGrid
              products={products}
              emptyTitle="No products found"
              emptyDescription="Try adjusting your filters, or view everything in this category."
              emptyActionHref={hasActiveFilters ? `/shop/${category.slug}` : undefined}
              emptyActionLabel="Clear filters"
            />
            <Pagination
              currentPage={page}
              pageCount={pageCount}
              pathname={`/shop/${category.slug}`}
              searchParams={queryParams}
            />
          </div>
        </Container>
      </Section>
    </main>
  );
}
