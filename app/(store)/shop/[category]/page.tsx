import type { Metadata } from "next";
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
            <ProductGrid products={products} />
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
