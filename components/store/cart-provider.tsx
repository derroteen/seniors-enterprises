"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export interface CartLine {
  color: string;
  productName: string;
  quantity: number;
  size: string;
  unitPriceKes: number;
  variantId: string;
}

interface CartContextValue {
  addToCart: (line: Omit<CartLine, "quantity">) => void;
  itemCount: number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const itemCount = lines.reduce((total, line) => total + line.quantity, 0);

  function addToCart(line: Omit<CartLine, "quantity">) {
    setLines((currentLines) => {
      const existingLine = currentLines.find(
        (currentLine) => currentLine.variantId === line.variantId,
      );

      if (existingLine) {
        return currentLines.map((currentLine) =>
          currentLine.variantId === line.variantId
            ? { ...currentLine, quantity: currentLine.quantity + 1 }
            : currentLine,
        );
      }

      return [...currentLines, { ...line, quantity: 1 }];
    });
  }

  return (
    <CartContext.Provider value={{ addToCart, itemCount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const cart = useContext(CartContext);
  if (!cart) {
    throw new Error("useCart must be used within a CartProvider.");
  }
  return cart;
}
