import { readFile } from "node:fs/promises";

const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

function readTheme(selector) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const block = css.match(new RegExp(`${escapedSelector}\\s*\\{([^}]+)\\}`))?.[1];
  if (!block) {
    throw new Error(`Could not find ${selector} color tokens in app/globals.css.`);
  }

  return Object.fromEntries(
    [...block.matchAll(/--([\w-]+):\s*(#[\da-fA-F]{6})\s*;/g)].map(([, name, value]) => [
      name,
      value,
    ]),
  );
}

function luminance(hex) {
  const channels = hex.match(/[\da-fA-F]{2}/g)?.map((channel) => parseInt(channel, 16) / 255);
  if (!channels || channels.length !== 3) {
    throw new Error(`Expected a six-digit hex color, received ${hex}.`);
  }

  const [red, green, blue] = channels.map((channel) =>
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrastRatio(first, second) {
  const firstLuminance = luminance(first);
  const secondLuminance = luminance(second);
  return (Math.max(firstLuminance, secondLuminance) + 0.05)
    / (Math.min(firstLuminance, secondLuminance) + 0.05);
}

function blend(foreground, background, opacity) {
  const foregroundChannels = foreground.match(/[\da-fA-F]{2}/g)?.map((channel) => parseInt(channel, 16));
  const backgroundChannels = background.match(/[\da-fA-F]{2}/g)?.map((channel) => parseInt(channel, 16));
  if (!foregroundChannels || !backgroundChannels) {
    throw new Error("Could not blend invalid hex colors.");
  }

  return `#${foregroundChannels
    .map((channel, index) =>
      Math.round(channel * opacity + backgroundChannels[index] * (1 - opacity))
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}

const textOnPage = ["foreground", "muted", "muted-foreground", "primary", "gold-text"];
const semanticTones = ["success", "warning", "danger", "info", "muted"];
const results = [];

for (const [theme, selector] of [["light", ":root"], ["dark", ".dark"]]) {
  const tokens = readTheme(selector);
  const check = (label, foreground, background, minimum) => {
    const ratio = contrastRatio(foreground, background);
    results.push({
      theme,
      label,
      ratio,
      minimum,
      passed: ratio >= minimum,
    });
  };

  for (const token of textOnPage) {
    check(`${token} / page background`, tokens[token], tokens.background, 4.5);
    check(`${token} / surface`, tokens[token], tokens.surface, 4.5);
  }
  check(
    "primary-dark foreground / primary-dark",
    tokens["primary-dark-foreground"],
    tokens["primary-dark"],
    4.5,
  );

  for (const tone of semanticTones) {
    for (const background of ["background", "surface", `${tone}-bg`]) {
      check(`${tone} / ${background}`, tokens[tone], tokens[background], 4.5);
    }
    check(`${tone} icon / ${tone}-bg`, tokens[tone], tokens[`${tone}-bg`], 3);
    check(`${tone} border / ${tone}-bg`, tokens[`${tone}-border`], tokens[`${tone}-bg`], 3);
  }

  check("primary button text / primary", tokens["primary-foreground"], tokens.primary, 4.5);
  check("gold button text / accent", tokens["accent-foreground"], tokens.accent, 4.5);
  check("input border / page background", tokens["border-strong"], tokens.background, 3);
  check("input border / surface", tokens["border-strong"], tokens.surface, 3);
  check("focus ring / page background", tokens.info, tokens.background, 3);
  check("focus ring / surface", tokens.info, tokens.surface, 3);
  check(
    "disabled stepper icon (.8) / background",
    blend(tokens.muted, tokens.background, 0.8),
    tokens.background,
    3,
  );
  check(
    "disabled stepper icon (.8) / surface",
    blend(tokens.muted, tokens.surface, 0.8),
    tokens.surface,
    3,
  );
  check(
    "disabled quantity text (.8) / surface",
    blend(tokens.muted, tokens.surface, 0.8),
    tokens.surface,
    3,
  );
}

const labelWidth = Math.max(...results.map(({ label }) => label.length));
console.log("Theme  Contrast pair                              Ratio  Minimum  Result");
console.log("-----  ------------------------------------------  -----  -------  ------");
for (const result of results) {
  console.log(
    `${result.theme.padEnd(5)}  ${result.label.padEnd(labelWidth)}  `
      + `${result.ratio.toFixed(2).padStart(5)}:1  `
      + `${`${result.minimum.toFixed(1)}:1`.padStart(7)}  `
      + `${result.passed ? "PASS" : "FAIL"}`,
  );
}

const failures = results.filter(({ passed }) => !passed);
console.log(`\n${results.length - failures.length}/${results.length} contrast checks passed.`);
if (failures.length > 0) {
  process.exitCode = 1;
}
