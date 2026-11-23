import type {
  Category,
  CreateOrderInput,
  Order,
  OrderItem,
  OrderStatus,
  Product,
  ProductFilters,
  ProductResults,
  ProductSort,
  SearchProduct,
  UpdateOrderPaymentInput,
} from "@/lib/data/types";
import type { StoreRepository } from "@/lib/data/repository";
import { mockCategories, mockProducts } from "@/lib/data/mock/products";
import { getDeliveryFee } from "@/lib/config/delivery";
import {
  NEUTRAL_COLOR,
  NEUTRAL_SIZE,
  sortColorLabels,
  sortSizeLabels,
} from "@/lib/variant-options";

const DEMO_ORDERS_KEY = "seniors-demo-orders";
let memoryOrders: Order[] = [];

function sortProducts(products: Product[], sort: ProductSort) {
  return [...products].sort((first, second) => {
    if (sort === "price-asc") {
      return first.base_price_kes - second.base_price_kes;
    }
    if (sort === "price-desc") {
      return second.base_price_kes - first.base_price_kes;
    }
    return second.created_at.localeCompare(first.created_at);
  });
}

function readOrders(): Order[] {
  if (typeof window === "undefined") {
    return memoryOrders;
  }

  try {
    const storedOrders = window.localStorage.getItem(DEMO_ORDERS_KEY);
    if (!storedOrders) {
      return memoryOrders;
    }
    const parsed: unknown = JSON.parse(storedOrders);
    if (!Array.isArray(parsed)) {
      throw new Error("Stored demo orders must be an array.");
    }
    return parsed as Order[];
  } catch (error) {
    console.warn("Could not read demo orders from localStorage.", error);
    return memoryOrders;
  }
}

function writeOrders(orders: Order[]) {
  memoryOrders = orders;
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(DEMO_ORDERS_KEY, JSON.stringify(orders));
  } catch (error) {
    console.warn("Could not save demo orders to localStorage.", error);
  }
}

