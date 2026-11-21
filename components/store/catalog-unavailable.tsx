"use client";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { getWhatsAppUrl } from "@/lib/whatsapp";

interface CatalogUnavailableProps {
  errorMessage?: string;
  onRetry?: () => void;
}

const productionMessage =
  "Our catalog is temporarily unavailable. Please try again shortly or message us on WhatsApp.";

export function CatalogUnavailable({
  errorMessage,
  onRetry,
}: CatalogUnavailableProps) {
  const isDevelopment = process.env.NODE_ENV === "development";
  const whatsappUrl = getWhatsAppUrl(
    "Hello, I am having trouble accessing the catalog. Please help.",
  );

  return (
    <main className="py-16 sm:py-20">
      <Container>
        <section
          aria-labelledby="catalog-unavailable-heading"
          className="mx-auto max-w-xl rounded-2xl border border-border bg-surface p-6 text-center sm:p-8"
        >
          <h1
            id="catalog-unavailable-heading"
            className="font-display text-3xl font-semibold"
          >
            {isDevelopment ? "Catalog request failed" : "Our catalog is temporarily unavailable"}
          </h1>
          <p className="mt-3 text-muted-foreground">
            {isDevelopment
              ? "The catalog could not be loaded. See the error details below."
              : productionMessage}
          </p>
          {isDevelopment && errorMessage ? (
            <pre className="mt-4 overflow-x-auto whitespace-pre-wrap break-words rounded-lg bg-background p-3 text-left text-xs">
              {errorMessage}
            </pre>
          ) : null}
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button onClick={onRetry ?? (() => window.location.reload())}>
              Try again
            </Button>
            {whatsappUrl ? (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center rounded-lg border border-border px-4 text-sm font-medium hover:bg-background"
              >
                Message us on WhatsApp
              </a>
            ) : null}
          </div>
        </section>
      </Container>
    </main>
  );
}
