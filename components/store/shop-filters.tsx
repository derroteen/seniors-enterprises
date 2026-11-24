"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import type { Category, ProductSort } from "@/lib/data/types";

export interface ShopFilterValues {
  color: string;
  maxPrice: string;
  minPrice: string;
  query: string;
  size: string;
  sort: ProductSort;
}

interface ShopFiltersProps {
  activeCategorySlug: string | null;
  categories: Category[];
  formPath: string;
  values: ShopFilterValues;
  colors: string[];
  sizes: string[];
}

function categoryHref(path: string, values: ShopFilterValues) {
  const params = new URLSearchParams();
  if (values.query) params.set("q", values.query);
  if (values.size) params.set("size", values.size);
  if (values.color) params.set("color", values.color);
  if (values.minPrice) params.set("minPrice", values.minPrice);
  if (values.maxPrice) params.set("maxPrice", values.maxPrice);
  if (values.sort !== "newest") params.set("sort", values.sort);

  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

function countActiveFilters(values: ShopFilterValues) {
  let count = 0;
  if (values.size) count += 1;
  if (values.color) count += 1;
  if (values.minPrice) count += 1;
  if (values.maxPrice) count += 1;
  if (values.sort !== "newest") count += 1;
  return count;
}

export function ShopFilters({
  activeCategorySlug,
  categories,
  colors,
  formPath,
  sizes,
  values,
}: ShopFiltersProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const chipsNavRef = useRef<HTMLElement>(null);
  const activeFilterCount = countActiveFilters(values);

  useEffect(() => {
    chipsNavRef.current
      ?.querySelector('[aria-current="page"]')
      ?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [activeCategorySlug]);

  return (
    <div className="grid gap-5 rounded-2xl border border-border bg-surface p-4 sm:p-5">
      <div>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold">Category</h2>
          <button
            type="button"
            aria-expanded={filtersOpen}
            aria-controls="shop-filters-panel"
            onClick={() => setFiltersOpen((isOpen) => !isOpen)}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-medium transition-colors hover:bg-surface md:hidden"
          >
            Filters
            {activeFilterCount > 0 ? (
              <span className="grid min-w-5 place-items-center rounded-full bg-accent px-1 text-[11px] font-semibold leading-5 text-accent-foreground">
                {activeFilterCount}
              </span>
            ) : null}
          </button>
        </div>
        <nav
          ref={chipsNavRef}
          aria-label="Filter by category"
          className="mt-3 flex gap-2 overflow-x-auto pb-1"
        >
          <Link
            href={categoryHref("/shop", values)}
            aria-current={activeCategorySlug ? undefined : "page"}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm transition-colors ${
              activeCategorySlug === null
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border hover:bg-background"
            }`}
          >
            All
          </Link>
          {categories.map((category) => (
            <Link
              key={category.id}
              href={categoryHref(`/shop/${category.slug}`, values)}
              aria-current={activeCategorySlug === category.slug ? "page" : undefined}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm transition-colors ${
                activeCategorySlug === category.slug
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border hover:bg-background"
              }`}
            >
              {category.name}
            </Link>
          ))}
        </nav>
      </div>

      <div id="shop-filters-panel" className={filtersOpen ? "" : "hidden md:block"}>
        <form
          action={formPath}
          method="get"
          onSubmit={() => setFiltersOpen(false)}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5"
        >
          {values.query ? <input type="hidden" name="q" value={values.query} /> : null}
          <div className="grid gap-1.5">
            <label htmlFor="filter-size" className="text-xs font-medium text-muted-foreground">
              Size
            </label>
            <select
              id="filter-size"
              name="size"
              defaultValue={values.size}
              className="min-h-11 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
            >
              <option value="">All sizes</option>
              {sizes.map((size) => (
                <option value={size} key={size}>{size}</option>
              ))}
            </select>
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="filter-color" className="text-xs font-medium text-muted-foreground">
              Color
            </label>
            <select
              id="filter-color"
              name="color"
              defaultValue={values.color}
              className="min-h-11 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
            >
              <option value="">All colors</option>
              {colors.map((color) => (
                <option value={color} key={color}>{color}</option>
              ))}
            </select>
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="filter-min-price" className="text-xs font-medium text-muted-foreground">
              Minimum price (KSh)
            </label>
            <input
              id="filter-min-price"
              name="minPrice"
              type="number"
              min="0"
              max="99999999"
              step="1"
              inputMode="numeric"
              defaultValue={values.minPrice}
              className="min-h-11 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
            />
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="filter-max-price" className="text-xs font-medium text-muted-foreground">
              Maximum price (KSh)
            </label>
            <input
              id="filter-max-price"
              name="maxPrice"
              type="number"
              min="0"
              max="99999999"
              step="1"
              inputMode="numeric"
              defaultValue={values.maxPrice}
              className="min-h-11 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
            />
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="filter-sort" className="text-xs font-medium text-muted-foreground">
              Sort by
            </label>
            <select
              id="filter-sort"
              name="sort"
              defaultValue={values.sort}
              className="min-h-11 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
            >
              <option value="newest">Newest</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-3 sm:col-span-2 lg:col-span-5">
            <button
              type="submit"
              className="min-h-11 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Apply filters
            </button>
            <Link
              href={activeCategorySlug ? `/shop/${activeCategorySlug}` : "/shop"}
              onClick={() => setFiltersOpen(false)}
              className="min-h-11 content-center px-2 text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Clear filters
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
