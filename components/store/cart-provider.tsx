"use client";

import { useEffect, type ReactNode } from "react";

import { useCartStore } from "@/lib/cart-store";

export function CartProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    void useCartStore.persist.rehydrate();
  }, []);

  return children;
}
