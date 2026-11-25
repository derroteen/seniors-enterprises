"use server";

import "server-only";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAdminAction, requireAdminPage } from "@/lib/admin/auth";
import { generateSku, makeSkuUnique, stockRowKey } from "@/lib/admin/variants";
import type { Product, ProductImage, ProductVariant } from "@/lib/data/types";
import { createClient } from "@/lib/supabase/server";

const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use a lowercase, hyphenated slug.");

const variantSchema = z.object({
  size: z.string().trim().min(1).max(32),
  color: z.string().trim().min(1).max(64),
  stock_quantity: z.number().int().min(0).max(1_000_000),
  sku: z.string().trim().max(100).optional(),
  price_override_kes: z.number().int().positive().nullable().optional(),
});

const productSchema = z
  .object({
    id: z.string().uuid().nullable(),
    name: z.string().trim().min(1).max(160),
    slug: slugSchema,
    category_id: z.string().uuid(),
    description: z.string().trim().max(5_000).nullable(),
    base_price_kes: z.number().int().positive(),
    compare_at_price_kes: z.number().int().positive().nullable(),
    is_active: z.boolean().optional(),
    is_featured: z.boolean(),
    variants: z.array(variantSchema).min(1).max(300),
  })
  .superRefine((product, context) => {
    if (
      product.compare_at_price_kes !== null &&
      product.compare_at_price_kes <= product.base_price_kes
    ) {
      context.addIssue({
        code: "custom",
        message: "The was price must be greater than the current price.",
        path: ["compare_at_price_kes"],
      });
    }

    const combinations = new Set<string>();
    const skus = new Set<string>();
    for (const [index, variant] of product.variants.entries()) {
      const combination = `${variant.size.toLocaleLowerCase()}|${variant.color.toLocaleLowerCase()}`;
      if (combinations.has(combination)) {
        context.addIssue({
          code: "custom",
          message: "Each size and color combination must be unique.",
          path: ["variants", index],
        });
      }
      combinations.add(combination);

      const sku = variant.sku?.trim().toLocaleLowerCase();
      if (sku && skus.has(sku)) {
        context.addIssue({
          code: "custom",
          message: "Variant SKUs must be unique.",
          path: ["variants", index, "sku"],
        });
      }
      if (sku) {
        skus.add(sku);
      }
    }
  });

const categorySchema = z.object({
  id: z.string().uuid().nullable(),
  name: z.string().trim().min(1).max(100),
  slug: slugSchema,
});

const orderStatusSchema = z.enum([
  "pending",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
]);

const imageLimitBytes = 5 * 1024 * 1024;
const allowedImageTypes = new Map([
  ["image/jpeg", { extension: "jpg", signature: [0xff, 0xd8, 0xff] }],
  ["image/png", { extension: "png", signature: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] }],
  ["image/webp", { extension: "webp", signature: null }],
]);

function revalidateStorefront() {
  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath("/shop/[category]", "page");
  revalidatePath("/product/[slug]", "page");
  revalidatePath("/sitemap.xml");
  revalidatePath("/admin");
}

function mapProductImage(row: {
  id: string;
  product_id: string;
  url: string;
  alt_text: string | null;
  sort_order: number;
}): ProductImage {
  return {
    id: row.id,
    product_id: row.product_id,
    url: row.url,
    alt_text: row.alt_text,
    sort_order: row.sort_order,
  };
}

async function loadSavedProduct(
  client: Awaited<ReturnType<typeof requireAdminAction>>["client"],
  productId: string,
): Promise<Product> {
  const [productResult, variantsResult, imagesResult] = await Promise.all([
    client.from("products").select("*").eq("id", productId).single(),
    client.from("product_variants").select("*").eq("product_id", productId),
    client
      .from("product_images")
      .select("*")
      .eq("product_id", productId)
      .order("sort_order", { ascending: true }),
  ]);
  if (productResult.error) {
    throw new Error(`Could not reload the saved product: ${productResult.error.message}`);
  }
  if (variantsResult.error) {
    throw new Error(`Could not reload product options: ${variantsResult.error.message}`);
  }
  if (imagesResult.error) {
    throw new Error(`Could not reload product photos: ${imagesResult.error.message}`);
  }

  const variants: ProductVariant[] = (variantsResult.data ?? []).map(
    (variant) => ({ ...variant }),
  );
  const images: ProductImage[] = (imagesResult.data ?? []).map(mapProductImage);
  return { ...productResult.data, variants, images };
}

