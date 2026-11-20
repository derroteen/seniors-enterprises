import type { Metadata } from "next";

import { CartPage } from "@/components/store/cart-page";

export const metadata: Metadata = {
  title: "Cart",
  description: "Review the products in your cart.",
};

export default function CartRoute() {
  return <CartPage />;
}
