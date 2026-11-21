export type OrderStatus =
  | "pending"
  | "paid"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  image_url: string | null;
  created_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  size: string;
  color: string;
  sku: string;
  stock_quantity: number;
  price_override_kes: number | null;
}

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  alt_text: string | null;
  sort_order: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category_id: string;
  base_price_kes: number;
  compare_at_price_kes: number | null;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  images: ProductImage[];
  variants: ProductVariant[];
}

export interface DeliveryAddress {
  county: string;
  town: string;
  street: string;
  landmark: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  variant_id: string | null;
  product_name_snapshot: string;
  unit_price_kes: number;
  quantity: number;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string | null;
  customer_name: string;
  email: string;
  phone: string;
  delivery_address: DeliveryAddress;
  subtotal_kes: number;
  delivery_fee_kes: number;
  total_kes: number;
  status: OrderStatus;
  payment_status: PaymentStatus;
  paystack_reference: string | null;
  created_at: string;
  items: OrderItem[];
}

export interface OrderLookupItem {
  product_name_snapshot: string;
  unit_price_kes: number;
  quantity: number;
}

export interface OrderLookupResult {
  status: OrderStatus;
  items: OrderLookupItem[];
  total_kes: number;
}

export type ProductSort = "newest" | "price-asc" | "price-desc";

export interface ProductFilters {
  categoryId?: string;
  categorySlug?: string;
  color?: string;
  maxPrice?: number;
  minPrice?: number;
  pageSize?: number;
  query?: string;
  size?: string;
}

export interface ProductResults {
  products: Product[];
  totalCount: number;
}

export interface SearchProduct {
  id: string;
  name: string;
  slug: string;
  base_price_kes: number;
  imageUrl: string | null;
}

export interface CreateOrderInput {
  customer_name: string;
  email: string;
  phone: string;
  delivery_address: DeliveryAddress;
  items: Array<{
    variant_id: string;
    quantity: number;
  }>;
}

export interface UpdateOrderPaymentInput {
  paymentReference: string;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
}
