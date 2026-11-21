import "server-only";

import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { StoreRepository } from "@/lib/data/repository";
import type {
  CreateOrderInput,
  DeliveryAddress,
  Order,
  OrderItem,
  Product,
  ProductImage,
  ProductVariant,
  ProductSort,
  UpdateOrderPaymentInput,
} from "@/lib/data/types";
import { getDeliveryFee } from "@/lib/config/delivery";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createCatalogClient,
  createClient as createServerClient,
} from "@/lib/supabase/server";
import type { Database, Tables } from "@/types/database";

type ProductRow = Tables<"products">;
type OrderRow = Tables<"orders">;

const deliveryAddressSchema = z.object({
  county: z.string(),
  town: z.string(),
  street: z.string(),
  landmark: z.string(),
});

function throwOnQueryError(
  operation: string,
  error: { message: string } | null,
): void {
  if (error) {
    throw new Error(`${operation} failed: ${error.message}`);
  }
}

function escapeLikeValue(value: string) {
  return value.replace(/[\\%_]/g, "\\$&");
}

function sortSizes(sizes: string[]) {
  return sizes.sort((first, second) =>
    first.localeCompare(second, undefined, { numeric: true }),
  );
}

async function getCategoryBySlug(slug: string) {
  const client = createCatalogClient();
  const { data, error } = await client
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  throwOnQueryError("Loading category", error);
  return data;
}

async function addProductRelations(
  client: SupabaseClient<Database>,
  products: ProductRow[],
): Promise<Product[]> {
  if (products.length === 0) {
    return [];
  }

  const productIds = products.map((product) => product.id);
  const [imagesResult, variantsResult] = await Promise.all([
    client
      .from("product_images")
      .select("*")
      .in("product_id", productIds)
      .order("sort_order", { ascending: true }),
    client
      .from("product_variants")
      .select("*")
      .in("product_id", productIds)
      .order("size", { ascending: true }),
  ]);

  throwOnQueryError("Loading product images", imagesResult.error);
  throwOnQueryError("Loading product variants", variantsResult.error);

  const imagesByProduct = new Map<string, ProductImage[]>();
  for (const image of imagesResult.data ?? []) {
    const images = imagesByProduct.get(image.product_id) ?? [];
    images.push(image);
    imagesByProduct.set(image.product_id, images);
  }

  const variantsByProduct = new Map<string, ProductVariant[]>();
  for (const variant of variantsResult.data ?? []) {
    const variants = variantsByProduct.get(variant.product_id) ?? [];
    variants.push(variant);
    variantsByProduct.set(variant.product_id, variants);
  }

  return products.map((product) => ({
    ...product,
    images: imagesByProduct.get(product.id) ?? [],
    variants: variantsByProduct.get(product.id) ?? [],
  }));
}

function mapOrder(
  row: OrderRow,
  items: OrderItem[],
): Order {
  const deliveryAddress = deliveryAddressSchema.safeParse(row.delivery_address);
  if (!deliveryAddress.success) {
    throw new Error("An order has an invalid delivery address.");
  }

  return {
    ...row,
    delivery_address: deliveryAddress.data,
    items,
  };
}

async function getItemsForOrder(
  client: SupabaseClient<Database>,
  orderId: string,
): Promise<OrderItem[]> {
  const { data, error } = await client
    .from("order_items")
    .select("*")
    .eq("order_id", orderId);

  throwOnQueryError("Loading order items", error);
  return data ?? [];
}

async function getFullOrder(
  client: SupabaseClient<Database>,
  row: OrderRow,
): Promise<Order> {
  return mapOrder(row, await getItemsForOrder(client, row.id));
}

function normalizeContact(contact: string) {
  const value = contact.trim();
  if (value.includes("@")) {
    return value.toLocaleLowerCase();
  }

  const digits = value.replace(/\D/g, "");
  return digits.startsWith("0") ? `254${digits.slice(1)}` : digits;
}

function contactMatchesOrder(row: OrderRow, contact: string) {
  const normalized = normalizeContact(contact);
  return normalized === normalizeContact(row.email) ||
    normalized === normalizeContact(row.phone);
}

async function requireAdmin() {
  const client = await createServerClient();
  const { data, error } = await client.rpc("is_admin");
  throwOnQueryError("Checking administrator access", error);
  if (!data) {
    throw new Error("Administrator access is required.");
  }
}

async function getOrderRowByNumber(
  client: SupabaseClient<Database>,
  orderNumber: string,
) {
  const { data, error } = await client
    .from("orders")
    .select("*")
    .eq("order_number", orderNumber)
    .maybeSingle();

  throwOnQueryError("Loading order", error);
  return data;
}

