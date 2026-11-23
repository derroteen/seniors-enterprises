// One-time seed script for the owner's sample shoe products.
//
// Usage:
//   node scripts/seed-products.mjs                 Dry run (default, changes nothing)
//   node scripts/seed-products.mjs --confirm       Apply changes
//   node scripts/seed-products.mjs --confirm --include-optional
//   node scripts/seed-products.mjs --confirm --delete-old
//
// Reads NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from .env.local.
// Keys are never printed.

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = join(rootDir, "scripts", "seed-data", "seniors-sample-products");
const bucketName = "product-images";

// The 24 demo product slugs seeded by supabase/seed.sql. Only these (plus the
// slugs in products.json) are ever touched.
const OLD_DEMO_SLUGS = [
  "mara-everyday-sneaker",
  "kito-court-sneaker",
  "safi-knit-runner",
  "imani-leather-loafer",
  "jabari-penny-loafer",
  "zuri-suede-loafer",
  "amani-city-sandal",
  "nia-comfort-slide",
  "taji-braided-sandal",
  "baraka-trail-boot",
  "kendi-chelsea-boot",
  "mosi-desert-boot",
  "essential-cotton-tee",
  "ribbed-crew-tee",
  "weekend-pocket-tee",
  "cloud-fleece-hoodie",
  "everyday-zip-hoodie",
  "classic-straight-jean",
  "relaxed-taper-jean",
  "indigo-everyday-jean",
  "asha-day-dress",
  "nuru-shirt-dress",
  "linen-blend-shirt",
  "oxford-everyday-shirt",
];

const args = new Set(process.argv.slice(2));
const confirm = args.has("--confirm");
const includeOptional = args.has("--include-optional");
const deleteOld = args.has("--delete-old");

function loadEnvFile(path) {
  const env = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    let value = match[2];
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[match[1]] = value;
  }
  return env;
}

const env = loadEnvFile(join(rootDir, ".env.local"));
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local",
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const catalog = JSON.parse(
  readFileSync(join(dataDir, "products.json"), "utf8"),
);
const products = (catalog.products ?? []).filter(
  (product) => includeOptional || product.include_by_default !== false,
);

const failures = [];
function fail(message) {
  failures.push(message);
  console.error(`  ERROR: ${message}`);
}

