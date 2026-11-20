"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { CartIcon, CloseIcon, MenuIcon } from "@/components/store/icons";
import { HeaderSearch } from "@/components/store/header-search";
import { useCart } from "@/components/store/cart-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import type { CategoryRow } from "@/lib/store-data";
import { Container } from "@/components/ui/container";

interface SiteHeaderProps {
  categories: CategoryRow[];
}

export function SiteHeader({ categories }: SiteHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { itemCount } = useCart();

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
      <Container>
        <div className="flex min-h-20 items-center gap-3">
          <button
            type="button"
            className="grid size-11 shrink-0 place-items-center rounded-lg text-foreground hover:bg-surface lg:hidden"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-store-menu"
            onClick={() => setMobileMenuOpen((isOpen) => !isOpen)}
          >
            {mobileMenuOpen ? (
              <CloseIcon className="size-6" />
            ) : (
              <MenuIcon className="size-6" />
            )}
          </button>

          <Link
            href="/"
            aria-label="Senior Enterprises home"
            className="relative block h-11 w-36 shrink-0 sm:w-40"
          >
            <Image
              src="/brand/senior-enterprises-b.svg"
              alt="Senior Enterprises"
              fill
              sizes="160px"
              priority
              unoptimized
              className="object-contain object-left dark:hidden"
            />
            <Image
              src="/brand/senior-enterprises-b-dark.svg"
              alt="Senior Enterprises"
              fill
              sizes="160px"
              priority
              unoptimized
              className="hidden object-contain object-left dark:block"
            />
          </Link>

          <nav
            aria-label="Main navigation"
            className="hidden items-center gap-5 lg:flex"
          >
            <Link href="/shop" className="text-sm font-medium hover:text-primary">
              Shop
            </Link>
            {categories.slice(0, 3).map((category) => (
              <Link
                key={category.id}
                href={`/shop/${category.slug}`}
                className="text-sm font-medium text-muted-foreground hover:text-primary"
              >
                {category.name}
              </Link>
            ))}
          </nav>

          <HeaderSearch className="ml-auto hidden w-full max-w-sm lg:block" />

          <div className="ml-auto flex shrink-0 items-center gap-2 lg:ml-0">
            <ThemeToggle />
            <span
              aria-label={`Cart has ${itemCount} ${itemCount === 1 ? "item" : "items"}; cart page coming soon`}
              title="Cart page coming soon"
              className="relative grid size-11 place-items-center rounded-lg border border-border bg-surface text-foreground"
            >
              <CartIcon className="size-5" />
              <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-accent px-1 text-[11px] font-semibold leading-5 text-accent-foreground">
                {itemCount}
              </span>
            </span>
          </div>
        </div>

        <HeaderSearch className="pb-3 lg:hidden" />

        {mobileMenuOpen ? (
          <nav
            id="mobile-store-menu"
            aria-label="Mobile navigation"
            className="grid gap-1 border-t border-border py-3 lg:hidden"
          >
            <Link
              href="/shop"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg px-3 py-3 font-medium hover:bg-surface"
            >
              Shop all
            </Link>
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/shop/${category.slug}`}
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-3 py-3 text-muted-foreground hover:bg-surface hover:text-foreground"
              >
                {category.name}
              </Link>
            ))}
          </nav>
        ) : null}
      </Container>
    </header>
  );
}
