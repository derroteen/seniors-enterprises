"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";

import { SearchIcon } from "@/components/store/icons";
import { formatKes } from "@/lib/store-format";
import type { SearchProduct } from "@/lib/data/types";

type SearchState = "idle" | "loading" | "ready" | "unavailable";

interface HeaderSearchProps {
  className?: string;
}

export function HeaderSearch({ className = "" }: HeaderSearchProps) {
  const router = useRouter();
  const inputId = useId();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SearchProduct[]>([]);
  const [searchState, setSearchState] = useState<SearchState>("idle");
  const [searchMessage, setSearchMessage] = useState("");

  useEffect(() => {
    const trimmedQuery = query.trim();
    if (trimmedQuery.length < 2) {
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSearchState("loading");

      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(trimmedQuery)}`,
          { signal: controller.signal },
        );
        const payload = (await response.json()) as {
          message?: string;
          suggestions?: SearchProduct[];
        };
        if (!response.ok) {
          throw new Error(payload.message ?? "Search is temporarily unavailable.");
        }

        setSuggestions(payload.suggestions ?? []);
        setSearchMessage("");
        setSearchState("ready");
      } catch (error) {
        if (!controller.signal.aborted) {
          setSuggestions([]);
          setSearchMessage(
            error instanceof Error
              ? error.message
              : "Search is temporarily unavailable.",
          );
          setSearchState("unavailable");
        }
      }
    }, 180);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedQuery = query.trim();
    if (trimmedQuery) {
      router.push(`/shop?q=${encodeURIComponent(trimmedQuery)}`);
      setSuggestions([]);
    } else {
      router.push("/shop");
    }
  }

  const showSuggestions =
    query.trim().length >= 2 &&
    (searchState === "loading" ||
      searchState === "ready" ||
      searchState === "unavailable" ||
      suggestions.length > 0);

  return (
    <div className={`relative ${className}`}>
      <form
        role="search"
        onSubmit={submitSearch}
        className="flex min-h-11 items-center gap-2 rounded-xl border border-border bg-surface px-3"
      >
        <SearchIcon className="size-5 shrink-0 text-muted-foreground" />
        <label className="sr-only" htmlFor={inputId}>
          Search products
        </label>
        <input
          id={inputId}
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setSuggestions([]);
            setSearchMessage("");
            setSearchState("idle");
          }}
          placeholder="Search products"
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
        <button
          type="submit"
          aria-label="Submit product search"
          className="grid size-8 shrink-0 place-items-center rounded-lg text-primary transition-colors hover:bg-primary/10"
        >
          <SearchIcon className="size-4" />
        </button>
      </form>

      {showSuggestions ? (
        <div
          className="absolute inset-x-0 top-full z-40 mt-2 overflow-hidden rounded-xl border border-border bg-surface shadow-xl"
          role="status"
          aria-live="polite"
        >
          {searchState === "loading" ? (
            <p className="px-4 py-3 text-sm text-muted-foreground">
              Searching…
            </p>
          ) : null}
          {searchState === "unavailable" ? (
            <p className="px-4 py-3 text-sm text-muted-foreground">
              {searchMessage}
            </p>
          ) : null}
          {searchState === "ready" && suggestions.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted-foreground">
              No matching products.
            </p>
          ) : null}
          {searchState === "ready" && suggestions.length > 0 ? (
            <ul aria-label="Search suggestions">
              {suggestions.map((suggestion) => (
                <li key={suggestion.id}>
                  <Link
                    href={`/product/${suggestion.slug}`}
                    onClick={() => setSuggestions([])}
                    className="flex min-h-16 items-center gap-3 px-3 py-2 transition-colors hover:bg-background focus-visible:bg-background"
                  >
                    {suggestion.imageUrl ? (
                      <span className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-background">
                        <Image
                          src={suggestion.imageUrl}
                          alt=""
                          fill
                          sizes="48px"
                          unoptimized
                        />
                      </span>
                    ) : null}
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">
                      {suggestion.name}
                    </span>
                    <span className="shrink-0 text-sm text-muted-foreground">
                      {formatKes(suggestion.base_price_kes)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
