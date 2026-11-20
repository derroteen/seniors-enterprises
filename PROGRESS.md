# Overnight Frontend Progress

## Setup

- Confirmed current branch is `overnight/frontend`; worktree was clean.
- Created `AGENT_TASKS.md` with the requested ordered checklist.
- No application files or environment/database settings have been changed yet.

## Assumptions

- Social metadata uses `NEXT_PUBLIC_SITE_URL`, then Vercel's `VERCEL_URL`, and
  falls back to localhost during local development; no deployment domain was
  supplied.

## T1 — Rename + brand config

- Replaced existing brand-name content references with the canonical `BRAND.name`
  and changed the package identifier to `seniors-enterprises`.
- Added `lib/brand.ts`, `.env.example`, and a full content-match before/after
  report in `docs/rename-report.md`.
- Updated header/footer logo paths to the already-present official light/dark
  full-logo PNG assets; T2 will add the shared `Logo` component.
- Files changed: `.env.example`, `AGENT_TASKS.md`, `PROGRESS.md`,
  `docs/rename-report.md`, `lib/brand.ts`, `package.json`, `package-lock.json`,
  `app/layout.tsx`, `app/styleguide/page.tsx`, `app/(store)/page.tsx`,
  `app/(store)/shop/page.tsx`, `app/(store)/shop/[category]/page.tsx`,
  `app/(store)/product/[slug]/page.tsx`, `components/store/site-header.tsx`,
  `components/store/site-footer.tsx`.
- To test: run `npx tsc --noEmit`, `npm run lint`, `npm run build`, and verify
  rendered metadata and footer display “Seniors Enterprises”.

## T2 — Logo + icons

- Added the theme-aware `Logo` component using the supplied light/dark full and
  mark PNGs; used it in the navbar (priority) and footer.
- Added the PWA manifest and Open Graph/Twitter metadata using `/og-image.png`.
- Resolved social image URLs using `NEXT_PUBLIC_SITE_URL`, `VERCEL_URL`, or a
  localhost development fallback without assuming a live domain.
- The public inventory contained the supplied PNG logos/icons only; no extra
  generated logo or icon files were present to delete.
- Files changed: `components/store/logo.tsx`, `components/store/site-header.tsx`,
  `components/store/site-footer.tsx`, `app/manifest.ts`, `app/layout.tsx`,
  `AGENT_TASKS.md`, `PROGRESS.md`.
- To test: run all three required checks and inspect the manifest, logo in both
  themes, and Open Graph/Twitter metadata.

## T3 — Data layer with mock data

- Added the shared database-shaped model and repository interface, mock and
  unimplemented Supabase adapters, and the `NEXT_PUBLIC_DATA_SOURCE` switch
  (defaults to `mock`). Added the setting to `.env.example`.
- Removed direct Supabase queries from storefront routes and search; removed
  the old query helper and generated-client type files.
- Added exactly 24 unique mock products (12 shoes, 12 clothing), size/color
  variants including out-of-stock combinations, and local SVG placeholders.
- Files changed: `.env.example`, `AGENT_TASKS.md`, `PROGRESS.md`,
  `app/(store)/layout.tsx`, `app/(store)/page.tsx`,
  `app/(store)/shop/page.tsx`, `app/(store)/shop/[category]/page.tsx`,
  `app/(store)/product/[slug]/page.tsx`, `app/api/search/route.ts`,
  `components/store/category-grid.tsx`, `components/store/header-search.tsx`,
  `components/store/product-card.tsx`, `components/store/product-gallery.tsx`,
  `components/store/product-grid.tsx`,
  `components/store/product-purchase-panel.tsx`,
  `components/store/shop-filters.tsx`, `components/store/site-footer.tsx`,
  `components/store/site-header.tsx`, `lib/data/index.ts`,
  `lib/data/types.ts`, `lib/data/repository.ts`,
  `lib/data/mock/products.ts`, `lib/data/mock/repository.ts`,
  `lib/data/supabase/repository.ts`, eleven SVGs in `public/placeholders/`;
  deleted obsolete `lib/store-data.ts`, `lib/supabase/server.ts`, and
  `types/database.ts`.
- To test: set `NEXT_PUBLIC_DATA_SOURCE=mock` or leave it unset, then open
  `/shop`, `/shop/shoes`, `/shop/clothing`, a product slug, and search for
  “loafer”. Verified those routes return 200 and mock product/search data
  renders without Supabase credentials.

## T4 — Cart

- Replaced the ephemeral cart context with a Zustand store persisted to
  localStorage. Storage reads/writes are guarded and hydration is deferred until
  after the client mounts.
- Added stock-limited add/change/remove operations, subtotal and count
  selectors, a keyboard-dismissible cart drawer, and `/cart`.
- Files changed: `package.json`, `package-lock.json`,
  `lib/cart-store.ts`, `components/store/cart-provider.tsx`,
  `components/store/cart-contents.tsx`, `components/store/cart-drawer.tsx`,
  `components/store/cart-page.tsx`, `components/store/site-header.tsx`,
  `components/store/product-purchase-panel.tsx`,
  `app/(store)/cart/page.tsx`, `AGENT_TASKS.md`, `PROGRESS.md`.
- To test: add a mock product variant to cart, open the drawer and `/cart`,
  reload to verify persistence, adjust quantities up to stock, remove a line,
  and verify subtotal/count updates.
- Browser verification: added the mock sneaker, opened the drawer, confirmed
  the variant/subtotal, and confirmed the serialized cart is stored in
  localStorage. The required type, lint, and production build checks passed.
