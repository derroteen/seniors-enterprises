"use client";

import { useState, type FormEvent } from "react";
import { z } from "zod";

import { StatusBadge, StatusMessage } from "@/components/ui/status-message";
import { mockRepository } from "@/lib/data/mock/repository";
import type { OrderLookupResult } from "@/lib/data/types";
import { formatKes } from "@/lib/store-format";

interface OrderLookupProps {
  initialOrderNumber?: string;
}

type LookupOrderResult = OrderLookupResult;

const lookupResultSchema = z.object({
  status: z.enum([
    "pending",
    "paid",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
    "refunded",
  ]),
  items: z.array(
    z.object({
      product_name_snapshot: z.string(),
      unit_price_kes: z.number(),
      quantity: z.number(),
    }),
  ),
  total_kes: z.number(),
});

const lookupErrorSchema = z.object({ message: z.string().optional() });

export function OrderLookup({ initialOrderNumber = "" }: OrderLookupProps) {
  const [orderNumber, setOrderNumber] = useState(initialOrderNumber);
  const [contact, setContact] = useState("");
  const [order, setOrder] = useState<LookupOrderResult | null>(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function lookUpOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setOrder(null);
    const normalized = orderNumber.trim().toUpperCase();
    if (!normalized || !contact.trim()) {
      setMessage("Enter your order number and the phone number or email used at checkout.");
      return;
    }

    setIsLoading(true);
    try {
      let result: LookupOrderResult | null;
      if ((process.env.NEXT_PUBLIC_DATA_SOURCE ?? "supabase") === "mock") {
        const mockOrder = await mockRepository.getOrderByNumber(normalized, contact);
        result = mockOrder
          ? {
              status: mockOrder.status,
              items: mockOrder.items.map((item) => ({
                product_name_snapshot: item.product_name_snapshot,
                unit_price_kes: item.unit_price_kes,
                quantity: item.quantity,
              })),
              total_kes: mockOrder.total_kes,
            }
          : null;
      } else {
        const response = await fetch("/api/orders/lookup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderNumber: normalized, contact }),
        });
        const responseBody: unknown = await response.json();

        if (!response.ok) {
          const errorBody = lookupErrorSchema.safeParse(responseBody);
          throw new Error(errorBody.success
            ? errorBody.data.message ?? "Order lookup is unavailable."
            : "Order lookup is unavailable.");
        }
        const parsedResult = lookupResultSchema.safeParse(responseBody);
        if (!parsedResult.success) {
          throw new Error("Order lookup returned an invalid response.");
        }
        result = parsedResult.data;
      }

      if (!result) {
        setMessage("The order number and contact did not match.");
      } else {
        setOrder(result);
      }
    } catch (error) {
      console.error("Order lookup failed.", error);
      setMessage(
        error instanceof Error
          ? error.message
          : "Order lookup is unavailable. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      <form onSubmit={lookUpOrder} className="flex flex-col gap-3 sm:flex-row">
        <div className="grid flex-1 gap-3">
          <div className="grid gap-1.5">
            <label htmlFor="order-number" className="text-sm font-medium">
              Order number
            </label>
            <input
              id="order-number"
              name="orderNumber"
              value={orderNumber}
              onChange={(event) => setOrderNumber(event.target.value)}
              placeholder="SE-000123"
              autoComplete="off"
              className="min-h-11 rounded-lg border border-border bg-background px-3 text-foreground"
            />
          </div>
          <div className="grid gap-1.5">
            <label htmlFor="order-contact" className="text-sm font-medium">
              Checkout phone or email
            </label>
            <input
              id="order-contact"
              name="contact"
              value={contact}
              onChange={(event) => setContact(event.target.value)}
              placeholder="0712 345 678 or name@example.com"
              autoComplete="off"
              className="min-h-11 rounded-lg border border-border bg-background px-3 text-foreground"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="mt-auto inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:bg-muted-bg disabled:text-muted-foreground disabled:opacity-100"
        >
          {isLoading ? "Looking up…" : "Look up order"}
        </button>
      </form>

      {message ? (
        <StatusMessage tone="danger" className="mt-4">
          {message}
        </StatusMessage>
      ) : null}

      {order ? (
        <section
          aria-labelledby="order-result-heading"
          className="mt-6 rounded-xl border border-border bg-background p-4"
        >
          <h2 id="order-result-heading" className="font-semibold">
            Order {orderNumber.trim().toUpperCase()}
          </h2>
          <p className="mt-2 text-sm">
            Status: <StatusBadge status={order.status} />
          </p>
          <p className="mt-1 text-sm">
            Total: <span className="font-medium">{formatKes(order.total_kes)}</span>
          </p>
          <ul className="mt-4 grid gap-2 border-t border-border pt-3 text-sm">
            {order.items.map((item, index) => (
              <li key={`${item.product_name_snapshot}-${index}`} className="flex justify-between gap-3">
                <span>{item.product_name_snapshot} × {item.quantity}</span>
                <span>{formatKes(item.unit_price_kes * item.quantity)}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
