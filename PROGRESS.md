# Overnight Frontend Progress

## Setup

- Confirmed current branch is `overnight/frontend`; worktree was clean.
- Created `AGENT_TASKS.md` with the requested ordered checklist.
- No application files or environment/database settings have been changed yet.

## Assumptions

- Social metadata uses `NEXT_PUBLIC_SITE_URL`, then Vercel's `VERCEL_URL`, and
  falls back to localhost during local development; no deployment domain was
  supplied.
- Demo delivery costs are KSh 350 within Nairobi County and KSh 650 elsewhere;
  both values are editable in `lib/config/delivery.ts`.
- Demo orders are stored in the browser's localStorage and can only be tracked
  in the same browser profile; this is temporary until the backend exists.
- Mock admin catalog edits are saved only in the current browser and are not
  synced to storefront server data; real catalog persistence belongs to the
  backend phase.

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

## T5 — Checkout (demo mode)

- Added Zod-validated Kenyan contact and delivery forms, the complete county
  list, and editable Nairobi/other-county delivery fees.
- Added the payment provider interface, delayed mock success/failure flow, and
  the unimplemented Paystack adapter. Demo checkout creates and updates orders
  through the mock repository only; successful demo orders clear the cart.
- Added `/checkout`, `/checkout/success`, `/checkout/failed`, and `/track-order`,
  including the required no-real-payment notice and order lookup. Added a
  tracking link to the footer.
- Added `zod` as a direct runtime dependency because checkout validation imports
  it; it was already installed in the project.
- Files changed: `AGENT_TASKS.md`, `PROGRESS.md`, `package.json`,
  `package-lock.json`, `components/store/site-footer.tsx`,
  `components/store/checkout-form.tsx`,
  `components/store/checkout-result.tsx`,
  `components/store/order-lookup.tsx`,
  `app/(store)/checkout/page.tsx`,
  `app/(store)/checkout/success/page.tsx`,
  `app/(store)/checkout/failed/page.tsx`,
  `app/(store)/track-order/page.tsx`, `lib/checkout/schema.ts`,
  `lib/config/delivery.ts`, `lib/payments/types.ts`, `lib/payments/mock.ts`,
  `lib/payments/paystack.ts`, `lib/data/types.ts`,
  `lib/data/repository.ts`, `lib/data/mock/repository.ts`, and
  `lib/data/supabase/repository.ts`.
- Validation: `npx tsc --noEmit`, `npm run lint`, and `npm run build` passed.
  `git diff --check` passed. Browser smoke testing could not complete because an
  existing Next.js dev server on port 3000 timed out and reported a broken pipe.
- To test manually: add a product to the cart, open `/checkout`, submit valid
  contact/address details, and select either simulated payment outcome. Confirm
  the demo banner, success/failure route, order number, and `/track-order`
  lookup. Use a Kenyan number such as `0712345678` and test both Nairobi and
  another county's delivery fee.

## T6 — WhatsApp

- Added a shared URL helper using only `BRAND.whatsappNumber`; invalid or missing
  values hide the links and produce a single development warning.
- Added the floating WhatsApp button globally, positioned above mobile bottom
  controls and behind the cart drawer.
- Added a product question action that includes product name, selected size and
  color, current price, and the current product page URL. Added an order
  question link on successful checkout with the order number in its message.
- Files changed: `AGENT_TASKS.md`, `PROGRESS.md`, `app/layout.tsx`,
  `components/store/whatsapp-floating-button.tsx`,
  `components/store/product-purchase-panel.tsx`,
  `components/store/checkout-result.tsx`, and `lib/whatsapp.ts`.
- Validation: `npx tsc --noEmit`, `npm run lint`, and `npm run build` passed;
  `git diff --check` passed.
- To test manually: set `NEXT_PUBLIC_WHATSAPP_NUMBER` in local development to a
  test number in international digits, then open any page and confirm the
  floating button opens WhatsApp. Open a product and confirm its question
  message includes selected variant, price, and URL; complete a successful demo
  checkout and check the order-question link. Remove the variable and verify
  links are hidden and a development warning is logged.

## T7 — Admin UI (mock, guarded)

- Added `/admin` with dashboard metrics and low-stock variants, product
  create/edit including variants and active/featured flags, category create/edit,
  and order details/status updates.
- Catalog edits are saved to browser localStorage and never call Supabase.
  Existing demo orders are read and updated through the mock repository.
- Added the visible “DEMO ADMIN: not secured” notice and a `/admin` layout guard
  that calls `notFound()` in production until real authentication is added.
- Files changed: `AGENT_TASKS.md`, `PROGRESS.md`, `app/admin/layout.tsx`,
  `app/admin/page.tsx`, `components/admin/admin-dashboard.tsx`,
  `lib/admin/mock-catalog-storage.ts`, `lib/data/repository.ts`,
  `lib/data/mock/repository.ts`, and `lib/data/supabase/repository.ts`.
- Validation: `npx tsc --noEmit`, `npm run lint`, and `npm run build` passed;
  `git diff --check` passed. Started the production build on port 3001 and
  confirmed `/admin` returns HTTP 404.
- To test manually: in development, open `/admin`; use each section to create
  and edit a product with variant rows like `M,Navy,4`, create/edit categories,
  and place a demo checkout order before changing its status. Refresh and verify
  catalog changes persist in that browser. In production, `/admin` must show
  the not-found page.
