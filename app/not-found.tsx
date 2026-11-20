import Link from "next/link";

import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";

export default function NotFound() {
  return (
    <main>
      <Section>
        <Container>
          <div className="mx-auto max-w-xl rounded-2xl border border-border bg-surface p-8 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary">
              404 · Page not found
            </p>
            <h1 className="mt-3 font-display text-3xl font-semibold">
              This page isn’t in our collection.
            </h1>
            <p className="mt-3 text-muted-foreground">
              The link may be out of date, or the page may have moved.
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              Return home
            </Link>
          </div>
        </Container>
      </Section>
    </main>
  );
}
