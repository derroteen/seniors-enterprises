"use client";

import { useEffect } from "react";

import { CatalogUnavailable } from "@/components/store/catalog-unavailable";

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
    <CatalogUnavailable
      errorMessage={
        process.env.NODE_ENV === "development" ? error.message : undefined
      }
      onRetry={reset}
    />
  );
}
