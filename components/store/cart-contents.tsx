"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { StatusMessage } from "@/components/ui/status-message";
import { useCartStore, getCartSubtotal } from "@/lib/cart-store";
import { formatKes } from "@/lib/store-format";

interface CartContentsProps {
  onNavigate?: () => void;
  showSummary?: boolean;
}

export function CartContents({
  onNavigate,
  showSummary = true,
}: CartContentsProps) {
  const items = useCartStore((state) => state.items);
  const changeQuantity = useCartStore((state) => state.changeQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const recentlyAddedVariantId = useCartStore(
    (state) => state.highlightedVariantId,
  );
  const subtotal = getCartSubtotal(items);
  const [stockWarning, setStockWarning] = useState("");

  if (items.length === 0) {
    return (
      <div className="flex min-h-64 flex-col items-center justify-center text-center">
        <p className="font-display text-xl font-semibold">Your cart is empty</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Take a look at the collection and find something you love.
        </p>
        <Link
          href="/shop"
          onClick={onNavigate}
          className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div>
      <ul className="grid gap-4">
        {items.map((item) => (
          <li
            key={item.variantId}
            className={`grid grid-cols-[4.5rem_minmax(0,1fr)] gap-3 border-b border-border pb-4 ${
              recentlyAddedVariantId === item.variantId
                ? "rounded-lg bg-accent/10 ring-2 ring-accent/60"
                : ""
            }`}
          >
            <Link
              href={`/product/${item.productSlug}`}
              onClick={onNavigate}
              className="relative aspect-[4/5] overflow-hidden rounded-lg bg-background"
              aria-label={`View ${item.productName}`}
            >
              {item.imageUrl ? (
                <Image
                  src={item.imageUrl}
                  alt={item.productName}
                  fill
                  sizes="72px"
                  unoptimized
                  className="object-cover"
                />
              ) : (
                <span
                  aria-hidden="true"
                  className="grid h-full place-items-center font-display text-2xl text-primary/40"
                >
                  {item.productName.charAt(0)}
                </span>
              )}
            </Link>

            <div className="min-w-0">
              <Link
                href={`/product/${item.productSlug}`}
                onClick={onNavigate}
                className="line-clamp-2 text-sm font-semibold hover:text-primary"
              >
                {item.productName}
              </Link>
              <p className="mt-1 text-xs text-muted-foreground">
                Size {item.size} · {item.color}
              </p>
              <p className="mt-1 text-sm font-medium">{formatKes(item.unitPriceKes)}</p>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <div
                  className="inline-flex min-h-9 items-center rounded-lg border border-strong"
                  role="group"
                  aria-label={`Quantity for ${item.productName}`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      changeQuantity(item.variantId, item.quantity - 1);
                      setStockWarning("");
                    }}
                    aria-label={`Decrease ${item.productName} quantity`}
                    className="grid size-9 place-items-center rounded-l-lg hover:bg-background"
                  >
                    <span aria-hidden="true">−</span>
                  </button>
                  <span
                    aria-label={`Quantity ${item.quantity}`}
                    className="min-w-8 text-center text-sm tabular-nums"
                  >
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const changed = changeQuantity(
                        item.variantId,
                        item.quantity + 1,
                      );
                      setStockWarning(
                        changed
                          ? ""
                          : `Only ${item.maxStock} available for ${item.productName}.`,
                      );
                    }}
                    aria-label={`Increase ${item.productName} quantity`}
                    disabled={item.quantity >= item.maxStock}
                    className="grid size-9 place-items-center rounded-r-lg hover:bg-background disabled:cursor-not-allowed disabled:text-muted-foreground disabled:opacity-80"
                  >
                    <span aria-hidden="true">+</span>
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    removeItem(item.variantId);
                    setStockWarning("");
                  }}
                  className="min-h-9 px-2 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                  Remove
                </button>
              </div>
              {item.quantity >= item.maxStock ? (
                <StatusMessage tone="warning" className="mt-1 text-xs">
                  Maximum available quantity reached.
                </StatusMessage>
              ) : null}
            </div>
          </li>
        ))}
      </ul>

      {stockWarning ? (
        <StatusMessage role="status" aria-live="polite" tone="warning" className="mt-3 min-h-5">
          {stockWarning}
        </StatusMessage>
      ) : (
        <p aria-live="polite" className="mt-3 min-h-5" />
      )}

      {showSummary ? (
        <div className="mt-4 border-t border-border pt-4">
          <div className="flex items-center justify-between gap-4">
            <span className="font-semibold">Subtotal</span>
            <span className="text-lg font-semibold">{formatKes(subtotal)}</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Free delivery countrywide.
          </p>
          <Link
            href="/checkout"
            onClick={onNavigate}
            className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            Continue to checkout
          </Link>
        </div>
      ) : null}
    </div>
  );
}
