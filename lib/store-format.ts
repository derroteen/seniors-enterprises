export function formatKes(amount: number) {
  return `KSh ${new Intl.NumberFormat("en-KE", {
    maximumFractionDigits: 0,
  }).format(amount)}`;
}

export function getDiscountPercent(price: number, compareAtPrice: number | null) {
  if (compareAtPrice === null || compareAtPrice <= price) {
    return null;
  }

  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
}

export function firstSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function parsePriceParam(value: string | undefined) {
  if (!value || !/^\d{1,8}$/.test(value)) {
    return undefined;
  }

  const amount = Number(value);
  return Number.isSafeInteger(amount) ? amount : undefined;
}

export function parsePageParam(value: string | undefined) {
  if (!value || !/^\d{1,6}$/.test(value)) {
    return 1;
  }

  return Math.max(1, Number(value));
}
