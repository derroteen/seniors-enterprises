import "server-only";

import { requireCurrentUser } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import type { OrderStatus } from "@/lib/data/types";

export interface AccountOrder {
  orderNumber: string;
  status: OrderStatus;
  totalKes: number;
  createdAt: string;
  items: Array<{
    name: string;
    unitPriceKes: number;
    quantity: number;
  }>;
}

interface AccountOrderItemRow {
  order_id: string;
  product_name_snapshot: string;
  unit_price_kes: number;
  quantity: number;
}

export async function getAccountOrders(): Promise<AccountOrder[]> {
  const { user } = await requireCurrentUser("/account");
  const adminClient = createAdminClient();
  const { data: orders, error: ordersError } = await adminClient
    .from("orders")
    .select("id, order_number, status, total_kes, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (ordersError) {
    throw new Error(`Could not load your orders: ${ordersError.message}`);
  }

  const rows = orders ?? [];
  if (rows.length === 0) {
    return [];
  }

  const orderIds = rows.map((order) => order.id);
  const { data: orderItems, error: itemsError } = await adminClient
    .from("order_items")
    .select("order_id, product_name_snapshot, unit_price_kes, quantity")
    .in("order_id", orderIds);

  if (itemsError) {
    throw new Error(`Could not load your order items: ${itemsError.message}`);
  }

  const itemsByOrder = new Map<string, AccountOrderItemRow[]>();
  for (const item of orderItems ?? []) {
    const items = itemsByOrder.get(item.order_id) ?? [];
    items.push(item);
    itemsByOrder.set(item.order_id, items);
  }

  return rows.map((order) => ({
    orderNumber: order.order_number,
    status: order.status,
    totalKes: order.total_kes,
    createdAt: order.created_at,
    items: (itemsByOrder.get(order.id) ?? []).map((item) => ({
      name: item.product_name_snapshot,
      unitPriceKes: item.unit_price_kes,
      quantity: item.quantity,
    })),
  }));
}
