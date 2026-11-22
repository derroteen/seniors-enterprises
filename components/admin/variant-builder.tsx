"use client";

import { useEffect, useMemo, useState } from "react";

import {
  buildStockMatrix,
  CLOTHING_SIZES,
  COLOR_SUGGESTIONS,
  detectSizeKind,
  effectiveColors,
  effectiveSizes,
  generateSku,
  makeSkuUnique,
  SHOE_SIZES,
  stockRowKey,
  type SizeKind,
} from "@/lib/admin/variants";
import { NEUTRAL_COLOR } from "@/lib/variant-options";

export interface VariantRowState {
  stock: string;
  sku: string;
  skuEdited: boolean;
  priceOverride: string;
  priceOpen: boolean;
}

export interface VariantPayloadRow {
  size: string;
  color: string;
  stock_quantity: number;
  sku: string;
  price_override_kes: number | null;
}

interface VariantBuilderProps {
  /** Product name, used for automatic SKU generation. */
  productName: string;
  /** Called whenever the rows that would be saved change. */
  onRowsChange: (rows: VariantPayloadRow[]) => void;
  /** Existing variants to pre-fill when editing. */
  initialVariants?: { size: string; color: string; stock_quantity: number; sku: string; price_override_kes: number | null }[];
}

const emptyRow: VariantRowState = {
  stock: "0",
  sku: "",
  skuEdited: false,
  priceOverride: "",
  priceOpen: false,
};

function initialStateFromVariants(
  variants: NonNullable<VariantBuilderProps["initialVariants"]>,
) {
  const sizes = [...new Set(variants.map((variant) => variant.size.trim()))];
  const colors = [...new Set(variants.map((variant) => variant.color.trim()))];
  const rowData: Record<string, VariantRowState> = {};
  for (const variant of variants) {
    rowData[stockRowKey(variant.size, variant.color)] = {
      stock: String(variant.stock_quantity),
      sku: variant.sku,
      skuEdited: true,
      priceOverride:
        variant.price_override_kes === null ? "" : String(variant.price_override_kes),
      priceOpen: variant.price_override_kes !== null,
    };
  }
  return {
    sizeKind: detectSizeKind(sizes),
    sizes,
    colors: colors.filter((color) => color !== NEUTRAL_COLOR),
    noColorOption: colors.length === 1 && colors[0] === NEUTRAL_COLOR,
    rowData,
  };
}

