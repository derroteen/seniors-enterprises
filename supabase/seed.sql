-- TEST DATA ONLY. Do not run this in production once real products exist.
-- These rows mirror lib/data/mock/products.ts for development and QA.
BEGIN;

CREATE TEMP TABLE _seniors_mock_product_seed (
  product_index integer PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text NOT NULL,
  category_slug text NOT NULL,
  base_price_kes integer NOT NULL,
  compare_at_price_kes integer,
  is_featured boolean NOT NULL,
  image_kind text NOT NULL,
  colors text[] NOT NULL
) ON COMMIT DROP;

INSERT INTO _seniors_mock_product_seed (
  product_index,
  name,
  slug,
  description,
  category_slug,
  base_price_kes,
  compare_at_price_kes,
  is_featured,
  image_kind,
  colors
)
VALUES
  (1, 'Mara Everyday Sneaker', 'mara-everyday-sneaker', 'A lightweight everyday sneaker with a cushioned sole and clean profile.', 'shoes', 5200, 6400, true, 'sneaker', ARRAY['Cloud White', 'Navy', 'Stone']),
  (2, 'Kito Court Sneaker', 'kito-court-sneaker', 'A versatile court-inspired pair designed for all-day comfort.', 'shoes', 4800, NULL, false, 'sneaker', ARRAY['White', 'Forest', 'Black']),
  (3, 'Safi Knit Runner', 'safi-knit-runner', 'Breathable knit uppers and a supportive sole for active days.', 'shoes', 6100, 7200, false, 'sneaker', ARRAY['Charcoal', 'Blue', 'Sand']),
  (4, 'Imani Leather Loafer', 'imani-leather-loafer', 'A polished leather loafer that moves easily from work to weekend.', 'shoes', 7400, NULL, true, 'loafer', ARRAY['Cognac', 'Black']),
  (5, 'Jabari Penny Loafer', 'jabari-penny-loafer', 'A classic penny detail with a flexible, comfortable construction.', 'shoes', 7900, 9200, false, 'loafer', ARRAY['Dark Brown', 'Black', 'Burgundy']),
  (6, 'Zuri Suede Loafer', 'zuri-suede-loafer', 'Soft suede texture and a refined silhouette for everyday dressing.', 'shoes', 6800, NULL, false, 'loafer', ARRAY['Taupe', 'Navy']),
  (7, 'Amani City Sandal', 'amani-city-sandal', 'A supportive, easy-to-wear sandal with adjustable straps.', 'shoes', 3400, 4100, true, 'sandal', ARRAY['Tan', 'Black', 'Olive']),
  (8, 'Nia Comfort Slide', 'nia-comfort-slide', 'A soft contoured footbed makes this slide a daily favorite.', 'shoes', 2200, NULL, false, 'sandal', ARRAY['Cream', 'Rose', 'Black']),
  (9, 'Taji Braided Sandal', 'taji-braided-sandal', 'An understated braided upper paired with a cushioned footbed.', 'shoes', 3900, NULL, false, 'sandal', ARRAY['Natural', 'Cocoa']),
  (10, 'Baraka Trail Boot', 'baraka-trail-boot', 'A sturdy, weather-ready boot with dependable traction.', 'shoes', 8600, 9900, false, 'boot', ARRAY['Dark Brown', 'Black']),
  (11, 'Kendi Chelsea Boot', 'kendi-chelsea-boot', 'A clean Chelsea shape with elastic side panels and a comfortable fit.', 'shoes', 9100, NULL, true, 'boot', ARRAY['Black', 'Chestnut', 'Taupe']),
  (12, 'Mosi Desert Boot', 'mosi-desert-boot', 'A relaxed suede desert boot with a flexible crepe-style sole.', 'shoes', 7800, 8500, false, 'boot', ARRAY['Sand', 'Olive']),
  (13, 'Essential Cotton Tee', 'essential-cotton-tee', 'A soft, breathable cotton tee with a reliable everyday fit.', 'clothing', 1500, NULL, true, 'tee', ARRAY['White', 'Navy', 'Black']),
  (14, 'Ribbed Crew Tee', 'ribbed-crew-tee', 'A ribbed crew-neck tee with a neat, easy-to-layer profile.', 'clothing', 1800, 2200, false, 'tee', ARRAY['Ivory', 'Sage']),
  (15, 'Weekend Pocket Tee', 'weekend-pocket-tee', 'A relaxed cotton tee finished with a subtle chest pocket.', 'clothing', 1700, NULL, false, 'tee', ARRAY['Stone', 'Blue', 'White']),
  (16, 'Cloud Fleece Hoodie', 'cloud-fleece-hoodie', 'A soft fleece layer with a roomy hood and practical front pocket.', 'clothing', 3900, 4600, true, 'hoodie', ARRAY['Heather Grey', 'Navy', 'Forest']),
  (17, 'Everyday Zip Hoodie', 'everyday-zip-hoodie', 'An easy zip-through hoodie for comfortable layering.', 'clothing', 4400, NULL, false, 'hoodie', ARRAY['Charcoal', 'Oat']),
  (18, 'Classic Straight Jean', 'classic-straight-jean', 'A versatile straight-leg jean in durable, comfortable denim.', 'clothing', 4200, NULL, false, 'jeans', ARRAY['Indigo', 'Washed Black']),
  (19, 'Relaxed Taper Jean', 'relaxed-taper-jean', 'A relaxed fit through the leg with a clean tapered finish.', 'clothing', 4500, 5200, true, 'jeans', ARRAY['Mid Blue', 'Deep Indigo', 'Black']),
  (20, 'Indigo Everyday Jean', 'indigo-everyday-jean', 'An easy everyday jean made for comfort and repeat wear.', 'clothing', 3900, NULL, false, 'jeans', ARRAY['Indigo', 'Light Wash']),
  (21, 'Asha Day Dress', 'asha-day-dress', 'A breathable day dress with a softly defined waist and easy drape.', 'clothing', 3600, 4300, true, 'dress', ARRAY['Navy Floral', 'Terracotta']),
  (22, 'Nuru Shirt Dress', 'nuru-shirt-dress', 'A versatile shirt dress with a relaxed shape and useful side pockets.', 'clothing', 4100, NULL, false, 'dress', ARRAY['Olive', 'Blue Stripe', 'Sand']),
  (23, 'Linen Blend Shirt', 'linen-blend-shirt', 'A breathable linen-blend shirt with a clean button-front finish.', 'clothing', 3200, NULL, true, 'shirt', ARRAY['White', 'Sky Blue', 'Stone']),
  (24, 'Oxford Everyday Shirt', 'oxford-everyday-shirt', 'A versatile Oxford shirt with a comfortable, polished everyday fit.', 'clothing', 3500, 4200, false, 'shirt', ARRAY['White', 'Blue', 'Soft Pink']);

