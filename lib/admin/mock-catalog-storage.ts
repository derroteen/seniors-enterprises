import type { Category, Product } from "@/lib/data/types";

const ADMIN_CATALOG_KEY = "seniors-demo-admin-catalog";

export interface MockAdminCatalog {
  categories: Category[];
  products: Product[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isCategory(value: unknown): value is Category {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.slug === "string"
  );
}

function isProduct(value: unknown): value is Product {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.slug === "string" &&
    Array.isArray(value.images) &&
    Array.isArray(value.variants)
  );
}

export function readMockAdminCatalog(initialCatalog: MockAdminCatalog) {
  if (typeof window === "undefined") {
    return initialCatalog;
  }

  try {
    const stored = window.localStorage.getItem(ADMIN_CATALOG_KEY);
    if (!stored) {
      return initialCatalog;
    }

    const parsed: unknown = JSON.parse(stored);
    if (
      isRecord(parsed) &&
      Array.isArray(parsed.categories) &&
      parsed.categories.every(isCategory) &&
      Array.isArray(parsed.products) &&
      parsed.products.every(isProduct)
    ) {
      return {
        categories: parsed.categories,
        products: parsed.products,
      };
    }

    throw new Error("Stored admin catalog has an invalid shape.");
  } catch (error) {
    console.warn("Could not read the demo admin catalog.", error);
    return initialCatalog;
  }
}

export function writeMockAdminCatalog(catalog: MockAdminCatalog) {
  if (typeof window === "undefined") {
    throw new Error("The demo admin catalog can only be saved in a browser.");
  }

  window.localStorage.setItem(ADMIN_CATALOG_KEY, JSON.stringify(catalog));
}
