"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { WhatsAppIcon } from "@/components/store/icons";
import { Button } from "@/components/ui/button";
import { StatusIcon, StatusMessage } from "@/components/ui/status-message";
import type { Product, ProductVariant } from "@/lib/data/types";
import { useCartStore } from "@/lib/cart-store";
import { formatKes, getDiscountPercent } from "@/lib/store-format";
import {
  isNeutralColorOption,
  isNeutralSizeOption,
  sortColorLabels,
  sortSizeLabels,
} from "@/lib/variant-options";
import { getWhatsAppUrl, isWhatsAppConfigured } from "@/lib/whatsapp";

interface ProductPurchasePanelProps {
  product: Product;
  variants: ProductVariant[];
}

export function ProductPurchasePanel({
  product,
  variants,
}: ProductPurchasePanelProps) {
  const sizes = sortSizeLabels([
    ...new Set(variants.map((variant) => variant.size)),
  ]);
  const allColors = sortColorLabels([
    ...new Set(variants.map((variant) => variant.color)),
  ]);
  const showSizePicker = !isNeutralSizeOption(sizes);
  const showColorPicker = !isNeutralColorOption(allColors);
  const firstVariant = variants.find((variant) => variant.stock_quantity > 0) ?? variants[0];
  const [selectedSize, setSelectedSize] = useState(
    firstVariant?.size ?? sizes[0] ?? "",
  );
  const [selectedColor, setSelectedColor] = useState(
    firstVariant?.color ?? allColors[0] ?? "",
  );
  const [cartMessage, setCartMessage] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [addFeedback, setAddFeedback] = useState<"idle" | "adding" | "added">(
    "idle",
  );
  const addingLock = useRef(false);
  const addingTimer = useRef<number | null>(null);
  const feedbackTimer = useRef<number | null>(null);
  const addItem = useCartStore((state) => state.addItem);
  const cartItems = useCartStore((state) => state.items);
  const openCartDrawer = useCartStore((state) => state.openDrawer);
  const hasWhatsAppContact = isWhatsAppConfigured();

  const colors = variants
    .filter((variant) => variant.size === selectedSize)
    .sort((first, second) =>
      first.color.localeCompare(second.color, undefined, { sensitivity: "base" }),
    );
  const selectedVariant = variants.find(
    (variant) =>
      variant.size === selectedSize && variant.color === selectedColor,
  );
  const currentPrice =
    selectedVariant?.price_override_kes ?? product.base_price_kes;
  const discount = getDiscountPercent(
    currentPrice,
    product.compare_at_price_kes,
  );
  const isInStock = Boolean(selectedVariant && selectedVariant.stock_quantity > 0);
  const cartQuantity =
    cartItems.find((item) => item.variantId === selectedVariant?.id)?.quantity ??
    0;
  const cartLimitMessage =
    !selectedVariant || selectedVariant.stock_quantity < 1
      ? ""
      : cartQuantity >= selectedVariant.stock_quantity
        ? `You already have the maximum available (${selectedVariant.stock_quantity}) in your cart.`
        : quantity >= selectedVariant.stock_quantity
          ? `Maximum quantity for this size and color reached (${selectedVariant.stock_quantity}).`
          : "";

  useEffect(
    () => () => {
      if (addingTimer.current !== null) {
        window.clearTimeout(addingTimer.current);
      }
      if (feedbackTimer.current !== null) {
        window.clearTimeout(feedbackTimer.current);
      }
    },
    [],
  );

  function selectSize(size: string) {
    setSelectedSize(size);
    const variantsForSize = variants.filter((variant) => variant.size === size);
    const preferredVariant =
      variantsForSize.find((variant) => variant.stock_quantity > 0) ??
      variantsForSize[0];
    setSelectedColor(preferredVariant?.color ?? "");
    setQuantity(1);
    setCartMessage("");
  }

  function addSelectedVariant() {
    if (addingLock.current) {
      return;
    }

    if (!selectedVariant || selectedVariant.stock_quantity < 1) {
      return;
    }

    const currentQuantity =
      useCartStore
        .getState()
        .items.find((item) => item.variantId === selectedVariant.id)?.quantity ??
      0;
    const availableQuantity = selectedVariant.stock_quantity - currentQuantity;
    if (availableQuantity < 1) {
      setCartMessage(
        `You already have the maximum available (${selectedVariant.stock_quantity}) in your cart.`,
      );
      return;
    }
    if (quantity > availableQuantity) {
      setCartMessage(`Only ${availableQuantity} more available for this variant.`);
      return;
    }

    const variant = selectedVariant;
    const quantityToAdd = quantity;
    addingLock.current = true;
    setCartMessage("");
    setAnnouncement("");
    setAddFeedback("adding");

    addingTimer.current = window.setTimeout(() => {
      addingTimer.current = null;
      const added = addItem(
        {
          color: variant.color,
          imageUrl: product.images[0]?.url ?? null,
          maxStock: variant.stock_quantity,
          productId: product.id,
          productName: product.name,
          productSlug: product.slug,
          size: variant.size,
          unitPriceKes: currentPrice,
          variantId: variant.id,
        },
        quantityToAdd,
      );

      if (!added) {
        const latestQuantity =
          useCartStore
            .getState()
            .items.find((item) => item.variantId === variant.id)?.quantity ??
          0;
        const latestAvailable = variant.stock_quantity - latestQuantity;
        setCartMessage(
          latestAvailable < 1
            ? `You already have the maximum available (${variant.stock_quantity}) in your cart.`
            : `Only ${latestAvailable} more available for this variant.`,
        );
        setAddFeedback("idle");
        addingLock.current = false;
        return;
      }

      setQuantity(1);
      setAnnouncement(
        quantityToAdd === 1
          ? `${product.name} added to your cart.`
          : `${quantityToAdd} ${product.name} added to your cart.`,
      );
      openCartDrawer(variant.id);
      setAddFeedback("added");
      feedbackTimer.current = window.setTimeout(() => {
        feedbackTimer.current = null;
        setAddFeedback("idle");
        addingLock.current = false;
      }, 1500);
    }, 100);
  }

  function askAboutProduct() {
    if (!selectedVariant) {
      return;
    }

    const message = [
      `Hello, I'm interested in ${product.name}.`,
      `Size: ${selectedVariant.size}`,
      `Color: ${selectedVariant.color}`,
      `Price: ${formatKes(currentPrice)}`,
      `Product: ${window.location.href}`,
    ].join("\n");
    const url = getWhatsAppUrl(message);
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-2xl font-semibold">{formatKes(currentPrice)}</p>
        {product.compare_at_price_kes &&
        product.compare_at_price_kes > currentPrice ? (
          <p className="text-base text-muted-foreground line-through">
            {formatKes(product.compare_at_price_kes)}
          </p>
        ) : null}
        {discount ? (
          <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
            {discount}% off
          </span>
        ) : null}
      </div>

      {variants.length > 0 ? (
        <div className="mt-6 grid gap-5">
          {showSizePicker ? (
          <fieldset>
            <legend className="text-sm font-semibold">
              Size <span className="font-normal text-muted-foreground">{selectedSize}</span>
            </legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {sizes.map((size) => {
                const sizeVariants = variants.filter((variant) => variant.size === size);
                const available = sizeVariants.some(
                  (variant) => variant.stock_quantity > 0,
                );
                const matchingVariant =
                  sizeVariants.find((variant) => variant.color === selectedColor) ??
                  sizeVariants.find((variant) => variant.stock_quantity > 0) ??
                  sizeVariants[0];

                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => selectSize(size)}
                    disabled={addFeedback !== "idle"}
                    aria-pressed={selectedSize === size}
                    aria-label={`${size}${available ? "" : ", out of stock"}`}
                    className={`inline-flex min-h-12 min-w-14 flex-col items-center justify-center rounded-lg border px-3 py-1 text-sm transition-colors ${
                      selectedSize === size
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border hover:bg-background"
                    }`}
                  >
                    {size}
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] leading-4 ${
                        selectedSize === size
                          ? "text-primary-foreground"
                          : matchingVariant?.stock_quantity
                            ? "text-success"
                            : "text-muted-foreground"
                      }`}
                    >
                      <StatusIcon
                        className="size-3"
                        tone={matchingVariant?.stock_quantity ? "success" : "muted"}
                      />
                      {matchingVariant?.stock_quantity
                        ? `${matchingVariant.stock_quantity} left`
                        : "Sold out"}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>
          ) : null}

          {showColorPicker ? (
          <fieldset>
            <legend className="text-sm font-semibold">
              Color <span className="font-normal text-muted-foreground">{selectedColor}</span>
            </legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {colors.map((variant) => (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => {
                    setSelectedColor(variant.color);
                    setQuantity(1);
                    setCartMessage("");
                  }}
                  disabled={addFeedback !== "idle"}
                  aria-pressed={selectedColor === variant.color}
                  aria-label={`${variant.color}, ${
                    variant.stock_quantity > 0
                      ? `${variant.stock_quantity} in stock`
                      : "out of stock"
                  }`}
                  className={`min-h-11 rounded-lg border px-3 text-sm transition-colors ${
                    selectedColor === variant.color
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:bg-background"
                  }`}
                >
                  <span className="block">{variant.color}</span>
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] leading-4 ${
                      selectedColor === variant.color
                        ? "text-primary-foreground"
                        : variant.stock_quantity > 0
                          ? "text-success"
                          : "text-muted-foreground"
                    }`}
                  >
                    <StatusIcon
                      className="size-3"
                      tone={variant.stock_quantity > 0 ? "success" : "muted"}
                    />
                    {variant.stock_quantity > 0
                      ? `${variant.stock_quantity} in stock`
                      : "Sold out"}
                  </span>
                </button>
              ))}
            </div>
          </fieldset>
          ) : null}

          <StatusMessage tone={isInStock ? "success" : "danger"} className="font-medium">
            {!selectedVariant
              ? "This size and color combination is unavailable."
              : selectedVariant.stock_quantity > 0
                ? `${selectedVariant.stock_quantity} in stock`
                : "Out of stock for this size and color."}
          </StatusMessage>
        </div>
      ) : null}

      <div className="mt-6 grid gap-3">
        {variants.length > 0 ? (
          <div className="flex items-center justify-between gap-4">
            <label
              htmlFor="purchase-quantity"
              className="text-sm font-semibold"
            >
              Quantity
            </label>
            <div
              className="inline-flex min-h-11 items-center rounded-lg border border-strong"
              role="group"
              aria-label={`Quantity for ${product.name}`}
            >
              <button
                type="button"
                onClick={() => {
                  setQuantity((current) => Math.max(1, current - 1));
                  setCartMessage("");
                }}
                aria-label={`Decrease quantity for ${product.name}`}
                disabled={!isInStock || quantity <= 1 || addFeedback !== "idle"}
                className="grid size-11 place-items-center rounded-l-lg text-lg hover:bg-background disabled:cursor-not-allowed disabled:text-muted-foreground disabled:opacity-80"
              >
                −
              </button>
              <input
                id="purchase-quantity"
                type="number"
                min={1}
                max={Math.max(selectedVariant?.stock_quantity ?? 1, 1)}
                value={quantity}
                onChange={(event) => {
                  const nextQuantity = Number(event.currentTarget.value);
                  const maximum = selectedVariant?.stock_quantity ?? 1;
                  if (
                    Number.isInteger(nextQuantity) &&
                    nextQuantity >= 1 &&
                    nextQuantity <= maximum
                  ) {
                    setQuantity(nextQuantity);
                    setCartMessage("");
                  }
                }}
                onBlur={() => {
                  if (quantity < 1) {
                    setQuantity(1);
                  }
                }}
                aria-label={`Quantity to add for ${product.name}`}
                disabled={!isInStock || addFeedback !== "idle"}
                className="h-11 w-14 border-x border-strong bg-transparent text-center text-sm tabular-nums outline-none disabled:text-muted-foreground disabled:opacity-80"
              />
              <button
                type="button"
                onClick={() => {
                  setQuantity((current) =>
                    Math.min(
                      selectedVariant?.stock_quantity ?? current,
                      current + 1,
                    ),
                  );
                  setCartMessage("");
                }}
                aria-label={`Increase quantity for ${product.name}`}
                disabled={
                  !isInStock ||
                  quantity >= (selectedVariant?.stock_quantity ?? 0) ||
                  addFeedback !== "idle"
                }
                className="grid size-11 place-items-center rounded-r-lg text-lg hover:bg-background disabled:cursor-not-allowed disabled:text-muted-foreground disabled:opacity-80"
              >
                +
              </button>
            </div>
          </div>
        ) : null}
        <Button
          size="lg"
          variant={addFeedback === "added" ? "gold" : "primary"}
          disabled={!isInStock}
          aria-disabled={!isInStock || addFeedback !== "idle"}
          aria-busy={addFeedback === "adding"}
          onClick={addSelectedVariant}
          className={`w-full ${
            addFeedback !== "idle" ? "cursor-not-allowed opacity-75" : ""
          }`}
        >
          {addFeedback === "adding" ? (
            "Adding..."
          ) : addFeedback === "added" ? (
            <>
              Added
              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                fill="none"
                className="ml-2 size-5"
              >
                <path
                  d="m4 10 4 4 8-8"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
              </svg>
            </>
          ) : isInStock ? (
            "Add to cart"
          ) : (
            <>
              <StatusIcon tone="muted" />
              Out of stock
            </>
          )}
        </Button>
        {cartQuantity > 0 ? (
          <p className="text-center text-sm text-muted-foreground">
            In your cart: {cartQuantity} ·{" "}
            <Link href="/cart" className="font-semibold text-primary hover:underline">
              View cart
            </Link>
          </p>
        ) : null}
        {cartMessage || cartLimitMessage ? (
          <StatusMessage tone="warning" className="justify-center text-center font-medium">
            {cartMessage || cartLimitMessage}
          </StatusMessage>
        ) : null}
        {hasWhatsAppContact ? (
          <Button
            variant="outline"
            size="lg"
            onClick={askAboutProduct}
            className="w-full"
          >
            <WhatsAppIcon className="mr-2 size-5" />
            Ask about this product on WhatsApp
          </Button>
        ) : null}
        <p role="status" aria-live="polite" className="sr-only">
          {announcement}
        </p>
      </div>
    </div>
  );
}
