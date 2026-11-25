"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import {
  filterProductsForList,
  sortVariantsForStock,
  type ProductListItem,
} from "@/lib/admin/stock";
import { SubmitButton } from "@/components/ui/submit-button";
import type { Category, Product } from "@/lib/data/types";
import { formatKes } from "@/lib/store-format";

interface ProductsPanelProps {
  products: Product[];
  categories: Category[];
  isPending: boolean;
  deletingProductId: string | null;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (product: Product) => void;
}

const PAGE_SIZE = 20;

const chipBase =
  "inline-flex min-h-10 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
const secondaryButtonClass =
  "inline-flex min-h-10 items-center justify-center rounded-lg border border-border px-3 text-sm font-medium hover:bg-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60";
const dangerButtonClass =
  "inline-flex min-h-10 items-center justify-center rounded-lg border border-danger-border px-3 text-sm font-medium text-danger hover:bg-danger-bg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60";

function ProductStockGrid({ product }: { product: Product }) {
  const colorCount = new Set(product.variants.map((variant) => variant.color))
    .size;
  const showColor = colorCount > 1;
  const sortedVariants = sortVariantsForStock(product.variants).map(
    (row) => row.variant,
  );

  return (
    <ul className="flex flex-wrap gap-2">
      {sortedVariants.map((variant) => {
        const stock = variant.stock_quantity;
        return (
          <li key={variant.id}>
            <span
              className={`${chipBase} pointer-events-none ${
                stock === 0
                  ? "border-danger-border bg-danger-bg text-danger"
                  : stock <= 2
                    ? "border-warning-border bg-warning-bg text-warning"
                    : "border-border bg-background text-foreground"
              }`}
              title={`${variant.size}${showColor ? ` · ${variant.color}` : ""} — ${
                stock === 0 ? "sold out" : `${stock} in stock`
              }`}
            >
              <span className="font-semibold">
                {variant.size}
                {showColor ? ` · ${variant.color}` : ""}
              </span>
              <span className="text-xs">
                {stock === 0 ? "Sold out" : stock}
              </span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function ProductRow({
  item,
  isPending,
  deletingProductId,
  onEditProduct,
  onDeleteProduct,
}: {
  item: ProductListItem;
  isPending: boolean;
  deletingProductId: string | null;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (product: Product) => void;
}) {
  const [open, setOpen] = useState(false);
  const { product } = item;
  const image = product.images[0];

  return (
    <li className="rounded-xl border border-border bg-background">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <span className="relative size-11 shrink-0 overflow-hidden rounded-lg border border-border bg-surface">
          {image ? (
            <Image
              src={image.url}
              alt=""
              fill
              sizes="44px"
              unoptimized
              className="object-cover"
            />
          ) : null}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold">
            {product.name}
          </span>
          <span className="block truncate text-xs text-muted-foreground">
            {item.categoryName} · {formatKes(product.base_price_kes)}
          </span>
        </span>
        <span className="hidden shrink-0 text-sm text-muted-foreground sm:block">
          {item.totalStock} in stock
        </span>
        {item.lowStock ? (
          <span className="shrink-0 rounded-full bg-warning-bg px-2.5 py-1 text-xs font-semibold text-warning">
            Low stock
          </span>
        ) : null}
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
            product.is_active
              ? "bg-success-bg text-success"
              : "bg-muted-bg text-muted-foreground"
          }`}
        >
          {product.is_active ? "Active" : "Hidden"}
        </span>
        <span aria-hidden="true" className="shrink-0 text-muted-foreground">
          {open ? "▾" : "▸"}
        </span>
      </button>

      {open ? (
        <div className="grid gap-3 border-t border-border px-3 py-3">
          <ProductStockGrid product={product} />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onEditProduct(product)}
              className={secondaryButtonClass}
            >
              Edit product
            </button>
            <SubmitButton
              type="button"
              disabled={isPending}
              pending={deletingProductId === product.id}
              pendingLabel="Deleting…"
              onClick={() => onDeleteProduct(product)}
              className={dangerButtonClass}
            >
              Delete
            </SubmitButton>
          </div>
        </div>
      ) : null}
    </li>
  );
}

export function ProductsPanel({
  products,
  categories,
  isPending,
  deletingProductId,
  onEditProduct,
  onDeleteProduct,
}: ProductsPanelProps) {
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const product of products) {
      counts.set(
        product.category_id,
        (counts.get(product.category_id) ?? 0) + 1,
      );
    }
    return counts;
  }, [products]);

  const activeFilter =
    categoryFilter && categoryCounts.has(categoryFilter)
      ? categoryFilter
      : null;

  const items = useMemo(
    () => filterProductsForList(products, categories, activeFilter, query),
    [products, categories, activeFilter, query],
  );
  const visibleItems = items.slice(0, visibleCount);

  return (
    <section className="grid content-start gap-3">
      <h2 className="text-lg font-semibold">
        Products{" "}
        <span className="text-sm font-normal text-muted-foreground">
          ({items.length}
          {items.length !== products.length ? ` of ${products.length}` : ""})
        </span>
      </h2>

      <div className="grid gap-2">
        <input
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setVisibleCount(PAGE_SIZE);
          }}
          placeholder="Search by name or SKU"
          aria-label="Search products by name or SKU"
          className="min-h-11 w-full rounded-lg border border-border bg-background px-3 text-foreground placeholder:text-muted-foreground"
        />
        {categories.length > 1 ? (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setCategoryFilter(null);
                setVisibleCount(PAGE_SIZE);
              }}
              aria-pressed={activeFilter === null}
              className={`${chipBase} ${
                activeFilter === null
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-foreground hover:bg-background"
              }`}
            >
              All
            </button>
            {categories.map((category) => {
              const count = categoryCounts.get(category.id) ?? 0;
              if (count === 0) {
                return null;
              }
              const selected = activeFilter === category.id;
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => {
                    setCategoryFilter(selected ? null : category.id);
                    setVisibleCount(PAGE_SIZE);
                  }}
                  aria-pressed={selected}
                  className={`${chipBase} ${
                    selected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-foreground hover:bg-background"
                  }`}
                >
                  {category.name}
                  <span
                    className={`rounded-full px-1.5 text-xs ${
                      selected
                        ? "bg-primary-foreground text-primary"
                        : "bg-muted-bg text-muted-foreground"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      {visibleItems.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
          No products match.
        </p>
      ) : (
        <>
          <ul className="grid gap-2">
            {visibleItems.map((item) => (
              <ProductRow
                key={item.product.id}
                item={item}
                isPending={isPending}
                deletingProductId={deletingProductId}
                onEditProduct={onEditProduct}
                onDeleteProduct={onDeleteProduct}
              />
            ))}
          </ul>
          {items.length > visibleCount ? (
            <button
              type="button"
              onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
              className={`${secondaryButtonClass} w-full`}
            >
              Show more ({items.length - visibleCount} left)
            </button>
          ) : null}
        </>
      )}
    </section>
  );
}
