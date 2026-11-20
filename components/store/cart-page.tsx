"use client";

import Link from "next/link";

import { CartContents } from "@/components/store/cart-contents";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";

export function CartPage() {
  return (
    <main>
      <Section>
        <Container>
          <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-primary">Home</Link>
            <span aria-hidden="true" className="mx-2">/</span>
            <span aria-current="page" className="text-foreground">Cart</span>
          </nav>
          <div className="mx-auto max-w-3xl">
            <h1 className="mb-6 font-display text-3xl font-semibold">Your cart</h1>
            <div className="rounded-2xl border border-border bg-surface p-5 sm:p-7">
              <CartContents />
            </div>
          </div>
        </Container>
      </Section>
    </main>
  );
}
