import type { Metadata } from "next";

import { CheckoutForm } from "@/components/store/checkout-form";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Enter your contact and delivery details to place an order.",
};

export default function CheckoutPage() {
  return (
    <main>
      <CheckoutForm />
    </main>
  );
}