export const supabaseRepository: StoreRepository = {
  async getCategories() {
    const client = createCatalogClient();
    const { data, error } = await client
      .from("categories")
      .select("*")
      .order("name", { ascending: true });

    throwOnQueryError("Loading categories", error);
    return data ?? [];
  },

  getCategoryBySlug,

  async getProducts(filters, sort: ProductSort, page) {
    const client = createCatalogClient();
    let matchingProductIds: string[] | null = null;

    if (filters.categorySlug) {
      const category = await getCategoryBySlug(filters.categorySlug);
      if (!category) {
        return { products: [], totalCount: 0 };
      }
      filters = { ...filters, categoryId: category.id };
    }

    if (filters.size || filters.color) {
      let variantsQuery = client
        .from("product_variants")
        .select("product_id");
      if (filters.size) {
        variantsQuery = variantsQuery.eq("size", filters.size);
      }
      if (filters.color) {
        variantsQuery = variantsQuery.ilike(
          "color",
          escapeLikeValue(filters.color),
        );
      }

      const { data, error } = await variantsQuery;
      throwOnQueryError("Filtering product variants", error);
      matchingProductIds = [...new Set((data ?? []).map((row) => row.product_id))];
      if (matchingProductIds.length === 0) {
        return { products: [], totalCount: 0 };
      }
    }

    const pageSize = Math.min(48, Math.max(1, filters.pageSize ?? 12));
    const safePage = Math.max(1, Math.trunc(page));
    const start = (safePage - 1) * pageSize;
    let query = client
      .from("products")
      .select("*", { count: "exact" })
      .eq("is_active", true);

    if (filters.categoryId) {
      query = query.eq("category_id", filters.categoryId);
    }
    if (matchingProductIds) {
      query = query.in("id", matchingProductIds);
    }
    if (filters.query?.trim()) {
      query = query.ilike("name", `%${escapeLikeValue(filters.query.trim())}%`);
    }
    if (Number.isFinite(filters.minPrice)) {
      query = query.gte("base_price_kes", filters.minPrice);
    }
    if (Number.isFinite(filters.maxPrice)) {
      query = query.lte("base_price_kes", filters.maxPrice);
    }

    if (sort === "price-asc") {
      query = query.order("base_price_kes", { ascending: true });
    } else if (sort === "price-desc") {
      query = query.order("base_price_kes", { ascending: false });
    } else {
      query = query.order("created_at", { ascending: false });
    }

    const { data, error, count } = await query.range(start, start + pageSize - 1);
    throwOnQueryError("Loading products", error);
    const products = await addProductRelations(client, data ?? []);

    return { products, totalCount: count ?? products.length };
  },

  async getProductBySlug(slug) {
    const client = createCatalogClient();
    const { data, error } = await client
      .from("products")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();

    throwOnQueryError("Loading product", error);
    if (!data) {
      return null;
    }

    const [product] = await addProductRelations(client, [data]);
    return product ?? null;
  },

  async getFeaturedProducts(limit = 4) {
    const client = createCatalogClient();
    const { data, error } = await client
      .from("products")
      .select("*")
      .eq("is_active", true)
      .eq("is_featured", true)
      .order("created_at", { ascending: false })
      .limit(Math.max(0, limit));

    throwOnQueryError("Loading featured products", error);
    return addProductRelations(client, data ?? []);
  },

  async searchProducts(query) {
    const normalizedQuery = query.trim();
    if (!normalizedQuery) {
      return [];
    }

    const client = createCatalogClient();
    const { data, error } = await client
      .from("products")
      .select("id, name, slug, base_price_kes")
      .eq("is_active", true)
      .ilike("name", `%${escapeLikeValue(normalizedQuery)}%`)
      .order("name", { ascending: true })
      .limit(5);

    throwOnQueryError("Searching products", error);
    if (!data?.length) {
      return [];
    }

    const productIds = data.map((product) => product.id);
    const { data: images, error: imagesError } = await client
      .from("product_images")
      .select("product_id, url, sort_order")
      .in("product_id", productIds)
      .order("sort_order", { ascending: true });
    throwOnQueryError("Loading search result images", imagesError);

    const firstImageByProduct = new Map<string, string>();
    for (const image of images ?? []) {
      if (!firstImageByProduct.has(image.product_id)) {
        firstImageByProduct.set(image.product_id, image.url);
      }
    }

    return data.map((product) => ({
      ...product,
      imageUrl: firstImageByProduct.get(product.id) ?? null,
    }));
  },

  async getFilterOptions() {
    const client = createCatalogClient();
    const { data: activeProducts, error: productsError } = await client
      .from("products")
      .select("id")
      .eq("is_active", true);
    throwOnQueryError("Loading active products for filters", productsError);

    const productIds = (activeProducts ?? []).map((product) => product.id);
    if (productIds.length === 0) {
      return { sizes: [], colors: [] };
    }

    const { data, error } = await client
      .from("product_variants")
      .select("size, color")
      .in("product_id", productIds);
    throwOnQueryError("Loading product filter options", error);

    return {
      sizes: sortSizes([...new Set((data ?? []).map((variant) => variant.size))]),
      colors: [...new Set((data ?? []).map((variant) => variant.color))].sort(
        (first, second) => first.localeCompare(second),
      ),
    };
  },

  async createOrder(input: CreateOrderInput): Promise<Order> {
    if (
      input.items.length === 0 ||
      input.items.some(
        (item) =>
          !Number.isInteger(item.quantity) ||
          item.quantity < 1 ||
          item.quantity > 100,
      )
    ) {
      throw new Error("The order must contain valid item quantities.");
    }

    const variantIds = input.items.map((item) => item.variant_id);
    if (new Set(variantIds).size !== variantIds.length) {
      throw new Error("Each product variant can appear only once in an order.");
    }

    const adminClient = createAdminClient();
    const { data: variants, error: variantsError } = await adminClient
      .from("product_variants")
      .select("*")
      .in("id", variantIds);
    throwOnQueryError("Checking selected product variants", variantsError);

    const variantById = new Map(
      (variants ?? []).map((variant) => [variant.id, variant]),
    );
    if (variantById.size !== variantIds.length) {
      throw new Error("A selected product variant is no longer available.");
    }

    const productIds = [...new Set((variants ?? []).map((variant) => variant.product_id))];
    const { data: products, error: productsError } = await adminClient
      .from("products")
      .select("id, name, base_price_kes, is_active")
      .in("id", productIds);
    throwOnQueryError("Checking selected products", productsError);

    const productById = new Map((products ?? []).map((product) => [product.id, product]));
    const lineItems = input.items.map((item) => {
      const variant = variantById.get(item.variant_id);
      const product = variant ? productById.get(variant.product_id) : undefined;
      if (!variant || !product || !product.is_active) {
        throw new Error("A selected product is no longer available.");
      }
      if (variant.stock_quantity < item.quantity) {
        throw new Error(`Not enough stock is available for ${product.name}.`);
      }

      return {
        product_id: product.id,
        variant_id: variant.id,
        product_name_snapshot: `${product.name} (${variant.size}, ${variant.color})`,
        unit_price_kes: variant.price_override_kes ?? product.base_price_kes,
        quantity: item.quantity,
      };
    });

    const subtotalKes = lineItems.reduce(
      (subtotal, item) => subtotal + item.unit_price_kes * item.quantity,
      0,
    );
    const deliveryFeeKes = getDeliveryFee(input.delivery_address.county);
    const deliveryAddress: DeliveryAddress = input.delivery_address;
    const { data: order, error: orderError } = await adminClient
      .from("orders")
      .insert({
        user_id: input.user_id ?? null,
        customer_name: input.customer_name,
        email: input.email,
        phone: input.phone,
        delivery_address: {
          county: deliveryAddress.county,
          town: deliveryAddress.town,
          street: deliveryAddress.street,
          landmark: deliveryAddress.landmark,
        },
        subtotal_kes: subtotalKes,
        delivery_fee_kes: deliveryFeeKes,
        total_kes: subtotalKes + deliveryFeeKes,
        status: "pending",
        payment_status: "pending",
        paystack_reference: null,
      })
      .select("*")
      .single();

    throwOnQueryError("Creating order", orderError);
    if (!order) {
      throw new Error("The order could not be created.");
    }

    const { data: items, error: itemsError } = await adminClient
      .from("order_items")
      .insert(lineItems.map((item) => ({ ...item, order_id: order.id })))
      .select("*");

    if (itemsError) {
      const { error: cleanupError } = await adminClient
        .from("orders")
        .delete()
        .eq("id", order.id);
      if (cleanupError) {
        throw new Error(
          `Saving order items failed: ${itemsError.message}. Removing the incomplete order also failed: ${cleanupError.message}`,
        );
      }
      throw new Error(`Saving order items failed: ${itemsError.message}`);
    }

    return mapOrder(order, items ?? []);
  },

  async getOrderByNumber(
    orderNumber: string,
    contact: string,
  ): Promise<Order | null> {
    const adminClient = createAdminClient();
    const order = await getOrderRowByNumber(adminClient, orderNumber);
    if (!order || !contactMatchesOrder(order, contact)) {
      return null;
    }

    return getFullOrder(adminClient, order);
  },

  async getOrders() {
    await requireAdmin();
    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    throwOnQueryError("Loading orders", error);

    const rows = data ?? [];
    return Promise.all(rows.map((row) => getFullOrder(adminClient, row)));
  },

  async updateOrderPayment(
    orderNumber: string,
    update: UpdateOrderPaymentInput,
  ) {
    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from("orders")
      .update({
        paystack_reference: update.paymentReference,
        payment_status: update.paymentStatus,
        status: update.status,
      })
      .eq("order_number", orderNumber)
      .select("*")
      .maybeSingle();

    throwOnQueryError("Updating order payment", error);
    return data ? getFullOrder(adminClient, data) : null;
  },

  async updateOrderStatus(orderNumber, status) {
    await requireAdmin();
    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from("orders")
      .update({ status })
      .eq("order_number", orderNumber)
      .select("*")
      .maybeSingle();

    throwOnQueryError("Updating order status", error);
    return data ? getFullOrder(adminClient, data) : null;
  },
};
