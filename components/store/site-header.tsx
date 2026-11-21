"use client";

import Link from "next/link";
import { useCallback, useState } from "react";

import { CartIcon, CloseIcon, MenuIcon } from "@/components/store/icons";
import { CartDrawer } from "@/components/store/cart-drawer";
import { HeaderSearch } from "@/components/store/header-search";
import { Logo } from "@/components/store/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { BRAND } from "@/lib/brand";
import { getCartItemCount, useCartStore } from "@/lib/cart-store";
import type { Category } from "@/lib/data/types";
import { Container } from "@/components/ui/container";

interface SiteHeaderProps {
  categories: Category[];
}

export function SiteHeader({ categories }: SiteHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const items = useCartStore((state) => state.items);
  const itemCount = getCartItemCount(items);
  const closeCart = useCallback(() => setCartOpen(false), []);

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
            aria-label={`${BRAND.name} home`}
            className="block rounded-sm"
          >
            <Logo variant="full" priority />
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
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              aria-label={`Open cart, ${itemCount} ${itemCount === 1 ? "item" : "items"}`}
              aria-expanded={cartOpen}
              aria-controls="cart-drawer-panel"
              className="relative grid size-11 place-items-center rounded-lg border border-border bg-surface text-foreground hover:bg-background"
            >
              <CartIcon className="size-5" />
              <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-accent px-1 text-[11px] font-semibold leading-5 text-accent-foreground">
                {itemCount}
              </span>
            </button>
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
      <CartDrawer open={cartOpen} onClose={closeCart} />
    </header>
  );
}