INSERT INTO public.categories (name, slug, image_url)
VALUES
  ('Shoes', 'shoes', '/placeholders/shoes.svg'),
  ('Clothing', 'clothing', '/placeholders/clothing.svg')
ON CONFLICT (slug) DO UPDATE
SET
  name = EXCLUDED.name,
  image_url = EXCLUDED.image_url;

INSERT INTO public.products (
  name,
  slug,
  description,
  category_id,
  base_price_kes,
  compare_at_price_kes,
  is_active,
  is_featured
)
SELECT
  seed.name,
  seed.slug,
  seed.description,
  category.id,
  seed.base_price_kes,
  seed.compare_at_price_kes,
  true,
  seed.is_featured
FROM _seniors_mock_product_seed AS seed
JOIN public.categories AS category
  ON category.slug = seed.category_slug
ON CONFLICT (slug) DO UPDATE
SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category_id = EXCLUDED.category_id,
  base_price_kes = EXCLUDED.base_price_kes,
  compare_at_price_kes = EXCLUDED.compare_at_price_kes,
  is_active = EXCLUDED.is_active,
  is_featured = EXCLUDED.is_featured,
  updated_at = now();

WITH variant_rows AS (
  SELECT
    seed.product_index,
    seed.slug,
    seed.base_price_kes,
    sizes.size,
    sizes.size_ordinal,
    colors.color,
    colors.color_ordinal,
    row_number() OVER (
      PARTITION BY seed.product_index
      ORDER BY sizes.size_ordinal, colors.color_ordinal
    )::integer AS variant_index
  FROM _seniors_mock_product_seed AS seed
  CROSS JOIN LATERAL unnest(
    CASE
      WHEN seed.category_slug = 'shoes'
        THEN ARRAY['38', '39', '40', '41', '42', '43', '44', '45']::text[]
      ELSE ARRAY['S', 'M', 'L', 'XL', 'XXL']::text[]
    END
  ) WITH ORDINALITY AS sizes(size, size_ordinal)
  CROSS JOIN LATERAL unnest(seed.colors)
    WITH ORDINALITY AS colors(color, color_ordinal)
),
variant_stock AS (
  SELECT
    variant_rows.*,
    (
      product_index
      + size_ordinal
      + color_ordinal
      - 2
    )::integer AS stock_key
  FROM variant_rows
)
INSERT INTO public.product_variants (
  product_id,
  size,
  color,
  sku,
  stock_quantity,
  price_override_kes
)
SELECT
  product.id,
  variant_stock.size,
  variant_stock.color,
  'SE-MOCK-' || lpad(
    (variant_stock.product_index * 100 + variant_stock.variant_index)::text,
    4,
    '0'
  ),
  CASE
    WHEN variant_stock.stock_key % 9 = 0 THEN 0
    ELSE 2 + (variant_stock.stock_key % 8)
  END,
  CASE
    WHEN variant_stock.stock_key % 13 = 0
      THEN variant_stock.base_price_kes + 300
    ELSE NULL
  END
FROM variant_stock
JOIN public.products AS product
  ON product.slug = variant_stock.slug
ON CONFLICT (product_id, size, color) DO UPDATE
SET
  sku = EXCLUDED.sku,
  stock_quantity = EXCLUDED.stock_quantity,
  price_override_kes = EXCLUDED.price_override_kes;

-- The earlier schema migration seeded six different examples. Hide them so
-- the active development catalog matches the 24 mock products exactly.
UPDATE public.products
SET is_active = false
WHERE slug IN (
  'classic-leather-court',
  'everyday-runner',
  'city-loafer',
  'soft-cotton-tee',
  'everyday-hoodie',
  'relaxed-chino'
);

DELETE FROM public.product_images AS image
USING public.products AS product
WHERE image.product_id = product.id
  AND product.slug IN (
    SELECT slug
    FROM _seniors_mock_product_seed
  );

INSERT INTO public.product_images (
  product_id,
  url,
  alt_text,
  sort_order
)
SELECT
  product.id,
  '/placeholders/' || seed.image_kind || '.svg',
  seed.name || ' product placeholder',
  0
FROM _seniors_mock_product_seed AS seed
JOIN public.products AS product
  ON product.slug = seed.slug;

COMMIT;
