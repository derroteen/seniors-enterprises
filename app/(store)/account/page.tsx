import type { Metadata } from "next";
import Link from "next/link";

import { getAccountOrders } from "@/lib/account/data";
import { BRAND } from "@/lib/brand";
import { formatKes } from "@/lib/store-format";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { StatusBadge } from "@/components/ui/status-message";

export const metadata: Metadata = {
  title: "My account",
  description: `View your ${BRAND.name} orders.`,
};

export default async function AccountPage() {
  const orders = await getAccountOrders();

  return (
    <main>
      <Section>
        <Container>
          <div className="mx-auto max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary">
              Your account
            </p>
            <h1 className="mt-2 font-display text-3xl font-semibold">My account</h1>
            <h2 className="mt-8 text-xl font-semibold">Your orders</h2>
            {orders.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-border bg-surface p-6">
                <p className="text-muted-foreground">You have not placed any orders yet.</p>
                <Link
                  href="/shop"
                  className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground"
                >
                  Browse the shop
                </Link>
              </div>
            ) : (
              <ul className="mt-4 grid gap-4">
                {orders.map((order) => (
                  <li
                    key={order.orderNumber}
                    className="rounded-2xl border border-border bg-surface p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold">{order.orderNumber}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatKes(order.totalKes)}</p>
                        <div className="mt-1">
                          <StatusBadge status={order.status} />
                        </div>
                      </div>
                    </div>
                    <ul className="mt-4 grid gap-2 border-t border-border pt-3 text-sm">
                      {order.items.map((item, index) => (
                        <li key={`${order.orderNumber}-${index}`} className="flex justify-between gap-3">
                          <span>{item.name} × {item.quantity}</span>
                          <span>{formatKes(item.unitPriceKes * item.quantity)}</span>
                        </li>
                      ))}
                    </ul>
                    <Link
                      href={`/track-order?number=${encodeURIComponent(order.orderNumber)}`}
                      className="mt-4 inline-block text-sm font-semibold text-primary hover:underline"
                    >
                      Track this order
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Container>
      </Section>
    </main>
  );
}
