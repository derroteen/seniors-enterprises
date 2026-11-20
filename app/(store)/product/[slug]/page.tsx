import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ProductGallery } from "@/components/store/product-gallery";
import { ProductPurchasePanel } from "@/components/store/product-purchase-panel";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { getProductBySlug } from "@/lib/store-data";
import { createStoreSupabaseClient } from "@/lib/supabase/server";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const client = createStoreSupabaseClient();
  if (!client) {
    return { title: "Product" };
  }

  const product = await getProductBySlug(client, slug);
  return {
    title: product?.name ?? "Product",
    description:
      product?.description ??
      "Explore thoughtfully selected everyday essentials from Senior Enterprises.",
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const client = createStoreSupabaseClient();

  if (!client) {
    return (
      <main>
        <Section>
          <Container>
            <h1 className="font-display text-4xl font-semibold">Product details</h1>
            <p className="mt-3 text-muted-foreground">
              Product details will appear when the catalog is connected.
            </p>
          </Container>
        </Section>
      </main>
    );
  }

  const product = await getProductBySlug(client, slug);
  if (!product) {
    notFound();
  }

  return (
    <main>
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
