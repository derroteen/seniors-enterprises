// Pure helpers for the admin product form: size presets, SKU generation and
// the size × color stock matrix. No React or server imports.

import {
  NEUTRAL_COLOR,
  NEUTRAL_SIZE,
  sortColorLabels,
  sortSizeLabels,
} from "@/lib/variant-options";

export type SizeKind = "clothing" | "shoes" | "one-size" | "custom";

export const CLOTHING_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];

export const SHOE_SIZES = Array.from({ length: 12 }, (_, index) =>
  String(36 + index),
); // 36–47

export const COLOR_SUGGESTIONS = [
  "Black",
  "White",
  "Navy",
  "Blue",
  "Red",
  "Green",
  "Brown",
  "Grey",
  "Beige",
  "Sand",
];

export interface StockRowKey {
  size: string;
  color: string;
}

export interface StockRow extends StockRowKey {
  key: string;
}

export function stockRowKey(size: string, color: string) {
  return `${size.toLocaleLowerCase()}|${color.toLocaleLowerCase()}`;
}

/** Work out which size picker to show when editing an existing product. */
export function detectSizeKind(sizes: string[]): SizeKind {
  const unique = [...new Set(sizes.map((size) => size.trim()))];
  if (unique.length === 0 || unique.every((size) => size === NEUTRAL_SIZE)) {
    return "one-size";
  }
  if (unique.every((size) => /^\d+$/.test(size))) {
    return "shoes";
  }
  const clothingSet = new Set(CLOTHING_SIZES);
  if (unique.every((size) => clothingSet.has(size.toUpperCase()))) {
    return "clothing";
  }
  return "custom";
}

function skuPart(label: string) {
  const words = label
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .split(" ")
    .filter(Boolean);
  if (words.length === 0) {
    return "";
  }
  const part =
    words.length > 1 ? words.map((word) => word[0]).join("") : words[0];
  return part.slice(0, 4);
}

/** e.g. "Mara" + "Navy" + "42" → "MARA-NAVY-42". */
export function generateSku(productName: string, color: string, size: string) {
  const parts = [skuPart(productName), skuPart(color), skuPart(size)].filter(
    Boolean,
  );
  return (parts.length ? parts.join("-") : "ITEM").slice(0, 100);
}

/** Append -2, -3… until the SKU is free. */
export function makeSkuUnique(base: string, isTaken: (sku: string) => boolean) {
  const root = (base.trim() || "ITEM").slice(0, 100);
  let candidate = root;
  let counter = 2;
  while (isTaken(candidate.toLocaleLowerCase())) {
    const suffix = `-${counter}`;
    candidate = `${root.slice(0, 100 - suffix.length)}${suffix}`;
    counter += 1;
  }
  return candidate;
}

/**
 * Effective sizes/colors for the matrix. Neutral fallbacks keep the database
 * columns (which do not allow null) populated with sensible values.
 */
export function effectiveSizes(sizeKind: SizeKind, sizes: string[]) {
  if (sizeKind === "one-size") {
    return [NEUTRAL_SIZE];
  }
  const unique = [...new Set(sizes.map((size) => size.trim()).filter(Boolean))];
  return unique.length ? sortSizeLabels(unique) : [NEUTRAL_SIZE];
}

export function effectiveColors(colors: string[], noColorOption: boolean) {
  if (noColorOption) {
    return [NEUTRAL_COLOR];
  }
  const unique = [...new Set(colors.map((color) => color.trim()).filter(Boolean))];
  return unique.length ? sortColorLabels(unique) : [NEUTRAL_COLOR];
}

/** One row for every size × color combination, in display order. */
export function buildStockMatrix(sizes: string[], colors: string[]): StockRow[] {
  return sizes.flatMap((size) =>
    colors.map((color) => ({
      size,
      color,
      key: stockRowKey(size, color),
    })),
  );
}
