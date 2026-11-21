import type { Metadata } from "next";
import { connection } from "next/server";

import { CheckoutForm } from "@/components/store/checkout-form";
import { getCheckoutProfile } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Enter your contact and delivery details to place an order.",
};

export default async function CheckoutPage() {
  await connection();

  let initialCustomer = null;
  try {
    initialCustomer = await getCheckoutProfile();
  } catch (error) {
    console.error("Could not prefill checkout from the signed-in profile.", error);
  }

  return (
    <main>
      <CheckoutForm initialCustomer={initialCustomer} />
    </main>
  );
}
