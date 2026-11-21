import { create } from "zustand";
import {
  createJSONStorage,
  persist,
  type StateStorage,
} from "zustand/middleware";

export interface CartItem {
  color: string;
  imageUrl: string | null;
  maxStock: number;
  productId: string;
  productName: string;
  productSlug: string;
  quantity: number;
  size: string;
  unitPriceKes: number;
  variantId: string;
}

interface CartStore {
  items: CartItem[];
  drawerOpen: boolean;
  highlightedVariantId: string | null;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => boolean;
  changeQuantity: (variantId: string, quantity: number) => boolean;
  removeItem: (variantId: string) => void;
  clearCart: () => void;
  openDrawer: (highlightedVariantId?: string) => void;
  closeDrawer: () => void;
}

let highlightTimer: number | null = null;

const storage: StateStorage = {
  getItem(name) {
    if (typeof window === "undefined") {
      return null;
    }

    try {
      return window.localStorage.getItem(name);
    } catch (error) {
      console.warn("Could not read the cart from localStorage.", error);
      return null;
    }
  },
  setItem(name, value) {
    if (typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.setItem(name, value);
    } catch (error) {
      console.warn("Could not save the cart to localStorage.", error);
    }
  },
  removeItem(name) {
    if (typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.removeItem(name);
    } catch (error) {
      console.warn("Could not clear the cart from localStorage.", error);
    }
  },
};

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      items: [],
      drawerOpen: false,
      highlightedVariantId: null,
      addItem: (item, quantity = 1) => {
        let added = false;
        if (!Number.isInteger(quantity) || quantity < 1 || item.maxStock < 1) {
          return false;
        }

        set((state) => {
          const existingItem = state.items.find(
            (currentItem) => currentItem.variantId === item.variantId,
          );
          if (existingItem) {
            const nextQuantity = existingItem.quantity + quantity;
            if (nextQuantity > item.maxStock) {
              return state;
            }

            added = true;
            return {
              items: state.items.map((currentItem) =>
                currentItem.variantId === item.variantId
                  ? {
                      ...currentItem,
                      maxStock: item.maxStock,
                      quantity: nextQuantity,
                      unitPriceKes: item.unitPriceKes,
                    }
                  : currentItem,
              ),
            };
          }

          if (quantity > item.maxStock) {
            return state;
          }

          added = true;
          return { items: [...state.items, { ...item, quantity }] };
        });

        return added;
      },
      changeQuantity: (variantId, quantity) => {
        let changed = true;

        set((state) => {
          const currentItem = state.items.find(
            (item) => item.variantId === variantId,
          );
          if (!currentItem) {
            return state;
          }
          if (quantity > currentItem.maxStock) {
            changed = false;
            return state;
          }
          if (quantity <= 0) {
            return {
              items: state.items.filter((item) => item.variantId !== variantId),
            };
          }

          return {
            items: state.items.map((item) =>
              item.variantId === variantId ? { ...item, quantity } : item,
            ),
          };
        });

        return changed;
      },
      removeItem: (variantId) =>
        set((state) => ({
          items: state.items.filter((item) => item.variantId !== variantId),
        })),
      clearCart: () => set({ items: [] }),
      openDrawer: (highlightedVariantId) => {
        set((state) => ({
          drawerOpen: true,
          highlightedVariantId:
            highlightedVariantId ?? state.highlightedVariantId,
        }));

        if (typeof window !== "undefined" && highlightedVariantId) {
          if (highlightTimer !== null) {
            window.clearTimeout(highlightTimer);
          }
          highlightTimer = window.setTimeout(() => {
            set((state) =>
              state.highlightedVariantId === highlightedVariantId
                ? { highlightedVariantId: null }
                : state,
            );
            highlightTimer = null;
          }, 1200);
        }
      },
      closeDrawer: () => {
        if (typeof window !== "undefined" && highlightTimer !== null) {
          window.clearTimeout(highlightTimer);
          highlightTimer = null;
        }
        set({ drawerOpen: false, highlightedVariantId: null });
      },
    }),
    {
      name: "seniors-enterprises-cart",
      storage: createJSONStorage(() => storage),
      skipHydration: true,
      partialize: (state) => ({ items: state.items }),
    },
  ),
);

export function getCartItemCount(items: CartItem[]) {
  return items.reduce((count, item) => count + item.quantity, 0);
}

export function getCartSubtotal(items: CartItem[]) {
  return items.reduce(
    (subtotal, item) => subtotal + item.unitPriceKes * item.quantity,
    0,
  );
}
