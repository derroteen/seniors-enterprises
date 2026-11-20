import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { formatKes, getDiscountPercent } from "@/lib/store-format";
import type { StoreProduct } from "@/lib/store-data";

interface ProductCardProps {
  product: StoreProduct;
}

export function ProductCard({ product }: ProductCardProps) {
  const image = product.images[0];
  const discount = getDiscountPercent(
    product.base_price_kes,
    product.compare_at_price_kes,
  );

  return (
    <article className="group min-w-0">
      <Link
        href={`/product/${product.slug}`}
        className="block overflow-hidden rounded-2xl border border-border bg-surface"
        aria-label={`View ${product.name}`}
      >
        <div className="relative aspect-[4/5] overflow-hidden bg-background">
          {image ? (
            <Image
              src={image.url}
              alt={image.alt_text || product.name}
              fill
              sizes="(max-width: 640px) 48vw, (max-width: 1024px) 30vw, 22vw"
              unoptimized
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div
              role="img"
              aria-label={`${product.name} image coming soon`}
              className="flex h-full flex-col items-center justify-center gap-2 text-center text-muted-foreground"
            >
              <span className="font-display text-5xl text-primary/40" aria-hidden="true">
                {product.name.charAt(0)}
              </span>
              <span className="text-xs">Image coming soon</span>
            </div>
          )}
          {discount ? (
            <Badge variant="gold" className="absolute left-3 top-3 shadow-sm">
              {discount}% off
            </Badge>
          ) : null}
        </div>
        <div className="p-3 sm:p-4">
          <h3 className="line-clamp-2 min-h-12 font-medium text-foreground">
            {product.name}
          </h3>
          <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="font-semibold">{formatKes(product.base_price_kes)}</span>
            {product.compare_at_price_kes &&
            product.compare_at_price_kes > product.base_price_kes ? (
              <span className="text-sm text-muted-foreground line-through">
                {formatKes(product.compare_at_price_kes)}
              </span>
            ) : null}
          </div>
        </div>
      </Link>
    </article>
  );
}