function createId() {
  return globalThis.crypto?.randomUUID?.() ??
    `demo-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
}

function createOrderNumber(orders: Order[]) {
  const existingNumbers = new Set(orders.map((order) => order.order_number));

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const digits = createId().replace(/\D/g, "").slice(0, 6).padEnd(6, "0");
    const orderNumber = `SE-${digits}`;
    if (!existingNumbers.has(orderNumber)) {
      return orderNumber;
    }
  }

  throw new Error("Could not create a unique demo order number.");
}

function normalizedContact(contact: string) {
  const value = contact.trim();
  if (value.includes("@")) {
    return value.toLocaleLowerCase();
  }

  const digits = value.replace(/\D/g, "");
  return digits.startsWith("0") ? `254${digits.slice(1)}` : digits;
}

function orderMatchesContact(order: Order, contact: string) {
  const normalized = normalizedContact(contact);
  return normalized === normalizedContact(order.email) ||
    normalized === normalizedContact(order.phone);
}

export function saveMockOrder(order: Order) {
  if (typeof window === "undefined") {
    throw new Error("Demo orders can only be saved in a browser.");
  }

  const orders = readOrders();
  if (!orders.some((existing) => existing.order_number === order.order_number)) {
    writeOrders([order, ...orders]);
  }
}

export const mockRepository: StoreRepository = {
  async getCategories(): Promise<Category[]> {
    return mockCategories.map((category) => ({ ...category }));
  },

  async getCategoryBySlug(slug) {
    return mockCategories.find((category) => category.slug === slug) ?? null;
  },

  async getProducts(
    filters: ProductFilters,
    sort: ProductSort,
    page: number,
  ): Promise<ProductResults> {
    let products = mockProducts.filter((product) => product.is_active);

    if (filters.categoryId) {
      products = products.filter(
        (product) => product.category_id === filters.categoryId,
      );
    }
    if (filters.categorySlug) {
      const category = mockCategories.find(
        (entry) => entry.slug === filters.categorySlug,
      );
      products = category
        ? products.filter((product) => product.category_id === category.id)
        : [];
    }
    if (filters.query) {
      const query = filters.query.trim().toLocaleLowerCase();
      products = products.filter((product) =>
        product.name.toLocaleLowerCase().includes(query),
      );
    }
    if (filters.size) {
      products = products.filter((product) =>
        product.variants.some((variant) => variant.size === filters.size),
      );
    }
    if (filters.color) {
      products = products.filter((product) =>
        product.variants.some(
          (variant) =>
            variant.color.toLocaleLowerCase() ===
            filters.color?.toLocaleLowerCase(),
        ),
      );
    }
    if (filters.minPrice !== undefined) {
      products = products.filter(
        (product) => product.base_price_kes >= filters.minPrice!,
      );
    }
    if (filters.maxPrice !== undefined) {
      products = products.filter(
        (product) => product.base_price_kes <= filters.maxPrice!,
      );
    }

    const sortedProducts = sortProducts(products, sort);
    const pageSize = filters.pageSize ?? 12;
    const start = (Math.max(1, page) - 1) * pageSize;

    return {
      products: sortedProducts.slice(start, start + pageSize),
      totalCount: sortedProducts.length,
    };
  },

  async getProductBySlug(slug) {
    return mockProducts.find(
      (product) => product.slug === slug && product.is_active,
    ) ?? null;
  },

  async getFeaturedProducts(limit = 4) {
    return mockProducts
      .filter((product) => product.is_active && product.is_featured)
      .slice(0, limit);
  },

  async searchProducts(query): Promise<SearchProduct[]> {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    if (!normalizedQuery) {
      return [];
    }

    return mockProducts
      .filter(
        (product) =>
          product.is_active &&
          product.name.toLocaleLowerCase().includes(normalizedQuery),
      )
      .slice(0, 5)
      .map((product) => ({
        id: product.id,
        name: product.name,
        slug: product.slug,
        base_price_kes: product.base_price_kes,
        imageUrl: product.images[0]?.url ?? null,
      }));
  },

  async getFilterOptions() {
    const sizes = new Set<string>();
    const colors = new Set<string>();
    for (const product of mockProducts) {
      for (const variant of product.variants) {
        sizes.add(variant.size);
        colors.add(variant.color);
      }
    }
    return {
      sizes: sortSizeLabels([...sizes]).filter((size) => size !== NEUTRAL_SIZE),
      colors: sortColorLabels([...colors]).filter(
        (color) => color !== NEUTRAL_COLOR,
      ),
    };
  },

  async createOrder(input: CreateOrderInput): Promise<Order> {
    const orders = readOrders();
    const orderId = createId();
    const items: OrderItem[] = input.items.map((item) => {
      const product = mockProducts.find(
        (candidate) =>
          candidate.is_active &&
          candidate.variants.some((variant) => variant.id === item.variant_id),
      );
      const variant = product?.variants.find(
        (candidate) => candidate.id === item.variant_id,
      );

      if (!product || !variant) {
        throw new Error("A selected product variant is no longer available.");
      }
      if (item.quantity > variant.stock_quantity) {
        throw new Error(`Not enough stock is available for ${product.name}.`);
      }

      return {
        id: createId(),
        order_id: orderId,
        product_id: product.id,
        variant_id: variant.id,
        product_name_snapshot: `${product.name} (${variant.size}, ${variant.color})`,
        unit_price_kes: variant.price_override_kes ?? product.base_price_kes,
        quantity: item.quantity,
      };
    });
    const subtotalKes = items.reduce(
      (subtotal, item) => subtotal + item.unit_price_kes * item.quantity,
      0,
    );
    const deliveryFeeKes = getDeliveryFee(
      String(input.delivery_address.county_code ?? input.delivery_address.county),
      input.delivery_address.town,
    );
    const order: Order = {
      id: orderId,
      order_number: createOrderNumber(orders),
      user_id: input.user_id ?? null,
      customer_name: input.customer_name,
      email: input.email,
      phone: input.phone,
      delivery_address: input.delivery_address,
      subtotal_kes: subtotalKes,
      delivery_fee_kes: deliveryFeeKes,
      total_kes: subtotalKes + deliveryFeeKes,
      status: "pending",
      payment_status: "pending",
      paystack_reference: null,
      created_at: new Date().toISOString(),
      items,
    };
    writeOrders([order, ...orders]);
    return order;
  },

  async getOrderByNumber(
    orderNumber: string,
    contact: string,
  ): Promise<Order | null> {
    return readOrders().find(
      (candidate) =>
        candidate.order_number === orderNumber &&
        orderMatchesContact(candidate, contact),
    ) ?? null;
  },

  async getOrders() {
    return [...readOrders()];
  },

  async updateOrderPayment(orderNumber, update: UpdateOrderPaymentInput) {
    const orders = readOrders();
    const order = orders.find((entry) => entry.order_number === orderNumber);
    if (!order) {
      return null;
    }

    const updatedOrder: Order = {
      ...order,
      payment_status: update.paymentStatus,
      paystack_reference: update.paymentReference,
      status: update.status,
    };
    writeOrders(
      orders.map((entry) =>
        entry.order_number === orderNumber ? updatedOrder : entry,
      ),
    );
    return updatedOrder;
  },

  async updateOrderStatus(orderNumber, status: OrderStatus) {
    const orders = readOrders();
    const updatedOrder = orders.find(
      (entry) => entry.order_number === orderNumber,
    );
    if (!updatedOrder) {
      return null;
    }

    const nextOrder = { ...updatedOrder, status };
    writeOrders(
      orders.map((entry) =>
        entry.order_number === orderNumber ? nextOrder : entry,
      ),
    );
    return nextOrder;
  },
};
