"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export default function StoreError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Store page failed to load.", error);
  }, [error]);

  return (
    <main className="py-20">
      <Container>
        <div className="mx-auto max-w-xl rounded-2xl border border-border bg-surface p-8 text-center">
          <h1 className="font-display text-3xl font-semibold">
            We couldn’t load the store
          </h1>
          <p className="mt-3 text-muted-foreground">
            Please try again. If the problem continues, return to the shop later.
          </p>
          <Button onClick={reset} className="mt-6">
            Try again
          </Button>
        </div>
      </Container>
    </main>
  );
}
