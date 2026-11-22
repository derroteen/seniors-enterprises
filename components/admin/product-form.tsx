"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";

import {
  saveProduct as saveProductAction,
  uploadProductImage,
} from "@/app/admin/actions";
import { ProductPhotos, type PendingPhoto } from "@/components/admin/product-photos";
import {
  VariantBuilder,
  type VariantPayloadRow,
} from "@/components/admin/variant-builder";
import { StatusMessage } from "@/components/ui/status-message";
import type { Category, Product } from "@/lib/data/types";

interface ProductFormProps {
  categories: Category[];
  /** The product being edited, or null when creating. */
  product: Product | null;
  onSaved: (product: Product, warnings: string[]) => void;
  onCancel: () => void;
}

function toSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const inputClassName =
  "min-h-11 w-full rounded-lg border border-border bg-background px-3 text-foreground";
const helpClassName = "text-xs text-muted-foreground";

export function ProductForm({
  categories,
  product,
  onSaved,
  onCancel,
}: ProductFormProps) {
  const productId = product?.id ?? null;
  const [loadedProductId, setLoadedProductId] = useState<string | null>(productId);

  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(false);
  const [slugEditing, setSlugEditing] = useState(false);
  const [categoryId, setCategoryId] = useState(product?.category_id ?? "");
  const [price, setPrice] = useState(
    product ? String(product.base_price_kes) : "",
  );
  const [compareAtPrice, setCompareAtPrice] = useState(
    product?.compare_at_price_kes ? String(product.compare_at_price_kes) : "",
  );
  const [description, setDescription] = useState(product?.description ?? "");
  const [isActive, setIsActive] = useState(product?.is_active ?? true);
  const [isFeatured, setIsFeatured] = useState(product?.is_featured ?? false);
  const [variantRows, setVariantRows] = useState<VariantPayloadRow[]>([]);
  const [pendingPhotos, setPendingPhotos] = useState<PendingPhoto[]>([]);
  const [photoWarning, setPhotoWarning] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [warnings, setWarnings] = useState<string[]>([]);
  const [isPending, setIsPending] = useState(false);

  // Load a different product (or reset for a new one) without remounting. When
  // a just-created product turns into an edit (null → id), keep queued photos
  // and the photo warning so failed uploads can be retried.
  useEffect(() => {
    if (productId === loadedProductId) {
      return;
    }
    const justCreated = loadedProductId === null && productId !== null;
    setLoadedProductId(productId);
    setName(product?.name ?? "");
    setSlug(product?.slug ?? "");
    setSlugEdited(false);
    setSlugEditing(false);
    setCategoryId(product?.category_id ?? "");
    setPrice(product ? String(product.base_price_kes) : "");
    setCompareAtPrice(
      product?.compare_at_price_kes ? String(product.compare_at_price_kes) : "",
    );
    setDescription(product?.description ?? "");
    setIsActive(product?.is_active ?? true);
    setIsFeatured(product?.is_featured ?? false);
    setVariantRows([]);
    setError("");
    setMessage("");
    setWarnings([]);
    if (!justCreated) {
      setPendingPhotos([]);
      setPhotoWarning("");
    }
  }, [productId, loadedProductId, product]);

  const handleRowsChange = useCallback((rows: VariantPayloadRow[]) => {
    setVariantRows(rows);
  }, []);

  useEffect(() => {
    if (pendingPhotos.length === 0) {
      setPhotoWarning("");
    }
  }, [pendingPhotos.length]);

  // Auto-slug from the name only until the admin edits it by hand; an existing
  // product keeps its stored slug so renaming does not break old links.
  const effectiveSlug = slugEdited
    ? slug
    : product
      ? product.slug
      : toSlug(name);

  async function uploadPendingPhoto(
    photo: PendingPhoto,
    targetProductId: string,
  ): Promise<boolean> {
    setPendingPhotos((current) =>
      current.map((entry) =>
        entry.id === photo.id ? { ...entry, status: "uploading", error: undefined } : entry,
      ),
    );
    try {
      const formData = new FormData();
      formData.set("productId", targetProductId);
      formData.set("file", photo.file);
      formData.set("altText", name.trim() || photo.name);
      await uploadProductImage(formData);
      setPendingPhotos((current) =>
        current.filter((entry) => entry.id !== photo.id),
      );
      URL.revokeObjectURL(photo.previewUrl);
      return true;
    } catch (uploadError) {
      setPendingPhotos((current) =>
        current.map((entry) =>
          entry.id === photo.id
            ? {
                ...entry,
                status: "error",
                error:
                  uploadError instanceof Error
                    ? uploadError.message
                    : "The photo could not be uploaded.",
              }
            : entry,
        ),
      );
      return false;
    }
  }

  const handleUploadPhoto = useCallback(
    (photo: PendingPhoto) => {
      if (!productId) {
        return;
      }
      void uploadPendingPhoto(photo, productId);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [productId, name],
  );

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setWarnings([]);
    setPhotoWarning("");

    const trimmedName = name.trim();
    const finalSlug = toSlug(effectiveSlug);
    const priceValue = Number(price);
    const compareValue = compareAtPrice.trim() ? Number(compareAtPrice) : null;

    if (!trimmedName || !finalSlug || !categoryId) {
      setError("Enter a product name, a category, and a price.");
      return;
    }
    if (!Number.isSafeInteger(priceValue) || priceValue < 1) {
      setError("Enter the price as a whole number of shillings, for example 2500.");
      return;
    }
    if (
      compareValue !== null &&
      (!Number.isSafeInteger(compareValue) || compareValue <= priceValue)
    ) {
      setError("The old price must be a whole number higher than the real price.");
      return;
    }
    if (variantRows.length === 0) {
      setError("Add at least one size or color option with stock.");
      return;
    }

    setIsPending(true);
    try {
      const result = await saveProductAction({
        id: productId,
        name: trimmedName,
        slug: finalSlug,
        category_id: categoryId,
        description: description.trim() || null,
        base_price_kes: priceValue,
        compare_at_price_kes: compareValue,
        is_active: isActive,
        is_featured: isFeatured,
        variants: variantRows,
      });

      const savedProduct = result.product;
      const targetProductId = savedProduct.id;

      // Upload queued photos one request each, with per-photo progress.
      const queued = pendingPhotos.filter((photo) => photo.status === "ready");
      let photoFailures = 0;
      for (const photo of queued) {
        const uploaded = await uploadPendingPhoto(photo, targetProductId);
        if (!uploaded) {
          photoFailures += 1;
        }
      }
      if (photoFailures > 0) {
        setPhotoWarning(
          "Product saved, but some photos did not upload. You can retry them here.",
        );
      }

      onSaved(savedProduct, result.warnings);
      if (result.warnings.length > 0) {
        setWarnings(result.warnings);
      }
      setMessage(productId ? "Product saved." : "Product created.");
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "The product could not be saved.",
      );
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form
      onSubmit={save}
      className="grid content-start gap-5 rounded-2xl border border-border bg-surface p-5"
    >
      <h2 className="text-lg font-semibold">
        {product ? "Edit product" : "Create product"}
      </h2>

      {error ? <StatusMessage tone="danger">{error}</StatusMessage> : null}
      {message ? <StatusMessage tone="success">{message}</StatusMessage> : null}
      {warnings.map((warning) => (
        <StatusMessage key={warning} tone="warning">
          {warning}
        </StatusMessage>
      ))}
      {photoWarning ? (
        <StatusMessage tone="warning">{photoWarning}</StatusMessage>
      ) : null}

      <div className="grid gap-1.5">
        <label htmlFor="product-name" className="text-sm font-medium">
          Name <span className="text-danger">*</span>
        </label>
        <input
          id="product-name"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g. Mara everyday sandal"
          className={inputClassName}
        />
        <p className={helpClassName}>
          The web address is created from the name automatically:{" "}
          <span className="font-mono">/{effectiveSlug || "…"}</span>
          {slugEditing ? null : (
            <>
              {" "}
              <button
                type="button"
                onClick={() => setSlugEditing(true)}
                className="text-primary underline"
              >
                Edit
              </button>
            </>
          )}
        </p>
        {slugEditing ? (
          <div className="flex items-center gap-2">
            <input
              value={slug}
              onChange={(event) => {
                setSlug(event.target.value);
                setSlugEdited(true);
              }}
              aria-label="Web address"
              className={`${inputClassName} font-mono text-sm`}
            />
            <button
              type="button"
              onClick={() => setSlugEditing(false)}
              className="min-h-11 shrink-0 rounded-lg border border-border px-3 text-sm font-medium hover:bg-background"
            >
              Done
            </button>
            {slugEdited ? (
              <button
                type="button"
                onClick={() => {
                  setSlugEdited(false);
                  setSlug("");
                }}
                className="min-h-11 shrink-0 rounded-lg px-2 text-sm text-muted-foreground underline"
              >
                Reset
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="grid gap-1.5">
        <label htmlFor="product-category" className="text-sm font-medium">
          Category <span className="text-danger">*</span>
        </label>
        <select
          id="product-category"
          required
          value={categoryId}
          onChange={(event) => setCategoryId(event.target.value)}
          className={inputClassName}
        >
          <option value="">Select a category</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <label htmlFor="product-price" className="text-sm font-medium">
            Price in KSh <span className="text-danger">*</span>
          </label>
          <input
            id="product-price"
            type="number"
            min="1"
            step="1"
            inputMode="numeric"
            required
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            placeholder="2500"
            className={inputClassName}
          />
        </div>
        <div className="grid gap-1.5">
          <label htmlFor="product-compare-price" className="text-sm font-medium">
            Old price (optional)
          </label>
          <input
            id="product-compare-price"
            type="number"
            min="1"
            step="1"
            inputMode="numeric"
            value={compareAtPrice}
            onChange={(event) => setCompareAtPrice(event.target.value)}
            placeholder="Was KSh"
            className={inputClassName}
          />
          <p className={helpClassName}>
            Optional. If you enter a higher old price, customers see it crossed
            out next to the real price, with a discount badge.
          </p>
        </div>
      </div>

      <div className="grid gap-1.5">
        <span className="text-sm font-medium">Photos</span>
        <ProductPhotos
          productId={productId}
          productName={name.trim() || "product"}
          images={product?.images ?? []}
          pendingPhotos={pendingPhotos}
          onPendingPhotosChange={setPendingPhotos}
          onUploadPhoto={handleUploadPhoto}
        />
      </div>

      <VariantBuilder
        key={productId ?? "new"}
        productName={name.trim() || "product"}
        initialVariants={product?.variants}
        onRowsChange={handleRowsChange}
      />

      <div className="grid gap-1.5">
        <label htmlFor="product-description" className="text-sm font-medium">
          Description <span className="text-sm font-normal text-muted-foreground">(optional)</span>
        </label>
        <textarea
          id="product-description"
          rows={4}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className={inputClassName}
        />
        <p className={helpClassName}>Optional. Leave empty if you do not need one.</p>
      </div>

      <div className="grid gap-2">
        <label className="flex min-h-11 items-center gap-3 rounded-lg border border-border px-3 text-sm">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(event) => setIsActive(event.target.checked)}
            className="size-5 accent-primary"
          />
          <span>
            <span className="block font-medium">Show in shop</span>
            <span className="block text-xs text-muted-foreground">
              Customers can see and buy it.
            </span>
          </span>
        </label>
        <label className="flex min-h-11 items-center gap-3 rounded-lg border border-border px-3 text-sm">
          <input
            type="checkbox"
            checked={isFeatured}
            onChange={(event) => setIsFeatured(event.target.checked)}
            className="size-5 accent-primary"
          />
          <span>
            <span className="block font-medium">Show on home page</span>
            <span className="block text-xs text-muted-foreground">
              It appears under Featured products.
            </span>
          </span>
        </label>
      </div>

      <div className="sticky bottom-0 -mx-5 grid grid-cols-2 gap-2 border-t border-border bg-surface px-5 py-3">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex min-h-12 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:bg-muted-bg disabled:text-muted-foreground disabled:opacity-100"
        >
          {isPending
            ? "Saving…"
            : product
              ? "Save product"
              : "Create product"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex min-h-12 items-center justify-center rounded-lg border border-border px-4 text-sm font-semibold hover:bg-background"
        >
          {product ? "Cancel" : "Clear form"}
        </button>
      </div>
    </form>
  );
}
