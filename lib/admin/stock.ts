// Pure helpers for the admin low-stock and products views. No React imports.

import type { Category, Product, ProductVariant } from "@/lib/data/types";
import { sortSizeLabels } from "@/lib/variant-options";

export const LOW_STOCK_THRESHOLDS = [2, 3, 5] as const;
export const DEFAULT_LOW_STOCK_THRESHOLD = 2;
/** Flag used on the products list; matches the dashboard default. */
export const PRODUCTS_LOW_STOCK_FLAG = 2;

export interface StockLevelCounts {
  /** Variants with 0 < stock <= threshold (LOW). */
  low: number;
  /** Variants with stock === 0 (SOLD OUT). */
  soldOut: number;
}

/**
 * Single source of truth for LOW and SOLD OUT counts. LOW means stock is
 * above 0 and at or below the threshold; SOLD OUT means stock is exactly 0.
 */
export function getStockLevelCounts(
  variants: Pick<ProductVariant, "stock_quantity">[],
  threshold: number,
): StockLevelCounts {
  let low = 0;
  let soldOut = 0;
  for (const variant of variants) {
    if (variant.stock_quantity === 0) {
      soldOut += 1;
    } else if (variant.stock_quantity <= threshold) {
      low += 1;
    }
  }
  return { low, soldOut };
}

/** "5 low · 4 sold out", omitting zero parts; "" when nothing needs restocking. */
export function formatStockLevelCounts({ low, soldOut }: StockLevelCounts) {
  const parts: string[] = [];
  if (low > 0) {
    parts.push(`${low} low`);
  }
  if (soldOut > 0) {
    parts.push(`${soldOut} sold out`);
  }
  return parts.join(" · ");
}

/** LOW + SOLD OUT across the given products at the given threshold. */
export function summarizeNeedsRestock(
  products: Product[],
  threshold = DEFAULT_LOW_STOCK_THRESHOLD,
): StockLevelCounts {
  const totals: StockLevelCounts = { low: 0, soldOut: 0 };
  for (const product of products) {
    const counts = getStockLevelCounts(product.variants, threshold);
    totals.low += counts.low;
    totals.soldOut += counts.soldOut;
  }
  return totals;
}

export interface StockVariantRow {
  variant: ProductVariant;
  /** Position of the size label in the logical size order. */
  sizeOrder: number;
}

export interface ProductStockItem {
  product: Product;
  /** Variants to display: low ones only, or all when the toggle is on. */
  rows: StockVariantRow[];
  /** Every variant of the product, sorted the same way. */
  allRows: StockVariantRow[];
  totalStock: number;
  /** Variants with 0 < stock <= threshold. */
  lowCount: number;
  /** Variants with stock === 0. */
  soldOutCount: number;
  /** True when every variant has zero stock. */
  allSoldOut: boolean;
  /** Lowest stock number across all variants (Infinity when none). */
  minStock: number;
}

export interface CategoryStockGroup {
  category: Category;
  /** LOW variants (0 < stock <= threshold) in this category. */
  lowCount: number;
  /** SOLD OUT variants (stock === 0) in this category. */
  soldOutCount: number;
  products: ProductStockItem[];
}

function compareVariantRows(first: StockVariantRow, second: StockVariantRow) {
  if (first.sizeOrder !== second.sizeOrder) {
    return first.sizeOrder - second.sizeOrder;
  }
  return first.variant.color.localeCompare(second.variant.color, undefined, {
    sensitivity: "base",
  });
}

/** Variants sorted by logical size order (numbers asc, then XS→XXXL), then color. */
export function sortVariantsForStock(variants: ProductVariant[]): StockVariantRow[] {
  const sizeOrder = new Map(
    sortSizeLabels([...new Set(variants.map((variant) => variant.size))]).map(
      (size, index) => [size, index],
    ),
  );
  return variants
    .map((variant) => ({
      variant,
      sizeOrder: sizeOrder.get(variant.size) ?? Number.MAX_SAFE_INTEGER,
    }))
    .sort(compareVariantRows);
}

function buildProductStockItem(
  product: Product,
  threshold: number,
  showAllSizes: boolean,
): ProductStockItem | null {
  const allRows = sortVariantsForStock(product.variants);
  const lowRows = allRows.filter(
    ({ variant }) => variant.stock_quantity <= threshold,
  );
  // A product only appears when it actually has something at or under the
  // threshold; the toggle then reveals its other sizes too.
  if (lowRows.length === 0) {
    return null;
  }

  const totalStock = product.variants.reduce(
    (total, variant) => total + variant.stock_quantity,
    0,
  );
  const { low: lowCount, soldOut: soldOutCount } = getStockLevelCounts(
    product.variants,
    threshold,
  );
  const minStock = product.variants.length
    ? Math.min(...product.variants.map((variant) => variant.stock_quantity))
    : 0;

  return {
    product,
    rows: showAllSizes ? allRows : lowRows,
    allRows,
    totalStock,
    lowCount,
    soldOutCount,
    allSoldOut: product.variants.length > 0 && soldOutCount === product.variants.length,
    minStock,
  };
}

