import type {
  Category,
  CreateOrderInput,
  Order,
  Product,
  ProductFilters,
  ProductResults,
  ProductSort,
  SearchProduct,
  UpdateOrderPaymentInput,
} from "@/lib/data/types";

export interface StoreRepository {
  getCategories(): Promise<Category[]>;
  getCategoryBySlug(slug: string): Promise<Category | null>;
  getProducts(
    filters: ProductFilters,
    sort: ProductSort,
    page: number,
  ): Promise<ProductResults>;
  getProductBySlug(slug: string): Promise<Product | null>;
  getFeaturedProducts(limit?: number): Promise<Product[]>;
  searchProducts(query: string): Promise<SearchProduct[]>;
  getFilterOptions(): Promise<{ sizes: string[]; colors: string[] }>;
  createOrder(input: CreateOrderInput): Promise<Order>;
  getOrderByNumber(orderNumber: string): Promise<Order | null>;
  updateOrderPayment(
    orderNumber: string,
    update: UpdateOrderPaymentInput,
  ): Promise<Order | null>;
}
