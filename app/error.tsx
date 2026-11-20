"use client";

import Link from "next/link";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Page failed to load.", error);
  }, [error]);

  return (
    <main className="py-20">
      <Container>
        <div className="mx-auto max-w-xl rounded-2xl border border-border bg-surface p-8 text-center">
          <h1 className="font-display text-3xl font-semibold">
            Something went wrong
          </h1>
          <p className="mt-3 text-muted-foreground">
            Please try again. If the problem continues, return to the home page.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button onClick={reset}>Try again</Button>
            <Link
              href="/"
              className="inline-flex min-h-11 items-center rounded-lg border border-border px-4 text-sm font-medium hover:bg-background"
            >
              Home
            </Link>
          </div>
        </div>
      </Container>
    </main>
  );
}