function getVariantFileType(type: string, bytes: Uint8Array) {
  const imageType = allowedImageTypes.get(type);
  if (!imageType) {
    return null;
  }
  if (imageType.signature) {
    return imageType.signature.every((byte, index) => bytes[index] === byte)
      ? imageType
      : null;
  }
  const isWebp =
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  return isWebp ? imageType : null;
}

export async function logoutAdmin() {
  await requireAdminPage();
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new Error(`Could not sign out: ${error.message}`);
  }
  redirect("/login");
}

export async function saveProduct(input: unknown): Promise<{
  product: Product;
  warnings: string[];
}> {
  const { client } = await requireAdminAction();
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Product details are invalid.");
  }
  const product = parsed.data;

  const { data: category, error: categoryError } = await client
    .from("categories")
    .select("id")
    .eq("id", product.category_id)
    .maybeSingle();
  if (categoryError) {
    throw new Error(`Could not verify the category: ${categoryError.message}`);
  }
  if (!category) {
    throw new Error("Choose a category that still exists.");
  }

  const productValues = {
    name: product.name,
    slug: product.slug,
    description: product.description || null,
    category_id: product.category_id,
    base_price_kes: product.base_price_kes,
    compare_at_price_kes: product.compare_at_price_kes,
    is_featured: product.is_featured,
    ...(product.is_active === undefined
      ? product.id
        ? {}
        : { is_active: true }
      : { is_active: product.is_active }),
  };
  const savedProductResult = product.id
    ? await client
        .from("products")
        .update(productValues)
        .eq("id", product.id)
        .select("*")
        .single()
    : await client.from("products").insert(productValues).select("*").single();

  if (savedProductResult.error) {
    throw new Error(`Could not save product: ${savedProductResult.error.message}`);
  }
  const savedProduct = savedProductResult.data;

  const warnings: string[] = [];
  try {
    const { data: existingVariants, error: existingVariantsError } = await client
      .from("product_variants")
      .select("*")
      .eq("product_id", savedProduct.id);
    if (existingVariantsError) {
      throw new Error(`Could not load existing variants: ${existingVariantsError.message}`);
    }

    // SKUs must be unique across the whole shop, not just this product.
    const { data: allVariantRows, error: allVariantsError } = await client
      .from("product_variants")
      .select("id, product_id, size, color, sku");
    if (allVariantsError) {
      throw new Error(`Could not check existing SKUs: ${allVariantsError.message}`);
    }

    const existingByCombination = new Map(
      (existingVariants ?? []).map((variant) => [
        stockRowKey(variant.size, variant.color),
        variant,
      ]),
    );
    const desiredCombinations = new Set<string>();
    for (const variant of product.variants) {
      desiredCombinations.add(stockRowKey(variant.size, variant.color));
    }

    const removedVariantIds = (existingVariants ?? [])
      .filter((variant) => !desiredCombinations.has(stockRowKey(variant.size, variant.color)))
      .map((variant) => variant.id);

    // Variants referenced by past orders cannot be deleted; keep them with
    // stock set to 0 so they show as sold out instead of disappearing.
    const protectedVariantIds = new Set<string>();
    if (removedVariantIds.length > 0) {
      const { data: orderItemRows, error: orderItemsError } = await client
        .from("order_items")
        .select("variant_id")
        .in("variant_id", removedVariantIds);
      if (orderItemsError) {
        throw new Error(`Could not check order history: ${orderItemsError.message}`);
      }
      for (const row of orderItemRows ?? []) {
        if (row.variant_id) {
          protectedVariantIds.add(row.variant_id);
        }
      }
    }
    const deletableVariantIds = removedVariantIds.filter(
      (id) => !protectedVariantIds.has(id),
    );
    if (protectedVariantIds.size > 0) {
      const { error: protectError } = await client
        .from("product_variants")
        .update({ stock_quantity: 0 })
        .in("id", [...protectedVariantIds]);
      if (protectError) {
        throw new Error(`Could not update sold-out options: ${protectError.message}`);
      }
      warnings.push(
        "Some options have past orders, so they were kept with stock set to 0 instead of being deleted.",
      );
    }

    // SKUs taken by rows that will still exist after this save.
    const blockedSkus = new Set(
      (allVariantRows ?? [])
        .filter((row) => {
          if (deletableVariantIds.includes(row.id)) {
            return false;
          }
          if (
            row.product_id === savedProduct.id &&
            desiredCombinations.has(stockRowKey(row.size, row.color))
          ) {
            return false;
          }
          return true;
        })
        .map((row) => row.sku.trim().toLocaleLowerCase())
        .filter(Boolean),
    );
    const usedSkus = new Set<string>();

    for (const variant of product.variants) {
      const combination = stockRowKey(variant.size, variant.color);
      const existing = existingByCombination.get(combination);
      const baseSku =
        variant.sku?.trim() ||
        existing?.sku ||
        generateSku(product.name, variant.color, variant.size);
      const sku = makeSkuUnique(
        baseSku,
        (candidate) =>
          blockedSkus.has(candidate) || usedSkus.has(candidate),
      );
      usedSkus.add(sku.toLocaleLowerCase());
      const variantValues = {
        product_id: savedProduct.id,
        size: variant.size,
        color: variant.color,
        sku,
        stock_quantity: variant.stock_quantity,
        price_override_kes:
          variant.price_override_kes === undefined
            ? existing?.price_override_kes ?? null
            : variant.price_override_kes,
      };

      const result = existing
        ? await client
            .from("product_variants")
            .update(variantValues)
            .eq("id", existing.id)
        : await client.from("product_variants").insert(variantValues);
      if (result.error) {
        throw new Error(`Could not save option ${variant.size}/${variant.color}: ${result.error.message}`);
      }
    }

    if (deletableVariantIds.length > 0) {
      const { error } = await client
        .from("product_variants")
        .delete()
        .in("id", deletableVariantIds);
      if (error) {
        throw new Error(
          `Could not remove options: ${error.message}. This option has past orders, so it cannot be deleted. Set its stock to 0 instead.`,
        );
      }
    }
  } finally {
    revalidateStorefront();
  }

  const savedWithRelations = await loadSavedProduct(client, savedProduct.id);
  return { product: savedWithRelations, warnings };
}

