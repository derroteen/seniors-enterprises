"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import {
  buildLowStockCategoryChips,
  buildLowStockView,
  DEFAULT_LOW_STOCK_THRESHOLD,
  LOW_STOCK_THRESHOLDS,
  type ProductStockItem,
} from "@/lib/admin/stock";
import type { Category, Product } from "@/lib/data/types";

interface LowStockPanelProps {
  products: Product[];
  categories: Category[];
  onEditProduct: (product: Product) => void;
}

const chipBase =
  "inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

function stockChipClass(stock: number, threshold: number) {
  if (stock === 0) {
    return "border-danger-border bg-danger-bg text-danger";
  }
  if (stock <= threshold) {
    return "border-warning-border bg-warning-bg text-warning";
  }
  return "border-border bg-background text-foreground";
}

function ProductStockRow({
  item,
  threshold,
  onEditProduct,
}: {
  item: ProductStockItem;
  threshold: number;
  onEditProduct: (product: Product) => void;
}) {
  const [open, setOpen] = useState(false);
  const { product } = item;
  const image = product.images[0];
  const colorCount = new Set(product.variants.map((variant) => variant.color))
    .size;
  const showColor = colorCount > 1;

  return (
    <li className="rounded-xl border border-border bg-background">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        className="flex min-h-11 w-full flex-wrap items-center gap-x-3 gap-y-1 rounded-xl px-3 py-2 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
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
        <span className="min-w-0 grow basis-48">
          <span className="block truncate text-sm font-semibold" title={product.name}>
            {product.name}
          </span>
          <span className="block text-xs text-muted-foreground">
            {item.totalStock} in stock
          </span>
        </span>
        {item.allSoldOut ? (
          <span className="shrink-0 rounded-full bg-danger-bg px-2.5 py-1 text-xs font-semibold text-danger">
            Sold out
          </span>
        ) : (
          <span className="shrink-0 rounded-full bg-warning-bg px-2.5 py-1 text-xs font-semibold text-warning">
            {item.lowCount} low
          </span>
        )}
        <span aria-hidden="true" className="shrink-0 text-muted-foreground">
          {open ? "▾" : "▸"}
        </span>
      </button>

      {open ? (
        <div className="border-t border-border px-3 py-3">
          <ul className="flex flex-wrap gap-2">
            {item.rows.map(({ variant }) => {
              const stock = variant.stock_quantity;
              return (
                <li key={variant.id}>
                  <span
                    className={`${chipBase} pointer-events-none ${stockChipClass(stock, threshold)}`}
                    title={
                      stock === 0
                        ? `${variant.size}${showColor ? ` · ${variant.color}` : ""} — sold out`
                        : `${variant.size}${showColor ? ` · ${variant.color}` : ""} — ${stock} in stock`
                    }
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
          <button
            type="button"
            onClick={() => onEditProduct(product)}
            className="mt-3 inline-flex min-h-10 items-center rounded-lg border border-border px-3 text-sm font-medium hover:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Edit product
          </button>
        </div>
      ) : null}
    </li>
  );
}

export function LowStockPanel({
  products,
  categories,
  onEditProduct,
}: LowStockPanelProps) {
  const [threshold, setThreshold] = useState<number>(DEFAULT_LOW_STOCK_THRESHOLD);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [showAllSizes, setShowAllSizes] = useState(false);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(
    () => new Set(),
  );

  const chips = useMemo(
    () => buildLowStockCategoryChips(products, categories, threshold),
    [products, categories, threshold],
  );
  const activeFilter =
    categoryFilter && chips.some((chip) => chip.category.id === categoryFilter)
      ? categoryFilter
      : null;
  const view = useMemo(
    () =>
      buildLowStockView(
        products,
        categories,
        threshold,
        activeFilter,
        showAllSizes,
      ),
    [products, categories, threshold, activeFilter, showAllSizes],
  );

  function toggleCategory(categoryId: string) {
    setCollapsedCategories((current) => {
      const next = new Set(current);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  }

  return (
    <section className="min-w-0 rounded-2xl border border-border bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Low stock</h2>
        <div
          className="flex items-center gap-1 rounded-lg border border-border p-1"
          role="group"
          aria-label="Low stock threshold"
        >
          {LOW_STOCK_THRESHOLDS.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setThreshold(value)}
              aria-pressed={threshold === value}
              className={`min-h-9 rounded-md px-3 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                threshold === value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-background"
              }`}
            >
              {value} or fewer
            </button>
          ))}
        </div>
      </div>

      <p className="mt-2 text-sm text-muted-foreground">
        {view.lowVariantCount} {view.lowVariantCount === 1 ? "size" : "sizes"}{" "}
        low · {view.soldOutVariantCount}{" "}
        {view.soldOutVariantCount === 1 ? "size" : "sizes"} sold out
      </p>

      {chips.length > 1 ? (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setCategoryFilter(null)}
            aria-pressed={activeFilter === null}
            className={`${chipBase} ${
              activeFilter === null
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-foreground hover:bg-background"
            }`}
          >
            All
          </button>
          {chips.map(({ category, count }) => (
            <button
              key={category.id}
              type="button"
              onClick={() =>
                setCategoryFilter(
                  activeFilter === category.id ? null : category.id,
                )
              }
              aria-pressed={activeFilter === category.id}
              className={`${chipBase} ${
                activeFilter === category.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-foreground hover:bg-background"
              }`}
            >
              {category.name}
              <span
                className={`rounded-full px-1.5 text-xs ${
                  activeFilter === category.id
                    ? "bg-primary-foreground text-primary"
                    : "bg-muted-bg text-muted-foreground"
                }`}
              >
                {count}
              </span>
            </button>
          ))}
        </div>
      ) : null}

      <label className="mt-4 flex min-h-10 items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={showAllSizes}
          onChange={(event) => setShowAllSizes(event.target.checked)}
          className="size-4 accent-primary"
        />
        Show all sizes of these products
      </label>

      {view.groups.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
          Nothing is running low.
        </p>
      ) : (
        <div className="mt-4 grid gap-4">
          {view.groups.map((group) => {
            const collapsed = collapsedCategories.has(group.category.id);
            return (
              <section key={group.category.id}>
                <button
                  type="button"
                  onClick={() => toggleCategory(group.category.id)}
                  aria-expanded={!collapsed}
                  className="flex min-h-11 w-full items-center justify-between gap-3 rounded-lg px-1 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  <span className="font-semibold">{group.category.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {group.products.length}{" "}
                    {group.products.length === 1 ? "product" : "products"} ·{" "}
                    {group.lowVariantCount} low
                  </span>
                  <span aria-hidden="true" className="text-muted-foreground">
                    {collapsed ? "▸" : "▾"}
                  </span>
                </button>
                {collapsed ? null : (
                  <ul className="mt-2 grid gap-2">
                    {group.products.map((item) => (
                      <ProductStockRow
                        key={item.product.id}
                        item={item}
                        threshold={threshold}
                        onEditProduct={onEditProduct}
                      />
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      )}
    </section>
  );
}
