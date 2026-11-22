import { findKenyanCounty } from "@/lib/config/kenya-locations";

// Delivery is free countrywide by owner decision. The per-county lookup is kept
// so a fee can be reintroduced in one place later.
export const DELIVERY_FEES_KES = {
  nairobi: 0,
  otherCounties: 0,
} as const;

// Add county slugs or "county-slug:town-slug" keys here for future fee overrides.
const deliveryFeeOverridesKes: Record<string, number> = {};

function slugifyTown(town: string) {
  return town
    .trim()
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function getDeliveryFee(countyIdentifier: string, town?: string) {
  const county = findKenyanCounty(countyIdentifier);
  if (!county) {
    return DELIVERY_FEES_KES.otherCounties;
  }

  const townOverride = town
    ? deliveryFeeOverridesKes[`${county.slug}:${slugifyTown(town)}`]
    : undefined;
  return (
    townOverride ??
    deliveryFeeOverridesKes[county.slug] ??
    DELIVERY_FEES_KES.otherCounties
  );
}
