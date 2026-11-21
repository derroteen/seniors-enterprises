"use client";

import Link from "next/link";

import { getWhatsAppUrl } from "@/lib/whatsapp";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";

interface CheckoutResultProps {
  orderNumber: string;
  outcome: "success" | "failed";
}

export function CheckoutResult({ orderNumber, outcome }: CheckoutResultProps) {
  const isDemoMode = process.env.NEXT_PUBLIC_PAYMENT_MODE === "demo";
  const succeeded = outcome === "success";
  const orderWhatsAppUrl = orderNumber
    ? getWhatsAppUrl(
        isDemoMode
          ? `Hello, I have a question about my order ${orderNumber}.`
          : `Hello, I placed order ${orderNumber} and would like to arrange payment.`,
      )
    : null;

  return (
    <Section>
      <Container>
        <div className="mx-auto max-w-2xl">
          {isDemoMode ? (
            <div className="rounded-xl border border-accent bg-accent/15 px-4 py-3 text-sm font-semibold">
              DEMO MODE: no real payment taken
            </div>
          ) : null}
          <div className="mt-6 rounded-2xl border border-border bg-surface p-6 sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary">
              {isDemoMode
                ? succeeded
                  ? "Demo order complete"
                  : "Demo payment not completed"
                : "Order received"}
            </p>
            <h1 className="mt-2 font-display text-3xl font-semibold">
              {isDemoMode
                ? succeeded
                  ? "Thank you for your order."
                  : "Your demo payment failed."
                : "We will contact you on WhatsApp to arrange payment."}
            </h1>
            <p className="mt-3 leading-7 text-muted-foreground">
              {isDemoMode
                ? succeeded
                  ? "This demonstration order was recorded. No real payment was taken."
                  : "No real payment was taken. Your cart is still available if you want to try again."
                : "Your order is pending while payment is arranged. No online payment was taken."}
            </p>

            {orderNumber ? (
              <div className="mt-6 rounded-xl bg-background p-4">
                <p className="text-xs text-muted-foreground">Order number</p>
                <p className="mt-1 font-mono text-lg font-semibold">{orderNumber}</p>
              </div>
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
              {orderWhatsAppUrl ? (
                <a
                  href={orderWhatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center rounded-lg border border-border px-5 text-sm font-semibold hover:bg-background"
                >
                  {isDemoMode
                    ? "Questions about your order?"
                    : "Arrange payment on WhatsApp"}
                </a>
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
