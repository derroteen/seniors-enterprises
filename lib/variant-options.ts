// Shared, pure helpers for product variant options. Safe to import from both
// server and client code.

export const NEUTRAL_SIZE = "One size";
export const NEUTRAL_COLOR = "Standard";

const LETTER_SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];

function isNumericSize(size: string) {
  return /^\d+$/.test(size.trim());
}

/**
 * Sort size labels the way customers expect: whole numbers ascending first,
 * then clothing letters in XS→XXXL order, then anything else alphabetically.
 */
export function sortSizeLabels(sizes: string[]) {
  return [...sizes].sort((first, second) => {
    const a = first.trim();
    const b = second.trim();
    const aNumeric = isNumericSize(a);
    const bNumeric = isNumericSize(b);
    if (aNumeric && bNumeric) {
      return Number(a) - Number(b);
    }
    if (aNumeric !== bNumeric) {
      return aNumeric ? -1 : 1;
    }

    const aLetter = LETTER_SIZE_ORDER.indexOf(a.toUpperCase());
    const bLetter = LETTER_SIZE_ORDER.indexOf(b.toUpperCase());
    if (aLetter !== -1 || bLetter !== -1) {
      if (aLetter === -1) return 1;
      if (bLetter === -1) return -1;
      return aLetter - bLetter;
    }

    return a.localeCompare(b, undefined, { numeric: true });
  });
}

export function sortColorLabels(colors: string[]) {
  return [...colors].sort((first, second) =>
    first.localeCompare(second, undefined, { sensitivity: "base" }),
  );
}

export function isNeutralSizeOption(sizes: string[]) {
  return sizes.length === 1 && sizes[0] === NEUTRAL_SIZE;
}

export function isNeutralColorOption(colors: string[]) {
  return colors.length === 1 && colors[0] === NEUTRAL_COLOR;
}
