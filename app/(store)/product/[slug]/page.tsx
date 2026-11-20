import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ProductGallery } from "@/components/store/product-gallery";
import { ProductPurchasePanel } from "@/components/store/product-purchase-panel";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { dataRepository } from "@/lib/data";
import { BRAND } from "@/lib/brand";
import { getSiteUrl } from "@/lib/site-url";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await dataRepository.getProductBySlug(slug);
  return {
    title: product?.name ?? "Product",
    description:
      product?.description ??
      `Explore thoughtfully selected everyday essentials from ${BRAND.name}.`,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await dataRepository.getProductBySlug(slug);
  if (!product) {
    notFound();
  }

  const availableVariants = product.variants.filter(
    (variant) => variant.stock_quantity > 0,
  );
  const availablePrices = availableVariants.map(
    (variant) => variant.price_override_kes ?? product.base_price_kes,
  );
  const productUrl = new URL(`/product/${product.slug}`, getSiteUrl()).toString();
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description ?? undefined,
    image: product.images.map((image) =>
      new URL(image.url, getSiteUrl()).toString(),
    ),
    sku: product.variants[0]?.sku,
    brand: {
      "@type": "Brand",
      name: BRAND.name,
    },
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: BRAND.currency,
      lowPrice: availablePrices.length
        ? Math.min(...availablePrices)
        : product.base_price_kes,
      highPrice: availablePrices.length
        ? Math.max(...availablePrices)
        : product.base_price_kes,
      offerCount: availableVariants.length,
      availability: availableVariants.length
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url: productUrl,
    },
  };
  const serializedProductJsonLd = JSON.stringify(productJsonLd).replace(
    /</g,
    "\\u003c",
  );

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializedProductJsonLd }}
      />
      <Section className="py-8 sm:py-12">
        <Container>
          <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted-foreground">
            <ol className="flex flex-wrap items-center gap-2">
              <li><Link href="/" className="hover:text-primary">Home</Link></li>
              <li aria-hidden="true">/</li>
              <li><Link href="/shop" className="hover:text-primary">Shop</Link></li>
              <li aria-hidden="true">/</li>
              <li aria-current="page" className="max-w-48 truncate text-foreground">
                {product.name}
              </li>
            </ol>
          </nav>

          <div className="grid items-start gap-8 md:grid-cols-2 md:gap-10 lg:gap-14">
            <ProductGallery images={product.images} productName={product.name} />

            <div>
              <div className="flex flex-wrap items-center gap-2">
                {product.is_featured ? (
                  <Badge variant="gold">Featured</Badge>
                ) : null}
                <Badge variant="outline">In the collection</Badge>
              </div>
              <h1 className="mt-4 font-display text-3xl font-semibold leading-tight sm:text-4xl">
                {product.name}
              </h1>
              {product.description ? (
                <p className="mt-4 whitespace-pre-line leading-7 text-muted-foreground">
                  {product.description}
                </p>
              ) : null}

              <div className="mt-7">
                <ProductPurchasePanel
                  product={product}
                  variants={product.variants}
                />
              </div>

              <p className="mt-4 text-xs leading-5 text-muted-foreground">
                Stock availability is shown for each size and color. Your selection
                is not reserved until checkout.
              </p>
            </div>
          </div>
        </Container>
      </Section>
    </main>
  );
}
