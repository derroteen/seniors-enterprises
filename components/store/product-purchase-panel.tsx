"use client";

import { useState } from "react";

import { WhatsAppIcon } from "@/components/store/icons";
import { Button } from "@/components/ui/button";
import type { Product, ProductVariant } from "@/lib/data/types";
import { useCartStore } from "@/lib/cart-store";
import { formatKes, getDiscountPercent } from "@/lib/store-format";

interface ProductPurchasePanelProps {
  product: Product;
  variants: ProductVariant[];
}

export function ProductPurchasePanel({
  product,
  variants,
}: ProductPurchasePanelProps) {
  const firstVariant = variants.find((variant) => variant.stock_quantity > 0) ?? variants[0];
  const [selectedSize, setSelectedSize] = useState(firstVariant?.size ?? "");
  const [selectedColor, setSelectedColor] = useState(firstVariant?.color ?? "");
  const [cartMessage, setCartMessage] = useState("");
  const addItem = useCartStore((state) => state.addItem);

  const sizes = [...new Set(variants.map((variant) => variant.size))];
  const colors = variants.filter((variant) => variant.size === selectedSize);
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

  function selectSize(size: string) {
    setSelectedSize(size);
    const variantsForSize = variants.filter((variant) => variant.size === size);
    const preferredVariant =
      variantsForSize.find((variant) => variant.stock_quantity > 0) ??
      variantsForSize[0];
    setSelectedColor(preferredVariant?.color ?? "");
    setCartMessage("");
  }

  function addSelectedVariant() {
    if (!selectedVariant || selectedVariant.stock_quantity < 1) {
      return;
    }

    const added = addItem({
      color: selectedVariant.color,
      imageUrl: product.images[0]?.url ?? null,
      maxStock: selectedVariant.stock_quantity,
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      size: selectedVariant.size,
      unitPriceKes: currentPrice,
      variantId: selectedVariant.id,
    });
    setCartMessage(
      added
        ? `${product.name} added to your cart.`
        : `Only ${selectedVariant.stock_quantity} available for this variant.`,
    );
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
                    aria-pressed={selectedSize === size}
                    aria-label={`${size}${available ? "" : ", out of stock"}`}
                    className={`inline-flex min-h-12 min-w-14 flex-col items-center justify-center rounded-lg border px-3 py-1 text-sm transition-colors ${
                      selectedSize === size
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border hover:bg-background"
                    }`}
                  >
                    {size}
                    <span className="text-[10px] leading-4">
                      {matchingVariant?.stock_quantity
                        ? `${matchingVariant.stock_quantity} left`
                        : "Sold out"}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>

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
                    setCartMessage("");
                  }}
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
                  <span className="block text-[10px] leading-4">
                    {variant.stock_quantity > 0
                      ? `${variant.stock_quantity} in stock`
                      : "Sold out"}
                  </span>
                </button>
              ))}
            </div>
          </fieldset>

          <p
            role="status"
            className={`text-sm font-medium ${
              isInStock ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"
            }`}
          >
            {!selectedVariant
              ? "This size and color combination is unavailable."
              : selectedVariant.stock_quantity > 0
                ? `${selectedVariant.stock_quantity} in stock`
                : "Out of stock for this size and color."}
          </p>
        </div>
      ) : (
        <p className="mt-5 text-sm text-muted-foreground">
          Variant and stock information is not available yet.
        </p>
      )}

      <div className="mt-6 grid gap-3">
        <Button
          size="lg"
          disabled={!isInStock}
          onClick={addSelectedVariant}
          className="w-full"
        >
          {isInStock ? "Add to cart" : "Out of stock"}
        </Button>
        <Button
          variant="outline"
          size="lg"
          disabled
          title="WhatsApp contact will be configured later"
          className="w-full"
        >
          <WhatsAppIcon className="mr-2 size-5" />
          Ask about this product on WhatsApp
        </Button>
        <p role="status" aria-live="polite" className="min-h-5 text-center text-sm text-primary">
          {cartMessage}
        </p>
      </div>
    </div>
  );
}