function compareProductStockItems(
  first: ProductStockItem,
  second: ProductStockItem,
) {
  // Sold-out products first, then the lowest stock level, then name.
  if (first.allSoldOut !== second.allSoldOut) {
    return first.allSoldOut ? -1 : 1;
  }
  if (first.minStock !== second.minStock) {
    return first.minStock - second.minStock;
  }
  return first.product.name.localeCompare(second.product.name, undefined, {
    sensitivity: "base",
  });
}

export interface LowStockView {
  /** "N sizes low · M sold out" summary counts at the current threshold. */
  lowVariantCount: number;
  soldOutVariantCount: number;
  groups: CategoryStockGroup[];
}

export function buildLowStockView(
  products: Product[],
  categories: Category[],
  threshold: number,
  categoryId: string | null,
  showAllSizes: boolean,
): LowStockView {
  const itemsByCategory = new Map<string, ProductStockItem[]>();
  let lowVariantCount = 0;
  let soldOutVariantCount = 0;

  for (const product of products) {
    if (categoryId && product.category_id !== categoryId) {
      continue;
    }
    const item = buildProductStockItem(product, threshold, showAllSizes);
    if (!item) {
      continue;
    }
    lowVariantCount += item.lowCount;
    soldOutVariantCount += item.soldOutCount;
    const list = itemsByCategory.get(product.category_id) ?? [];
    list.push(item);
    itemsByCategory.set(product.category_id, list);
  }

  const groups = categories
    .filter((category) => itemsByCategory.has(category.id))
    .map((category) => {
      const items = (itemsByCategory.get(category.id) ?? []).sort(
        compareProductStockItems,
      );
      const counts = items.reduce(
        (total, item) => ({
          lowCount: total.lowCount + item.lowCount,
          soldOutCount: total.soldOutCount + item.soldOutCount,
        }),
        { lowCount: 0, soldOutCount: 0 },
      );
      return { category, ...counts, products: items };
    })
    // Categories without low items are hidden; keep catalog order otherwise.
    .filter((group) => group.products.length > 0);

  // Categories keep their existing (alphabetical) order; empty ones are gone.
  return { lowVariantCount, soldOutVariantCount, groups };
}

/** Category chips for the low-stock card: only categories that have items. */
export function buildLowStockCategoryChips(
  products: Product[],
  categories: Category[],
  threshold: number,
): { category: Category; count: number }[] {
  const counts = new Map<string, number>();
  for (const product of products) {
    const { low, soldOut } = getStockLevelCounts(product.variants, threshold);
    const needingRestock = low + soldOut;
    if (needingRestock > 0) {
      counts.set(
        product.category_id,
        (counts.get(product.category_id) ?? 0) + needingRestock,
      );
    }
  }
  return categories
    .filter((category) => (counts.get(category.id) ?? 0) > 0)
    .map((category) => ({
      category,
      count: counts.get(category.id) ?? 0,
    }));
}

export interface ProductListItem {
  product: Product;
  totalStock: number;
  lowStock: boolean;
  categoryName: string;
}

export function productTotalStock(product: Product) {
  return product.variants.reduce(
    (total, variant) => total + variant.stock_quantity,
    0,
  );
}

export function productHasLowStock(product: Product, threshold = PRODUCTS_LOW_STOCK_FLAG) {
  return product.variants.some(
    (variant) => variant.stock_quantity > 0 && variant.stock_quantity <= threshold,
  );
}

export function filterProductsForList(
  products: Product[],
  categories: Category[],
  categoryId: string | null,
  query: string,
): ProductListItem[] {
  const categoryNameById = new Map(
    categories.map((category) => [category.id, category.name]),
  );
  const normalizedQuery = query.trim().toLocaleLowerCase();

  return products
    .filter((product) => {
      if (categoryId && product.category_id !== categoryId) {
        return false;
      }
      if (!normalizedQuery) {
        return true;
      }
      if (product.name.toLocaleLowerCase().includes(normalizedQuery)) {
        return true;
      }
      return product.variants.some((variant) =>
        variant.sku.toLocaleLowerCase().includes(normalizedQuery),
      );
    })
    .map((product) => ({
      product,
      totalStock: productTotalStock(product),
      lowStock: productHasLowStock(product),
      categoryName: categoryNameById.get(product.category_id) ?? "",
    }));
}

