import Link from "next/link";

import {
  FacebookIcon,
  InstagramIcon,
  TikTokIcon,
} from "@/components/store/icons";
import { Logo } from "@/components/store/logo";
import { BRAND } from "@/lib/brand";
import type { CategoryRow } from "@/lib/store-data";
import { Container } from "@/components/ui/container";

interface SiteFooterProps {
  categories: CategoryRow[];
}

export function SiteFooter({ categories }: SiteFooterProps) {
  return (
    <footer className="border-t border-border bg-surface">
      <Container>
        <div className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" aria-label={`${BRAND.name} home`}>
              <Logo variant="full" className="h-10 w-32" />
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-6 text-muted-foreground">
              Thoughtful everyday essentials, selected with care.
            </p>
          </div>

          <div>
            <h2 className="text-sm font-semibold">Explore</h2>
            <ul className="mt-4 grid gap-3 text-sm text-muted-foreground">
              <li>
                <Link href="/shop" className="hover:text-primary">
                  Shop all
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
            <h2 className="text-sm font-semibold">About</h2>
            <ul className="mt-4 grid gap-3 text-sm text-muted-foreground">
              <li>
                <Link href="/#why-seniors" className="hover:text-primary">
                  Why {BRAND.name}
                </Link>
              </li>
              <li>
                <Link href="/#categories" className="hover:text-primary">
                  Our collections
                </Link>
              </li>
              <li>
                <Link href="/styleguide" className="hover:text-primary">
                  Design guide
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-sm font-semibold">Follow along</h2>
            <div className="mt-4 flex gap-3" aria-label="Social links">
              <span
                role="img"
                aria-label="Instagram profile coming soon"
                title="Instagram profile coming soon"
                className="grid size-10 place-items-center rounded-full border border-border text-muted-foreground"
              >
                <InstagramIcon className="size-5" />
              </span>
              <span
                role="img"
                aria-label="Facebook profile coming soon"
                title="Facebook profile coming soon"
                className="grid size-10 place-items-center rounded-full border border-border text-muted-foreground"
              >
                <FacebookIcon className="size-5" />
              </span>
              <span
                role="img"
                aria-label="TikTok profile coming soon"
                title="TikTok profile coming soon"
                className="grid size-10 place-items-center rounded-full border border-border text-muted-foreground"
              >
                <TikTokIcon className="size-5" />
              </span>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Social profiles will be linked soon.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-border py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {BRAND.name}</p>
          <p>Made for everyday living.</p>
        </div>
      </Container>
    </footer>
  );
}
