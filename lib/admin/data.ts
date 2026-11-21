import "server-only";

import type { DeliveryAddress, Order, OrderItem, Product } from "@/lib/data/types";
import type { Tables } from "@/types/database";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminPage } from "@/lib/admin/auth";

function mapDeliveryAddress(value: Tables<"orders">["delivery_address"]): DeliveryAddress {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("An order has an invalid delivery address.");
  }

  const { county, town, street, landmark } = value;
  if (
    typeof county !== "string" ||
    typeof town !== "string" ||
    typeof street !== "string" ||
    typeof landmark !== "string"
  ) {
    throw new Error("An order has an incomplete delivery address.");
  }

  return { county, town, street, landmark };
}

export async function getAdminDashboardData() {
  await requireAdminPage();
  const supabase = createAdminClient();

  const [categoriesResult, productsResult, ordersResult] = await Promise.all([
    supabase.from("categories").select("*").order("name"),
    supabase.from("products").select("*").order("created_at", { ascending: false }),
    supabase.from("orders").select("*").order("created_at", { ascending: false }),
  ]);

  if (categoriesResult.error) {
    throw new Error(`Could not load categories: ${categoriesResult.error.message}`);
  }
  if (productsResult.error) {
    throw new Error(`Could not load products: ${productsResult.error.message}`);
  }
  if (ordersResult.error) {
    throw new Error(`Could not load orders: ${ordersResult.error.message}`);
  }

  const products = productsResult.data ?? [];
  const productIds = products.map((product) => product.id);
  let variants: Tables<"product_variants">[] = [];
  let images: Tables<"product_images">[] = [];

  if (productIds.length > 0) {
    const [variantsResult, imagesResult] = await Promise.all([
      supabase.from("product_variants").select("*").in("product_id", productIds),
      supabase.from("product_images").select("*").in("product_id", productIds).order("sort_order"),
    ]);
    if (variantsResult.error) {
      throw new Error(`Could not load product variants: ${variantsResult.error.message}`);
    }
    if (imagesResult.error) {
      throw new Error(`Could not load product images: ${imagesResult.error.message}`);
    }
    variants = variantsResult.data ?? [];
    images = imagesResult.data ?? [];
  }

  const orderRows = ordersResult.data ?? [];
  const orderIds = orderRows.map((order) => order.id);
  let items: Tables<"order_items">[] = [];
  if (orderIds.length > 0) {
    const { data, error } = await supabase
      .from("order_items")
      .select("*")
      .in("order_id", orderIds);
    if (error) {
      throw new Error(`Could not load order items: ${error.message}`);
    }
    items = data ?? [];
  }

  const productList: Product[] = products.map((product) => ({
    ...product,
    variants: variants.filter((variant) => variant.product_id === product.id),
    images: images.filter((image) => image.product_id === product.id),
  }));
  const itemsByOrder = new Map<string, OrderItem[]>();
  for (const item of items) {
    const orderItems = itemsByOrder.get(item.order_id) ?? [];
    orderItems.push(item);
    itemsByOrder.set(item.order_id, orderItems);
  }
  const orders: Order[] = orderRows.map((order) => ({
    ...order,
    delivery_address: mapDeliveryAddress(order.delivery_address),
    items: itemsByOrder.get(order.id) ?? [],
  }));
  const adminOrders = orders.map((order) => ({
    id: order.id,
    order_number: order.order_number,
    customer_name: order.customer_name,
    email: order.email,
    phone: order.phone,
    delivery_address: order.delivery_address,
    subtotal_kes: order.subtotal_kes,
    delivery_fee_kes: order.delivery_fee_kes,
    total_kes: order.total_kes,
    status: order.status,
    payment_status: order.payment_status,
    created_at: order.created_at,
    items: order.items,
  }));

  return {
    categories: categoriesResult.data ?? [],
    products: productList,
    orders: adminOrders,
  };
}