async function main() {
  console.log(
    confirm
      ? "MODE: APPLYING CHANGES (--confirm)"
      : "MODE: DRY RUN (pass --confirm to write)",
  );
  console.log(
    `Products: ${products.length} from JSON` +
      `${includeOptional ? "" : " (include_by_default only; --include-optional adds the rest)"}`,
  );

  // --- Look up categories -------------------------------------------------
  const { data: categories, error: categoriesError } = await supabase
    .from("categories")
    .select("id, slug, name");
  if (categoriesError) {
    fail(`Could not load categories: ${categoriesError.message}`);
    return;
  }
  const categoryBySlug = new Map(
    (categories ?? []).map((category) => [category.slug, category]),
  );

  const newSlugs = new Set(products.map((product) => product.slug));
  for (const product of products) {
    if (!categoryBySlug.has(product.category_slug)) {
      fail(
        `Product "${product.slug}" uses unknown category "${product.category_slug}".`,
      );
    }
  }
  if (failures.length > 0) return;

  // --- Existing state -----------------------------------------------------
  const allSlugs = [...newSlugs, ...OLD_DEMO_SLUGS];
  const { data: existingProducts, error: productsError } = await supabase
    .from("products")
    .select("id, slug, is_active")
    .in("slug", allSlugs);
  if (productsError) {
    fail(`Could not load existing products: ${productsError.message}`);
    return;
  }
  const existingBySlug = new Map(
    (existingProducts ?? []).map((product) => [product.slug, product]),
  );

  const oldDemoPresent = OLD_DEMO_SLUGS.filter((slug) =>
    existingBySlug.has(slug),
  );
  const newAlreadyPresent = products.filter((product) =>
    existingBySlug.has(product.slug),
  );

  console.log("\n== Products ==");
  for (const product of products) {
    const existing = existingBySlug.get(product.slug);
    console.log(
      `  ${existing ? "update" : "create"}  ${product.slug}  ` +
        `(${product.name}, KSh ${product.price_kes}, ` +
        `${product.variants.length} variants, ${product.images.length} photos, ` +
        `category: ${product.category_slug})`,
    );
  }
  if (newAlreadyPresent.length > 0) {
    console.log(
      `  (${newAlreadyPresent.length} already exist — variants/images will be replaced cleanly)`,
    );
  }

  console.log("\n== Photos to upload ==");
  let photoCount = 0;
  for (const product of products) {
    for (const image of product.images) {
      photoCount += 1;
      console.log(
        `  products/${product.slug}/${image.file}  (alt: ${image.alt}, order ${image.sort_order})`,
      );
    }
  }
  console.log(`  ${photoCount} photo(s) total`);

  console.log("\n== Old demo products ==");
  const oldToHide = oldDemoPresent.filter((slug) => !newSlugs.has(slug));
  if (oldToHide.length === 0) {
    console.log("  None of the 24 demo slugs exist in the database.");
  } else if (deleteOld) {
    console.log(
      `  --delete-old: will try to DELETE ${oldToHide.length} product(s); ` +
        "any blocked by past orders falls back to hiding.",
    );
    for (const slug of oldToHide) console.log(`    ${slug}`);
  } else {
    console.log(
      `  Will HIDE (is_active=false), not delete, ${oldToHide.length} product(s):`,
    );
    for (const slug of oldToHide) console.log(`    ${slug}`);
    console.log(
      "  (use --delete-old to attempt deletion instead; orders are never touched)",
    );
  }

  // Products in the JSON that are NOT in the default set are skipped unless
  // --include-optional; report them so the dry run is complete.
  const skippedOptional = (catalog.products ?? []).filter(
    (product) =>
      product.include_by_default === false && !includeOptional,
  );
  if (skippedOptional.length > 0) {
    console.log("\n== Skipped (include_by_default=false) ==");
    for (const product of skippedOptional) {
      console.log(`  ${product.slug}  (use --include-optional to include)`);
    }
  }

  if (!confirm) {
    console.log(
      "\nDry run complete. Nothing was changed. Re-run with --confirm to apply.",
    );
    return;
  }

  // --- Apply ---------------------------------------------------------------
  console.log("\n== Applying ==");

  for (const product of products) {
    const category = categoryBySlug.get(product.category_slug);
    const productValues = {
      name: product.name,
      slug: product.slug,
      description: product.description ?? null,
      category_id: category.id,
      base_price_kes: product.price_kes,
      compare_at_price_kes: product.compare_at_price_kes ?? null,
      is_active: product.is_active !== false,
      is_featured: product.is_featured === true,
    };

    const existing = existingBySlug.get(product.slug);
    const saved = existing
      ? await supabase
          .from("products")
          .update(productValues)
          .eq("id", existing.id)
          .select("id")
          .single()
      : await supabase
          .from("products")
          .insert(productValues)
          .select("id")
          .single();
    if (saved.error || !saved.data) {
      fail(
        `Could not save product "${product.slug}": ${saved.error?.message ?? "no row returned"}`,
      );
      continue;
    }
    const productId = saved.data.id;
    console.log(`  saved product ${product.slug} (${productId})`);

    // Variants: upsert by (product_id, size, color), then remove leftovers.
    const desiredKeys = new Set();
    for (const variant of product.variants) {
      desiredKeys.add(`${variant.size}|${variant.color}`);
      const { error } = await supabase.from("product_variants").upsert(
        {
          product_id: productId,
          size: variant.size,
          color: variant.color,
          sku: variant.sku,
          stock_quantity: variant.stock,
          price_override_kes: null,
        },
        { onConflict: "product_id,size,color" },
      );
      if (error) {
        fail(`  variant ${variant.size}/${variant.color}: ${error.message}`);
      }
    }
    const { data: currentVariants, error: variantsReadError } =
      await supabase
        .from("product_variants")
        .select("id, size, color")
        .eq("product_id", productId);
    if (variantsReadError) {
      fail(`  could not list variants: ${variantsReadError.message}`);
    } else {
      const staleIds = (currentVariants ?? [])
        .filter(
          (variant) =>
            !desiredKeys.has(`${variant.size}|${variant.color}`),
        )
        .map((variant) => variant.id);
      if (staleIds.length > 0) {
        const { error } = await supabase
          .from("product_variants")
          .delete()
          .in("id", staleIds);
        if (error) {
          fail(`  could not remove stale variants: ${error.message}`);
        }
      }
    }

    // Photos: clear old rows + files under this slug's prefix, upload fresh.
    const { data: oldImages, error: oldImagesError } = await supabase
      .from("product_images")
      .select("url")
      .eq("product_id", productId);
    if (oldImagesError) {
      fail(`  could not list old photos: ${oldImagesError.message}`);
    } else if ((oldImages ?? []).length > 0) {
      const { error } = await supabase
        .from("product_images")
        .delete()
        .eq("product_id", productId);
      if (error) {
        fail(`  could not clear old photos: ${error.message}`);
      }
    }
    const prefix = `products/${product.slug}/`;
    const { data: oldFiles, error: listError } = await supabase.storage
      .from(bucketName)
      .list(prefix, { limit: 100 });
    if (listError) {
      fail(`  could not list old files: ${listError.message}`);
    } else if ((oldFiles ?? []).length > 0) {
      const { error } = await supabase.storage
        .from(bucketName)
        .remove(oldFiles.map((file) => `${prefix}${file.name}`));
      if (error) {
        fail(`  could not remove old files: ${error.message}`);
      }
    }

    for (const image of product.images) {
      const filePath = `${prefix}${image.file}`;
      const bytes = readFileSync(join(dataDir, "images", image.file));
      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, bytes, {
          contentType: "image/jpeg",
          upsert: true,
        });
      if (uploadError) {
        fail(`  photo ${image.file}: ${uploadError.message}`);
        continue;
      }
      const { data: publicUrl } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);
      const { error: imageError } = await supabase
        .from("product_images")
        .insert({
          product_id: productId,
          url: publicUrl.publicUrl,
          alt_text: image.alt,
          sort_order: image.sort_order,
        });
      if (imageError) {
        fail(`  photo row ${image.file}: ${imageError.message}`);
      }
    }
    console.log(
      `  photos: ${product.images.length} uploaded under ${prefix}`,
    );
  }

  // --- Old demo products ---------------------------------------------------
  console.log("\n== Old demo products ==");
  const targets = oldToHide.filter((slug) => !newSlugs.has(slug));
  if (targets.length === 0) {
    console.log("  Nothing to do.");
  } else if (deleteOld) {
    for (const slug of targets) {
      const existing = existingBySlug.get(slug);
      if (!existing) continue;
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", existing.id);
      if (error) {
        // Past orders reference the product (order_items.product_id is
        // ON DELETE RESTRICT). Fall back to hiding it.
        const { error: hideError } = await supabase
          .from("products")
          .update({ is_active: false })
          .eq("id", existing.id);
        if (hideError) {
          fail(`  ${slug}: delete failed (${error.message}) and hide failed (${hideError.message})`);
        } else {
          console.log(
            `  ${slug}: delete blocked by past orders — hid it instead.`,
          );
        }
      } else {
        console.log(`  ${slug}: deleted.`);
      }
    }
  } else {
    const ids = targets
      .map((slug) => existingBySlug.get(slug)?.id)
      .filter(Boolean);
    if (ids.length > 0) {
      const { error } = await supabase
        .from("products")
        .update({ is_active: false })
        .in("id", ids);
      if (error) {
        fail(`  could not hide demo products: ${error.message}`);
      } else {
        console.log(`  Hid ${ids.length} demo product(s) (is_active=false).`);
      }
    }
  }

  console.log(
    failures.length === 0
      ? "\nDone. No errors."
      : `\nFinished with ${failures.length} error(s).`,
  );
  if (failures.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(`Seed failed: ${error?.message ?? error}`);
  process.exit(1);
});
