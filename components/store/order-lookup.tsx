"use client";

import { useState, type FormEvent } from "react";

import { dataRepository } from "@/lib/data";
import type { Order } from "@/lib/data/types";
import { formatKes } from "@/lib/store-format";

interface OrderLookupProps {
  initialOrderNumber?: string;
}

export function OrderLookup({ initialOrderNumber = "" }: OrderLookupProps) {
  const [orderNumber, setOrderNumber] = useState(initialOrderNumber);
  const [order, setOrder] = useState<Order | null>(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function lookUpOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setOrder(null);
    const normalized = orderNumber.trim().toUpperCase();
    if (!normalized) {
      setMessage("Enter your order number.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await dataRepository.getOrderByNumber(normalized);
      if (!result) {
        setMessage("No order was found in this browser. Check the order number.");
      } else {
        setOrder(result);
      }
    } catch (error) {
      console.error("Order lookup failed.", error);
      setMessage("Order lookup is unavailable. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      <form onSubmit={lookUpOrder} className="flex flex-col gap-3 sm:flex-row">
        <div className="grid flex-1 gap-1.5">
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
        <button
          type="submit"
          disabled={isLoading}
          className="mt-auto inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {isLoading ? "Looking up…" : "Look up order"}
        </button>
      </form>

      {message ? (
        <p role="status" className="mt-4 text-sm text-muted-foreground">{message}</p>
      ) : null}

      {order ? (
        <section
          aria-labelledby="order-result-heading"
          className="mt-6 rounded-xl border border-border bg-background p-4"
        >
          <h2 id="order-result-heading" className="font-semibold">
            Order {order.order_number}
          </h2>
          <p className="mt-2 text-sm">
            Status: <span className="font-medium capitalize">{order.status}</span>
          </p>
          <p className="mt-1 text-sm">
            Payment: <span className="font-medium capitalize">{order.payment_status}</span>
          </p>
          <p className="mt-1 text-sm">
            Total: <span className="font-medium">{formatKes(order.total_kes)}</span>
          </p>
          <ul className="mt-4 grid gap-2 border-t border-border pt-3 text-sm">
            {order.items.map((item) => (
              <li key={item.id} className="flex justify-between gap-3">
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
