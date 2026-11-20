import type { Metadata } from "next";

import { OrderLookup } from "@/components/store/order-lookup";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { firstSearchParam } from "@/lib/store-format";

export const metadata: Metadata = {
  title: "Track an order",
  description: "Look up a demo order by its order number.",
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
              Demo order lookup
            </p>
            <h1 className="mt-2 font-display text-3xl font-semibold">
              Track your order
            </h1>
            <p className="mt-3 mb-6 leading-7 text-muted-foreground">
              Enter the order number from your confirmation. Demo orders are
              stored only in the browser where they were placed.
            </p>
            <OrderLookup initialOrderNumber={firstSearchParam(number) ?? ""} />
          </div>
        </Container>
      </Section>
    </main>
  );
}
