import Link from "next/link";

import { Logo } from "@/components/store/logo";
import { BRAND } from "@/lib/brand";
import type { Category } from "@/lib/data/types";
import { getWhatsAppUrl } from "@/lib/whatsapp";
import { Container } from "@/components/ui/container";

interface SiteFooterProps {
  categories: Category[];
}

export function SiteFooter({ categories }: SiteFooterProps) {
  const whatsappUrl = getWhatsAppUrl(
    `Hello, I have a question about ${BRAND.name}.`,
  );

  return (
    <footer className="border-t border-border bg-surface">
      <Container>
        <div className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-3">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" aria-label={`${BRAND.name} home`}>
              <Logo variant="full" className="h-10 w-32" />
            </Link>
          </div>

          <div>
            <h2 className="text-sm font-semibold">Explore</h2>
            <ul className="mt-4 grid gap-3 text-sm text-muted-foreground">
              <li>
                <Link href="/shop" className="hover:text-primary">
                  Shop all
                </Link>
              </li>
              <li>
                <Link href="/track-order" className="hover:text-primary">
                  Track an order
                </Link>
              </li>
              {categories.map((category) => (
                <li key={category.id}>
                  <Link
                    href={`/shop/${category.slug}`}
                    className="hover:text-primary"
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-sm font-semibold">Customer care</h2>
            <ul className="mt-4 grid gap-3 text-sm text-muted-foreground">
              <li><Link href="/privacy" className="hover:text-primary">Privacy</Link></li>
              <li><Link href="/terms" className="hover:text-primary">Terms</Link></li>
              <li><Link href="/returns" className="hover:text-primary">Returns</Link></li>
              <li><Link href="/delivery" className="hover:text-primary">Delivery</Link></li>
              {whatsappUrl ? (
                <li>
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary"
                  >
                    WhatsApp
                  </a>
                </li>
              ) : null}
            </ul>
          </div>
        </div>

        <div className="border-t border-border py-5 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} {BRAND.name}</p>
        </div>
      </Container>
    </footer>
  );
}
