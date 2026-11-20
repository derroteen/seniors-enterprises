import type { Metadata } from "next";

import { CheckoutResult } from "@/components/store/checkout-result";
import { firstSearchParam } from "@/lib/store-format";

export const metadata: Metadata = {
  title: "Payment not completed",
  description: "Demo payment failure details.",
};

interface CheckoutFailedPageProps {
  searchParams: Promise<{ order?: string | string[] }>;
}

export default async function CheckoutFailedPage({
  searchParams,
}: CheckoutFailedPageProps) {
  const { order } = await searchParams;

  return (
    <main>
      <CheckoutResult
        outcome="failed"
        orderNumber={firstSearchParam(order) ?? ""}
      />
    </main>
  );
}
