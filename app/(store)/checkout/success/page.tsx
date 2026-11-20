import type { Metadata } from "next";

import { CheckoutResult } from "@/components/store/checkout-result";
import { firstSearchParam } from "@/lib/store-format";

export const metadata: Metadata = {
  title: "Order confirmed",
  description: "Your demo order confirmation.",
};

interface CheckoutSuccessPageProps {
  searchParams: Promise<{ order?: string | string[] }>;
}

export default async function CheckoutSuccessPage({
  searchParams,
}: CheckoutSuccessPageProps) {
  const { order } = await searchParams;

  return (
    <main>
      <CheckoutResult
        outcome="success"
        orderNumber={firstSearchParam(order) ?? ""}
      />
    </main>
  );
}