export async function deleteProduct(productId: string) {
  const { client } = await requireAdminAction();
  const id = z.string().uuid().parse(productId);
  const { data: product, error: lookupError } = await client
    .from("products")
    .select("id")
    .eq("id", id)
    .maybeSingle();
  if (lookupError) {
    throw new Error(`Could not find product: ${lookupError.message}`);
  }
  if (!product) {
    throw new Error("The product no longer exists.");
  }

  const { error } = await client.from("products").delete().eq("id", id);
  if (error) {
    throw new Error(`Could not delete product: ${error.message}`);
  }
  revalidateStorefront();
}

export async function saveCategory(input: unknown) {
  const { client } = await requireAdminAction();
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Category details are invalid.");
  }

  const result = parsed.data.id
    ? await client
        .from("categories")
        .update({ name: parsed.data.name, slug: parsed.data.slug })
        .eq("id", parsed.data.id)
        .select("id")
        .maybeSingle()
    : await client
        .from("categories")
        .insert({ name: parsed.data.name, slug: parsed.data.slug })
        .select("id")
        .single();

  if (result.error) {
    throw new Error(`Could not save category: ${result.error.message}`);
  }
  if (!result.data) {
    throw new Error("The category no longer exists.");
  }
  revalidateStorefront();
}

export async function uploadProductImage(formData: FormData) {
  const { client } = await requireAdminAction();
  const productId = z.string().uuid().parse(String(formData.get("productId") ?? ""));
  const altText = z.string().trim().max(200).parse(String(formData.get("altText") ?? ""));
  const file = formData.get("file");

  if (typeof File === "undefined" || !(file instanceof File) || file.size === 0) {
    throw new Error("Choose an image file to upload.");
  }
  if (file.size > imageLimitBytes) {
    throw new Error("Images must be 5 MB or smaller.");
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const imageType = getVariantFileType(file.type, bytes);
  if (!imageType) {
    throw new Error("Use a valid JPG, PNG, or WebP image.");
  }

  const { data: product, error: productError } = await client
    .from("products")
    .select("id")
    .eq("id", productId)
    .maybeSingle();
  if (productError) {
    throw new Error(`Could not verify the product: ${productError.message}`);
  }
  if (!product) {
    throw new Error("The selected product no longer exists.");
  }

  const { data: lastImage, error: imageOrderError } = await client
    .from("product_images")
    .select("sort_order")
    .eq("product_id", productId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (imageOrderError) {
    throw new Error(`Could not determine image order: ${imageOrderError.message}`);
  }

  const objectPath = `${productId}/${randomUUID()}.${imageType.extension}`;
  const storage = client.storage.from("product-images");
  const { error: uploadError } = await storage.upload(objectPath, file, {
    contentType: file.type,
    upsert: false,
  });
  if (uploadError) {
    throw new Error(`Could not upload image: ${uploadError.message}`);
  }

  const { data: publicUrl } = storage.getPublicUrl(objectPath);
  const { data: insertedImage, error: insertError } = await client
    .from("product_images")
    .insert({
      product_id: productId,
      url: publicUrl.publicUrl,
      alt_text: altText || file.name.replace(/\.[^.]+$/, ""),
      sort_order: (lastImage?.sort_order ?? -1) + 1,
    })
    .select("*")
    .single();
  if (insertError) {
    const { error: cleanupError } = await storage.remove([objectPath]);
    if (cleanupError) {
      throw new Error(
        `Could not save image metadata: ${insertError.message}. Removing the uploaded file also failed: ${cleanupError.message}`,
      );
    }
    throw new Error(`Could not save image metadata: ${insertError.message}`);
  }
  if (!insertedImage) {
    throw new Error("Could not save image metadata.");
  }

  revalidateStorefront();
  return mapProductImage(insertedImage);
}

async function listProductImages(
  client: Awaited<ReturnType<typeof requireAdminAction>>["client"],
  productId: string,
) {
  const { data, error } = await client
    .from("product_images")
    .select("*")
    .eq("product_id", productId)
    .order("sort_order", { ascending: true });
  if (error) {
    throw new Error(`Could not load product photos: ${error.message}`);
  }
  return (data ?? []).map(mapProductImage);
}

export async function deleteProductImage(imageId: string) {
  const { client } = await requireAdminAction();
  const id = z.string().uuid().parse(imageId);

  const { data: image, error: lookupError } = await client
    .from("product_images")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (lookupError) {
    throw new Error(`Could not find the photo: ${lookupError.message}`);
  }
  if (!image) {
    throw new Error("The photo no longer exists.");
  }

  const marker = "/product-images/";
  const markerIndex = image.url.indexOf(marker);
  if (markerIndex !== -1) {
    const objectPath = image.url.slice(markerIndex + marker.length);
    const { error: storageError } = await client.storage
      .from("product-images")
      .remove([objectPath]);
    if (storageError) {
      throw new Error(`Could not remove the stored file: ${storageError.message}`);
    }
  }

  const { error } = await client.from("product_images").delete().eq("id", id);
  if (error) {
    throw new Error(`Could not delete the photo: ${error.message}`);
  }

  revalidateStorefront();
  return listProductImages(client, image.product_id);
}

export async function reorderProductImages(
  productId: string,
  orderedImageIds: string[],
) {
  const { client } = await requireAdminAction();
  const id = z.string().uuid().parse(productId);
  const ids = z.array(z.string().uuid()).min(1).parse(orderedImageIds);

  const images = await listProductImages(client, id);
  const imageIds = new Set(images.map((image) => image.id));
  if (
    ids.length !== images.length ||
    new Set(ids).size !== ids.length ||
    ids.some((imageId) => !imageIds.has(imageId))
  ) {
    throw new Error("The photo order is out of date. Refresh and try again.");
  }

  for (const [index, imageId] of ids.entries()) {
    const { error } = await client
      .from("product_images")
      .update({ sort_order: index })
      .eq("id", imageId);
    if (error) {
      throw new Error(`Could not reorder photos: ${error.message}`);
    }
  }

  revalidateStorefront();
  return listProductImages(client, id);
}

export async function updateOrderStatus(orderNumber: string, status: string) {
  const { client } = await requireAdminAction();
  const parsedOrderNumber = z.string().regex(/^SE-\d{6,}$/).parse(orderNumber);
  const parsedStatus = orderStatusSchema.parse(status);
  const { data, error } = await client
    .from("orders")
    .update({ status: parsedStatus })
    .eq("order_number", parsedOrderNumber)
    .select("order_number")
    .maybeSingle();
  if (error) {
    throw new Error(`Could not update order status: ${error.message}`);
  }
  if (!data) {
    throw new Error(`Order ${parsedOrderNumber} was not found.`);
  }
  revalidateStorefront();
}
