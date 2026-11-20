import Link from "next/link";

type SearchParams = Record<string, string | string[] | undefined>;

interface PaginationProps {
  currentPage: number;
  pageCount: number;
  pathname: string;
  searchParams: SearchParams;
}

function pageHref(
  pathname: string,
  searchParams: SearchParams,
  page: number,
) {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (key === "page" || value === undefined) {
      continue;
    }

    for (const entry of Array.isArray(value) ? value : [value]) {
      query.append(key, entry);
    }
  }

  if (page > 1) {
    query.set("page", String(page));
  }

  const queryString = query.toString();
  return queryString ? `${pathname}?${queryString}` : pathname;
}

export function Pagination({
  currentPage,
  pageCount,
  pathname,
  searchParams,
}: PaginationProps) {
  if (pageCount < 2) {
    return null;
  }

  return (
    <nav
      aria-label="Product pages"
      className="mt-8 flex items-center justify-between gap-4"
    >
      {currentPage > 1 ? (
        <Link
          href={pageHref(pathname, searchParams, currentPage - 1)}
          rel="prev"
          className="min-h-11 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium hover:bg-background"
        >
          Previous
        </Link>
      ) : (
        <span />
      )}
      <p className="text-sm text-muted-foreground">
        Page {currentPage} of {pageCount}
      </p>
      {currentPage < pageCount ? (
        <Link
          href={pageHref(pathname, searchParams, currentPage + 1)}
          rel="next"
          className="min-h-11 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium hover:bg-background"
        >
          Next
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
