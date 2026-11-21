import type { Metadata } from "next";

import { OrderLookup } from "@/components/store/order-lookup";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { firstSearchParam } from "@/lib/store-format";

export const metadata: Metadata = {
  title: "Track an order",
  description: "Look up an order using its number and checkout contact details.",
};

interface TrackOrderPageProps {
  searchParams: Promise<{ number?: string | string[] }>;
}

export default async function TrackOrderPage({
  searchParams,
}: TrackOrderPageProps) {
  const { number } = await searchParams;

  return (
    <main>
      <Section>
        <Container>
          <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-surface p-6 sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary">
              Order lookup
            </p>
            <h1 className="mt-2 font-display text-3xl font-semibold">
              Track your order
            </h1>
            <p className="mt-3 mb-6 leading-7 text-muted-foreground">
              Enter the order number and the phone number or email address used
              at checkout. For your privacy, order numbers alone cannot be used
              to view order details.
            </p>
            <OrderLookup initialOrderNumber={firstSearchParam(number) ?? ""} />
          </div>
        </Container>
      </Section>
    </main>
  );
}