export function VariantBuilder({
  productName,
  onRowsChange,
  initialVariants,
}: VariantBuilderProps) {
  const initial = useMemo(
    () => (initialVariants?.length ? initialStateFromVariants(initialVariants) : null),
    [initialVariants],
  );

  const [sizeKind, setSizeKind] = useState<SizeKind>(
    () => initial?.sizeKind ?? "clothing",
  );
  const [sizes, setSizes] = useState<string[]>(() => initial?.sizes ?? []);
  const [sizeInput, setSizeInput] = useState("");
  const [colors, setColors] = useState<string[]>(() => initial?.colors ?? []);
  const [colorInput, setColorInput] = useState("");
  const [noColorOption, setNoColorOption] = useState(
    () => initial?.noColorOption ?? false,
  );
  const [rowData, setRowData] = useState<Record<string, VariantRowState>>(
    () => initial?.rowData ?? {},
  );
  const [bulkStock, setBulkStock] = useState("");

  const matrixSizes = useMemo(
    () => effectiveSizes(sizeKind, sizes),
    [sizeKind, sizes],
  );
  const matrixColors = useMemo(
    () => effectiveColors(colors, noColorOption),
    [colors, noColorOption],
  );
  const matrix = useMemo(
    () => buildStockMatrix(matrixSizes, matrixColors),
    [matrixSizes, matrixColors],
  );

  function updateRow(key: string, patch: Partial<VariantRowState>) {
    setRowData((current) => ({
      ...current,
      [key]: { ...(current[key] ?? emptyRow), ...patch },
    }));
  }

  // Emit the save-ready rows whenever inputs change. SKUs that were not edited
  // by hand are generated and de-duplicated here; edited SKUs are kept as-is.
  useEffect(() => {
    const usedSkus = new Set<string>();
    const rows: VariantPayloadRow[] = matrix.map((entry) => {
      const data = rowData[entry.key] ?? emptyRow;
      const autoSku = generateSku(productName, entry.color, entry.size);
      const sku = data.skuEdited
        ? data.sku.trim() || autoSku
        : makeSkuUnique(autoSku, (candidate) => usedSkus.has(candidate));
      usedSkus.add(sku.toLocaleLowerCase());
      const override = data.priceOverride.trim();
      const stock = Number(data.stock);
      return {
        size: entry.size,
        color: entry.color,
        stock_quantity: Number.isSafeInteger(stock) && stock >= 0 ? stock : 0,
        sku,
        price_override_kes:
          override && Number.isSafeInteger(Number(override)) && Number(override) > 0
            ? Number(override)
            : null,
      };
    });
    onRowsChange(rows);
  }, [matrix, rowData, productName, onRowsChange]);

  function toggleSize(size: string) {
    setSizes((current) =>
      current.includes(size)
        ? current.filter((entry) => entry !== size)
        : [...current, size],
    );
  }

  function addCustomSize() {
    const value = sizeInput.trim();
    if (!value) {
      return;
    }
    setSizes((current) => (current.includes(value) ? current : [...current, value]));
    setSizeInput("");
  }

  function removeSize(size: string) {
    setSizes((current) => current.filter((entry) => entry !== size));
  }

  function addColor(value: string) {
    const color = value.trim();
    if (!color) {
      return;
    }
    setColors((current) =>
      current.some((entry) => entry.toLocaleLowerCase() === color.toLocaleLowerCase())
        ? current
        : [...current, color],
    );
    setColorInput("");
  }

  function removeColor(color: string) {
    setColors((current) => current.filter((entry) => entry !== color));
  }

  function applyBulkStock() {
    const value = Number(bulkStock);
    if (!bulkStock.trim() || !Number.isSafeInteger(value) || value < 0) {
      return;
    }
    setRowData((current) => {
      const next = { ...current };
      for (const entry of matrix) {
        next[entry.key] = { ...(next[entry.key] ?? emptyRow), stock: bulkStock.trim() };
      }
      return next;
    });
  }

  const presetSizes = sizeKind === "shoes" ? SHOE_SIZES : CLOTHING_SIZES;
  const customSizes = sizes.filter((size) => !presetSizes.includes(size));
  const suggestedColors = COLOR_SUGGESTIONS.filter(
    (suggestion) => !colors.some((color) => color.toLocaleLowerCase() === suggestion.toLocaleLowerCase()),
  );

  return (
    <div className="grid gap-5">
      <fieldset className="grid gap-2">
        <legend className="text-sm font-semibold">
          What kind of sizes does this product have?
        </legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {(
            [
              ["clothing", "Clothing sizes (XS, S, M, L…)"],
              ["shoes", "Shoe sizes (numbers like 36–47)"],
              ["one-size", "One size / no sizes"],
              ["custom", "My own sizes"],
            ] as [SizeKind, string][]
          ).map(([kind, label]) => (
            <label
              key={kind}
              className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border px-3 text-sm ${
                sizeKind === kind ? "border-primary bg-primary/5 font-medium" : "border-border"
              }`}
            >
              <input
                type="radio"
                name="size-kind"
                value={kind}
                checked={sizeKind === kind}
                onChange={() => {
                  setSizeKind(kind);
                  setSizes([]);
                }}
                className="size-4 accent-primary"
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      {sizeKind === "clothing" || sizeKind === "shoes" ? (
        <div className="grid gap-2">
          <p className="text-sm font-medium">Tap the sizes you sell:</p>
          <div className="flex flex-wrap gap-2">
            {presetSizes.map((size) => {
              const selected = sizes.includes(size);
              return (
                <button
                  key={size}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggleSize(size)}
                  className={`min-h-11 min-w-11 rounded-lg border px-3 text-sm font-medium ${
                    selected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:bg-background"
                  }`}
                >
                  {size}
                </button>
              );
            })}
          </div>
          {sizeKind === "shoes" ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">Other sizes (e.g. kids 28–35):</span>
              {customSizes.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => removeSize(size)}
                  aria-label={`Remove size ${size}`}
                  className="inline-flex min-h-10 items-center gap-1 rounded-full border border-border bg-background px-3 text-sm"
                >
                  {size} <span aria-hidden="true">×</span>
                </button>
              ))}
              <input
                value={sizeInput}
                onChange={(event) => setSizeInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addCustomSize();
                  }
                }}
                inputMode="numeric"
                placeholder="Add size"
                aria-label="Add another shoe size"
                className="min-h-10 w-28 rounded-lg border border-border bg-background px-3 text-sm"
              />
              <button
                type="button"
                onClick={addCustomSize}
                className="min-h-10 rounded-lg border border-border px-3 text-sm font-medium hover:bg-background"
              >
                + Add another size
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {sizeKind === "custom" ? (
        <div className="grid gap-2">
          <p className="text-sm font-medium">Type your own size labels:</p>
          <div className="flex flex-wrap items-center gap-2">
            {sizes.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => removeSize(size)}
                aria-label={`Remove size ${size}`}
                className="inline-flex min-h-10 items-center gap-1 rounded-full border border-border bg-background px-3 text-sm"
              >
                {size} <span aria-hidden="true">×</span>
              </button>
            ))}
            <input
              value={sizeInput}
              onChange={(event) => setSizeInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addCustomSize();
                }
              }}
              placeholder="e.g. 6-7Y"
              aria-label="Add a size"
              className="min-h-10 w-32 rounded-lg border border-border bg-background px-3 text-sm"
            />
            <button
              type="button"
              onClick={addCustomSize}
              className="min-h-10 rounded-lg border border-border px-3 text-sm font-medium hover:bg-background"
            >
              Add size
            </button>
          </div>
        </div>
      ) : null}

      <div className="grid gap-2">
        <p className="text-sm font-semibold">Colors</p>
        <label className="flex min-h-10 items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={noColorOption}
            onChange={(event) => setNoColorOption(event.target.checked)}
            className="size-4 accent-primary"
          />
          This product has no color options
        </label>
        {!noColorOption ? (
          <>
            <div className="flex flex-wrap gap-2">
              {colors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => removeColor(color)}
                  aria-label={`Remove color ${color}`}
                  className="inline-flex min-h-10 items-center gap-1 rounded-full border border-border bg-background px-3 text-sm"
                >
                  {color} <span aria-hidden="true">×</span>
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input
                value={colorInput}
                onChange={(event) => setColorInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addColor(colorInput);
                  }
                }}
                placeholder="Color name"
                aria-label="Color name"
                className="min-h-11 min-w-36 flex-1 rounded-lg border border-border bg-background px-3 text-sm"
              />
              <button
                type="button"
                onClick={() => addColor(colorInput)}
                className="min-h-11 rounded-lg border border-border px-4 text-sm font-medium hover:bg-background"
              >
                Add
              </button>
            </div>
            {suggestedColors.length > 0 ? (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Quick add:</span>
                {suggestedColors.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => addColor(suggestion)}
                    className="min-h-9 rounded-full border border-border px-2.5 text-xs text-muted-foreground hover:bg-background hover:text-foreground"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            ) : null}
          </>
        ) : null}
      </div>

      <div className="grid gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold">Stock</p>
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground" htmlFor="bulk-stock">
              Set the same stock for all
            </label>
            <input
              id="bulk-stock"
              value={bulkStock}
              onChange={(event) => setBulkStock(event.target.value)}
              inputMode="numeric"
              placeholder="0"
              className="min-h-10 w-20 rounded-lg border border-border bg-background px-2 text-sm"
            />
            <button
              type="button"
              onClick={applyBulkStock}
              className="min-h-10 rounded-lg border border-border px-3 text-sm font-medium hover:bg-background"
            >
              Apply
            </button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          One row for every size and color. Stock 0 shows as &quot;Sold out&quot; in the shop.
        </p>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[42rem] text-sm">
            <thead>
              <tr className="border-b border-border bg-background text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-3 py-2 font-medium">Size</th>
                <th className="px-3 py-2 font-medium">Color</th>
                <th className="px-3 py-2 font-medium">Stock</th>
                <th className="px-3 py-2 font-medium">SKU</th>
                <th className="px-3 py-2 font-medium">Price</th>
              </tr>
            </thead>
            <tbody>
              {matrix.map((entry) => {
                const data = rowData[entry.key] ?? emptyRow;
                const autoSku = generateSku(productName, entry.color, entry.size);
                const shownSku = data.skuEdited ? data.sku || autoSku : autoSku;
                return (
                  <tr key={entry.key} className="border-b border-border last:border-0">
                    <td className="px-3 py-2 font-medium">{entry.size}</td>
                    <td className="px-3 py-2">{entry.color}</td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        inputMode="numeric"
                        value={data.stock}
                        onChange={(event) =>
                          updateRow(entry.key, { stock: event.target.value })
                        }
                        aria-label={`Stock for ${entry.size} ${entry.color}`}
                        className="min-h-10 w-20 rounded-lg border border-border bg-background px-2 text-sm"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1">
                        <input
                          value={shownSku}
                          onChange={(event) =>
                            updateRow(entry.key, {
                              sku: event.target.value,
                              skuEdited: true,
                            })
                          }
                          aria-label={`SKU for ${entry.size} ${entry.color}`}
                          className="min-h-10 w-32 rounded-lg border border-border bg-background px-2 font-mono text-xs"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            updateRow(entry.key, { skuEdited: false, sku: "" })
                          }
                          className="min-h-10 shrink-0 rounded-md border border-border px-2 text-xs text-muted-foreground hover:bg-background"
                        >
                          Regenerate
                        </button>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      {data.priceOpen ? (
                        <div className="grid gap-1">
                          <input
                            type="number"
                            min="1"
                            step="1"
                            inputMode="numeric"
                            value={data.priceOverride}
                            onChange={(event) =>
                              updateRow(entry.key, { priceOverride: event.target.value })
                            }
                            placeholder="KSh"
                            aria-label={`Different price for ${entry.size} ${entry.color}`}
                            className="min-h-10 w-24 rounded-lg border border-border bg-background px-2 text-sm"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              updateRow(entry.key, { priceOpen: false, priceOverride: "" })
                            }
                            className="text-left text-xs text-muted-foreground underline"
                          >
                            Use the product price
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => updateRow(entry.key, { priceOpen: true })}
                          className="min-h-10 text-left text-xs text-primary underline"
                        >
                          Different price for this size or color?
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground">
          A SKU is a short code for one exact item, for example MARA-NAVY-42 for the Mara sneaker in navy, size 42. Customers never see it. It helps you count stock and find the right item. We create it for you, so you can leave it as it is.
        </p>
        <p className="text-xs text-muted-foreground">
          Every size and color normally sells at the product&apos;s price. Use this only if one particular size or color costs something different, for example size 46 costs KSh 300 more. Leave it empty to use the product&apos;s price.
        </p>
      </div>
    </div>
  );
}
