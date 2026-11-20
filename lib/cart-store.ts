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
  addItem: (item: Omit<CartItem, "quantity">) => boolean;
  changeQuantity: (variantId: string, quantity: number) => boolean;
  removeItem: (variantId: string) => void;
  clearCart: () => void;
}

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
      addItem: (item) => {
        let added = true;

        set((state) => {
          const existingItem = state.items.find(
            (currentItem) => currentItem.variantId === item.variantId,
          );
          if (existingItem) {
            if (existingItem.quantity >= item.maxStock) {
              added = false;
              return state;
            }

            return {
              items: state.items.map((currentItem) =>
                currentItem.variantId === item.variantId
                  ? {
                      ...currentItem,
                      maxStock: item.maxStock,
                      quantity: currentItem.quantity + 1,
                      unitPriceKes: item.unitPriceKes,
                    }
                  : currentItem,
              ),
            };
          }

          if (item.maxStock < 1) {
            added = false;
            return state;
          }

          return { items: [...state.items, { ...item, quantity: 1 }] };
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
