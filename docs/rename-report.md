# Brand Rename Report

The repository scan was case-insensitive, excluded `node_modules`, `.next`, and
`.git`, and ran before T1 edits. It found 28 content matches across 11 files.
No filenames contained “senior”. `docs/overnight/AGENT_TASKS.md` already used
the requested “Seniors Enterprises” spelling and was left unchanged.

## Brand matches

| File | Before | After |
| --- | --- | --- |
| `package.json` and `package-lock.json` | `senior-enterprises` | `seniors-enterprises` |
| `components/store/site-header.tsx` | `Senior Enterprises home` | `{BRAND.name} home` |
| `components/store/site-header.tsx` | `/brand/senior-enterprises-b.svg` | `/brand/logo-full-light.png` |
| `components/store/site-header.tsx` | `/brand/senior-enterprises-b-dark.svg` | `/brand/logo-full-dark.png` |
| `components/store/site-header.tsx` | `Senior Enterprises` image alt text | `{BRAND.name}` |
| `components/store/site-footer.tsx` | `Senior Enterprises home` | `{BRAND.name} home` |
| `components/store/site-footer.tsx` | `/brand/senior-enterprises-b.svg` | `/brand/logo-full-light.png` |
| `components/store/site-footer.tsx` | `/brand/senior-enterprises-b-dark.svg` | `/brand/logo-full-dark.png` |
| `components/store/site-footer.tsx` | `Senior Enterprises` image alt text | `{BRAND.name}` |
| `components/store/site-footer.tsx` | `Why Senior Enterprises` | `Why {BRAND.name}` |
| `components/store/site-footer.tsx` | `/#why-senior` | `/#why-seniors` |
| `components/store/site-footer.tsx` | `© {year} Senior Enterprises` | `© {year} {BRAND.name}` |
| `app/(store)/page.tsx` | `Senior Enterprises` hero eyebrow | `{BRAND.name}` |
| `app/(store)/page.tsx` | `Why Senior Enterprises` | `Why {BRAND.name}` |
| `app/(store)/page.tsx` | `id="why-senior"` | `id="why-seniors"` |
| `app/(store)/shop/page.tsx` | `Senior Enterprises collection` | `{BRAND.name} collection` |
| `app/(store)/shop/[category]/page.tsx` | `from Senior Enterprises` | `from ${BRAND.name}` |
| `app/(store)/shop/[category]/page.tsx` | `Senior Enterprises collection` | `{BRAND.name} collection` |
| `app/(store)/product/[slug]/page.tsx` | `from Senior Enterprises` | `from ${BRAND.name}` |
| `app/layout.tsx` | `Senior Enterprises` page title | `{BRAND.name}` |
| `app/layout.tsx` | `Senior Enterprises` page description | `{BRAND.name}` |
| `app/styleguide/page.tsx` | `Senior Enterprises` heading | `{BRAND.name}` |

## Non-brand matches

- The T1 checklist itself contains “Seniors Enterprises”, which already has
  the requested spelling, and was left unchanged.
- No ordinary-English “senior” usage was found in the repository content scan.

## Centralized brand config

Added `lib/brand.ts`, used in visible brand UI text and metadata. The package
name was changed to `seniors-enterprises`; repository and folder names were not
changed.
