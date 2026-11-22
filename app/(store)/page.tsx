import type { Metadata } from "next";
import Link from "next/link";

import { CategoryGrid } from "@/components/store/category-grid";
import { ProductGrid } from "@/components/store/product-grid";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { BRAND } from "@/lib/brand";
import { dataRepository } from "@/lib/data";

export const metadata: Metadata = {
  title: { absolute: `${BRAND.name}: shop online` },
  description: `Browse products from ${BRAND.name}.`,
};

export default async function HomePage() {
  const [categories, featuredProducts] = await Promise.all([
    dataRepository.getCategories(),
    dataRepository.getFeaturedProducts(4),
  ]);

  return (
    <main>
      <Section className="overflow-hidden pb-14 pt-10 sm:pb-20 sm:pt-16">
        <Container>
          <div className="grid gap-10">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
                {BRAND.name}
              </p>
              <h1 className="mt-4 font-display text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">
                Shop our collection
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
                Browse our current products and place your order.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/shop"
                  className="inline-flex min-h-12 items-center justify-center rounded-lg bg-primary px-6 text-base font-medium text-primary-foreground transition-opacity hover:opacity-90"
                >
                  Shop now
                </Link>
                <Link
                  href="#categories"
                  className="inline-flex min-h-12 items-center rounded-lg border border-border px-5 text-sm font-semibold transition-colors hover:bg-surface"
                >
                  Browse collections
                </Link>
              </div>
              <p className="mt-5 text-sm text-muted-foreground">
                Free delivery countrywide
              </p>
            </div>
          </div>
        </Container>
      </Section>

      <Section id="categories" surface className="border-y">
        <Container>
          <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary">
                Explore
              </p>
              <h2 className="mt-2 font-display text-3xl font-semibold">
                Shop by category
              </h2>
            </div>
            <Link
              href="/shop"
              className="text-sm font-semibold text-primary hover:underline"
            >
              View all
            </Link>
          </div>
          <CategoryGrid categories={categories} />
        </Container>
      </Section>

      <Section>
        <Container>
          <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl font-semibold">
                Featured products
              </h2>
            </div>
            <Link
              href="/shop"
              className="text-sm font-semibold text-primary hover:underline"
            >
              Shop all products
            </Link>
          </div>
          <ProductGrid products={featuredProducts} />
        </Container>
      </Section>
    </main>
  );
}
