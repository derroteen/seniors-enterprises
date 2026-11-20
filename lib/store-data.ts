import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

export type CategoryRow = Database["public"]["Tables"]["categories"]["Row"];
export type ProductRow = Database["public"]["Tables"]["products"]["Row"];
export type ProductImageRow = Database["public"]["Tables"]["product_images"]["Row"];
export type ProductVariantRow = Database["public"]["Tables"]["product_variants"]["Row"];

export type StoreProduct = ProductRow & {
  images: ProductImageRow[];
};

export type ProductDetail = StoreProduct & {
  variants: ProductVariantRow[];
};

export type SearchSuggestion = Pick<
  ProductRow,
  "id" | "name" | "slug" | "base_price_kes"
> & {
  imageUrl: string | null;
};

export type ProductSort = "newest" | "price-asc" | "price-desc";

export interface ProductFilters {
  categoryId?: string;
  color?: string;
  maxPrice?: number;
  minPrice?: number;
  page: number;
  pageSize?: number;
  query?: string;
  size?: string;
  sort: ProductSort;
}

type StoreClient = SupabaseClient<Database>;

const PRODUCT_FIELDS =
  "id,name,slug,description,category_id,base_price_kes,compare_at_price_kes,is_active,is_featured,created_at,updated_at";

function throwOnQueryError(context: string, message: string | null) {
  if (message) {
    throw new Error(`${context}: ${message}`);
  }
}

async function getImagesByProduct(
  client: StoreClient,
  productIds: string[],
): Promise<Map<string, ProductImageRow[]>> {
  if (productIds.length === 0) {
    return new Map();
  }

  const { data, error } = await client
    .from("product_images")
    .select("id,product_id,url,alt_text,sort_order")
    .in("product_id", productIds)
    .order("sort_order", { ascending: true });

  throwOnQueryError("Could not load product images", error?.message ?? null);

  const imagesByProduct = new Map<string, ProductImageRow[]>();
  for (const image of data ?? []) {
    const images = imagesByProduct.get(image.product_id) ?? [];
    images.push(image);
    imagesByProduct.set(image.product_id, images);
  }

  return imagesByProduct;
}

async function attachImages(
  client: StoreClient,
  products: ProductRow[],
): Promise<StoreProduct[]> {
  const imagesByProduct = await getImagesByProduct(
    client,
    products.map((product) => product.id),
  );

  return products.map((product) => ({
    ...product,
    images: imagesByProduct.get(product.id) ?? [],
  }));
}

export async function getCategories(client: StoreClient) {
  const { data, error } = await client
    .from("categories")
    .select("id,name,slug,parent_id,image_url,created_at")
    .order("name", { ascending: true });

  throwOnQueryError("Could not load categories", error?.message ?? null);
  return data ?? [];
}

export async function getCategoryBySlug(client: StoreClient, slug: string) {
  const { data, error } = await client
    .from("categories")
    .select("id,name,slug,parent_id,image_url,created_at")
    .eq("slug", slug)
    .maybeSingle();

  throwOnQueryError("Could not load category", error?.message ?? null);
  return data;
}

export async function getFeaturedProducts(client: StoreClient, limit = 4) {
  const { data, error } = await client
    .from("products")
    .select(PRODUCT_FIELDS)
    .eq("is_active", true)
    .eq("is_featured", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  throwOnQueryError("Could not load featured products", error?.message ?? null);
  return attachImages(client, data ?? []);
}

export async function getFilterOptions(client: StoreClient) {
  const { data, error } = await client
    .from("product_variants")
    .select("size,color")
    .order("size", { ascending: true });

  throwOnQueryError("Could not load product filters", error?.message ?? null);

  const sizes = [...new Set((data ?? []).map((variant) => variant.size))].sort(
    (first, second) => first.localeCompare(second, undefined, { numeric: true }),
  );
  const colors = [...new Set((data ?? []).map((variant) => variant.color))].sort(
    (first, second) => first.localeCompare(second),
  );

  return { sizes, colors };
}

export async function getProducts(
  client: StoreClient,
  filters: ProductFilters,
) {
  const pageSize = filters.pageSize ?? 12;
  let productIds: string[] | undefined;

  if (filters.size || filters.color) {
    let variantQuery = client
      .from("product_variants")
      .select("product_id")
      .limit(1000);

    if (filters.size) {
      variantQuery = variantQuery.eq("size", filters.size);
    }
    if (filters.color) {
      variantQuery = variantQuery.eq("color", filters.color);
    }

    const { data, error } = await variantQuery;
    throwOnQueryError("Could not filter product variants", error?.message ?? null);

    productIds = [...new Set((data ?? []).map((variant) => variant.product_id))];
    if (productIds.length === 0) {
      return { products: [], totalCount: 0 };
    }
  }

  let query = client
    .from("products")
    .select(PRODUCT_FIELDS, { count: "exact" })
    .eq("is_active", true);

  if (filters.categoryId) {
    query = query.eq("category_id", filters.categoryId);
  }
  if (productIds) {
    query = query.in("id", productIds);
  }
  if (filters.minPrice !== undefined) {
    query = query.gte("base_price_kes", filters.minPrice);
  }
  if (filters.maxPrice !== undefined) {
    query = query.lte("base_price_kes", filters.maxPrice);
  }
  if (filters.query) {
    const literalQuery = filters.query.replace(/[\\%_]/g, "\\$&");
    query = query.ilike("name", `%${literalQuery}%`);
  }

  if (filters.sort === "price-asc") {
    query = query.order("base_price_kes", { ascending: true });
  } else if (filters.sort === "price-desc") {
    query = query.order("base_price_kes", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const start = (filters.page - 1) * pageSize;
  const { data, error, count } = await query.range(start, start + pageSize - 1);
  throwOnQueryError("Could not load products", error?.message ?? null);

  return {
    products: await attachImages(client, data ?? []),
    totalCount: count ?? 0,
  };
}

export async function getProductBySlug(client: StoreClient, slug: string) {
  const { data: product, error } = await client
    .from("products")
    .select(PRODUCT_FIELDS)
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  throwOnQueryError("Could not load product", error?.message ?? null);
  if (!product) {
    return null;
  }

  const [imagesByProduct, variantResult] = await Promise.all([
    getImagesByProduct(client, [product.id]),
    client
      .from("product_variants")
      .select("id,product_id,size,color,sku,stock_quantity,price_override_kes")
      .eq("product_id", product.id)
      .order("size", { ascending: true })
      .order("color", { ascending: true }),
  ]);

  throwOnQueryError(
    "Could not load product variants",
    variantResult.error?.message ?? null,
  );

  return {
    ...product,
    images: imagesByProduct.get(product.id) ?? [],
    variants: variantResult.data ?? [],
  };
}

export async function getSearchSuggestions(client: StoreClient, query: string) {
  const literalQuery = query.replace(/[\\%_]/g, "\\$&");
  const { data, error } = await client
    .from("products")
    .select("id,name,slug,base_price_kes")
    .eq("is_active", true)
    .ilike("name", `%${literalQuery}%`)
    .order("name", { ascending: true })
    .limit(5);

  throwOnQueryError("Could not search products", error?.message ?? null);

  const imagesByProduct = await getImagesByProduct(
    client,
    (data ?? []).map((product) => product.id),
  );

  return (data ?? []).map((product) => ({
    ...product,
    imageUrl: imagesByProduct.get(product.id)?.[0]?.url ?? null,
  }));
}
