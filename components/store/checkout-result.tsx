"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { dataRepository } from "@/lib/data";
import type { Order } from "@/lib/data/types";
import { formatKes } from "@/lib/store-format";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";

interface CheckoutResultProps {
  orderNumber: string;
  outcome: "success" | "failed";
}

export function CheckoutResult({ orderNumber, outcome }: CheckoutResultProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [lookupError, setLookupError] = useState("");

  useEffect(() => {
    if (!orderNumber) {
      return;
    }

    let active = true;
    dataRepository
      .getOrderByNumber(orderNumber)
      .then((result) => {
        if (active) {
          setOrder(result);
        }
      })
      .catch((error: unknown) => {
        console.error("Could not load demo order details.", error);
        if (active) {
          setLookupError("Order details could not be loaded in this browser.");
        }
      });

    return () => {
      active = false;
    };
  }, [orderNumber]);

  const succeeded = outcome === "success";

  return (
    <Section>
      <Container>
        <div className="mx-auto max-w-2xl">
          <div className="rounded-xl border border-accent bg-accent/15 px-4 py-3 text-sm font-semibold">
            DEMO MODE: no real payment taken
          </div>
          <div className="mt-6 rounded-2xl border border-border bg-surface p-6 sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary">
              {succeeded ? "Order complete" : "Payment not completed"}
            </p>
            <h1 className="mt-2 font-display text-3xl font-semibold">
              {succeeded ? "Thank you for your order." : "Your demo payment failed."}
            </h1>
            <p className="mt-3 leading-7 text-muted-foreground">
              {succeeded
                ? "This demonstration order was recorded locally in this browser."
                : "No real payment was taken. Your cart is still available if you want to try again."}
            </p>

            {orderNumber ? (
              <div className="mt-6 rounded-xl bg-background p-4">
                <p className="text-xs text-muted-foreground">Order number</p>
                <p className="mt-1 font-mono text-lg font-semibold">{orderNumber}</p>
                {order ? (
                  <div className="mt-4 grid gap-2 text-sm">
                    <p>
                      Status: <span className="font-medium capitalize">{order.status}</span>
                    </p>
                    <p>
                      Total: <span className="font-medium">{formatKes(order.total_kes)}</span>
                    </p>
                  </div>
                ) : null}
              </div>
            ) : null}

            {lookupError ? (
              <p role="status" className="mt-4 text-sm text-muted-foreground">
                {lookupError} Use the order number above to look it up while this
                browser retains its demo order.
              </p>
            ) : null}

            <div className="mt-7 flex flex-wrap gap-3">
              {orderNumber ? (
                <Link
                  href={`/track-order?number=${encodeURIComponent(orderNumber)}`}
                  className="inline-flex min-h-11 items-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-90"
                >
                  Track this order
                </Link>
              ) : null}
              <Link
                href="/shop"
                className="inline-flex min-h-11 items-center rounded-lg border border-border px-5 text-sm font-semibold hover:bg-background"
              >
                Continue shopping
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}
