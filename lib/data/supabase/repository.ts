import type { StoreRepository } from "@/lib/data/repository";

function notImplemented(): never {
  throw new Error("Not implemented yet: connect Supabase in the backend phase");
}

export const supabaseRepository: StoreRepository = {
  async getCategories() {
    return notImplemented();
  },
  async getCategoryBySlug() {
    return notImplemented();
  },
  async getProducts() {
    return notImplemented();
  },
  async getProductBySlug() {
    return notImplemented();
  },
  async getFeaturedProducts() {
    return notImplemented();
  },
  async searchProducts() {
    return notImplemented();
  },
  async getFilterOptions() {
    return notImplemented();
  },
  async createOrder() {
    return notImplemented();
  },
  async getOrderByNumber() {
    return notImplemented();
  },
};
