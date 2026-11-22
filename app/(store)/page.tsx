import type { Metadata } from "next";
import Link from "next/link";

import { CategoryGrid } from "@/components/store/category-grid";
import { ProductGrid } from "@/components/store/product-grid";
import { TrustStrip } from "@/components/store/trust-strip";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { BRAND } from "@/lib/brand";
import { dataRepository } from "@/lib/data";

export const metadata: Metadata = {
  title: "Considered everyday essentials",
  description: `Shop thoughtful everyday essentials from ${BRAND.name}.`,
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
          <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
                {BRAND.name}
              </p>
              <h1 className="mt-4 font-display text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">
                Everyday essentials,{" "}
                <span className="text-primary">chosen with care.</span>
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
                Discover thoughtful pieces for the way you live, work, and move.
                Quality you can count on, delivered with care.
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
                Secure payments · Delivery across Kenya
              </p>
            </div>

            <div className="relative mx-auto aspect-[1.08/1] w-full max-w-xl overflow-hidden rounded-[2rem] bg-primary-dark p-7 text-primary-dark-foreground sm:p-10">
              <div
                aria-hidden="true"
                className="absolute -right-20 -top-20 size-72 rounded-full border border-accent/50 sm:size-96"
              />
              <div
                aria-hidden="true"
                className="absolute -right-8 -top-8 size-52 rounded-full border border-white/15 sm:size-72"
              />
              <div className="relative flex h-full flex-col justify-between">
                <p className="max-w-xs text-sm uppercase tracking-[0.18em] text-white/70">
                  Made for your every day
                </p>
                <div>
                  <span className="mb-4 block h-1 w-14 rounded-full bg-accent" />
                  <p className="font-display text-4xl font-semibold leading-tight sm:text-5xl">
                    A little more
                    <br />
                    considered.
                  </p>
                  <p className="mt-4 max-w-xs text-sm leading-6 text-white/75">
                    Find your next favorite in a growing collection of quality
                    essentials.
                  </p>
                </div>
                <Link
                  href="/shop"
                  className="inline-flex min-h-11 w-fit items-center gap-3 rounded-full border border-white/30 px-5 text-sm font-medium hover:bg-white/10"
                >
                  Explore the collection
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
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
              <p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary">
                Handpicked for you
              </p>
              <h2 className="mt-2 font-display text-3xl font-semibold">
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

      <Section id="why-seniors" surface className="border-y">
        <Container>
          <div className="mb-8 max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary">
              Shop with confidence
            </p>
            <h2 className="mt-2 font-display text-3xl font-semibold">
              Why {BRAND.name}
            </h2>
          </div>
          <TrustStrip />
        </Container>
      </Section>
    </main>
  );
}
