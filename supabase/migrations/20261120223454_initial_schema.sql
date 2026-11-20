BEGIN;

CREATE TYPE public.order_status AS ENUM (
  'pending',
  'paid',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded'
);

CREATE TYPE public.payment_status AS ENUM (
  'pending',
  'paid',
  'failed',
  'refunded'
);

CREATE TYPE public.profile_role AS ENUM ('customer', 'admin');

CREATE SEQUENCE public.order_number_seq START WITH 123 INCREMENT BY 1;

CREATE FUNCTION public.generate_order_number()
RETURNS text
LANGUAGE sql
VOLATILE
SET search_path = ''
AS $$
  SELECT
    'SE-' ||
    CASE
      WHEN sequence_value < 1000000 THEN lpad(sequence_value::text, 6, '0')
      ELSE sequence_value::text
    END
  FROM (SELECT nextval('public.order_number_seq') AS sequence_value) AS next_order;
$$;

CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  parent_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  base_price_kes integer NOT NULL CHECK (base_price_kes > 0),
  compare_at_price_kes integer CHECK (
    compare_at_price_kes IS NULL OR compare_at_price_kes >= base_price_kes
  ),
  is_active boolean NOT NULL DEFAULT false,
  is_featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  size text NOT NULL,
  color text NOT NULL,
  sku text NOT NULL UNIQUE,
  stock_quantity integer NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  price_override_kes integer CHECK (
    price_override_kes IS NULL OR price_override_kes > 0
  ),
  CONSTRAINT product_variants_product_size_color_key
    UNIQUE (product_id, size, color)
);

CREATE TABLE public.product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  url text NOT NULL,
  alt_text text,
  sort_order integer NOT NULL DEFAULT 0 CHECK (sort_order >= 0)
);

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL UNIQUE DEFAULT public.generate_order_number(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  delivery_address jsonb NOT NULL CHECK (jsonb_typeof(delivery_address) = 'object'),
  subtotal_kes integer NOT NULL CHECK (subtotal_kes >= 0),
  delivery_fee_kes integer NOT NULL DEFAULT 0 CHECK (delivery_fee_kes >= 0),
  total_kes integer NOT NULL CHECK (
    total_kes = subtotal_kes + delivery_fee_kes
  ),
  status public.order_status NOT NULL DEFAULT 'pending',
  payment_status public.payment_status NOT NULL DEFAULT 'pending',
  paystack_reference text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  variant_id uuid REFERENCES public.product_variants(id) ON DELETE SET NULL,
  product_name_snapshot text NOT NULL,
  unit_price_kes integer NOT NULL CHECK (unit_price_kes >= 0),
  quantity integer NOT NULL CHECK (quantity > 0)
);

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  phone text,
  role public.profile_role NOT NULL DEFAULT 'customer'
);

CREATE TABLE public.wishlist_items (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, product_id)
);

CREATE INDEX categories_parent_id_idx ON public.categories(parent_id);
CREATE INDEX products_category_id_idx ON public.products(category_id);
CREATE INDEX product_variants_product_id_idx ON public.product_variants(product_id);
CREATE INDEX product_images_product_sort_idx
  ON public.product_images(product_id, sort_order);
CREATE INDEX orders_status_idx ON public.orders(status);
CREATE INDEX orders_user_id_created_at_idx ON public.orders(user_id, created_at DESC);
CREATE INDEX order_items_order_id_idx ON public.order_items(order_id);
CREATE INDEX order_items_product_id_idx ON public.order_items(product_id);
CREATE INDEX wishlist_items_product_id_idx ON public.wishlist_items(product_id);

CREATE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER products_set_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'phone'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

CREATE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = (SELECT auth.uid())
      AND role = 'admin'::public.profile_role
  );
$$;

CREATE FUNCTION public.decrement_variant_stock(
  p_variant_id uuid,
  p_quantity integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RAISE EXCEPTION 'Quantity must be greater than zero'
      USING ERRCODE = '22023';
  END IF;

  UPDATE public.product_variants
  SET stock_quantity = stock_quantity - p_quantity
  WHERE id = p_variant_id
    AND stock_quantity >= p_quantity;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Variant does not exist or has insufficient stock'
      USING ERRCODE = 'P0001';
  END IF;
END;
$$;

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY categories_public_read
  ON public.categories FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY categories_admin_all
  ON public.categories FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY products_public_read_active
  ON public.products FOR SELECT TO anon, authenticated
  USING (is_active);

CREATE POLICY products_admin_all
  ON public.products FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY product_variants_public_read_active
  ON public.product_variants FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.products AS parent_product
      WHERE parent_product.id = product_variants.product_id
        AND parent_product.is_active
    )
  );

CREATE POLICY product_variants_admin_all
  ON public.product_variants FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY product_images_public_read_active
  ON public.product_images FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.products AS parent_product
      WHERE parent_product.id = product_images.product_id
        AND parent_product.is_active
    )
  );

CREATE POLICY product_images_admin_all
  ON public.product_images FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY orders_customer_read_own
  ON public.orders FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY orders_admin_read
  ON public.orders FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY order_items_customer_read_own
  ON public.order_items FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.orders AS parent_order
      WHERE parent_order.id = order_items.order_id
        AND parent_order.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY order_items_admin_read
  ON public.order_items FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY profiles_read_own
  ON public.profiles FOR SELECT TO authenticated
  USING (id = (SELECT auth.uid()));

CREATE POLICY profiles_admin_read
  ON public.profiles FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY profiles_update_own
  ON public.profiles FOR UPDATE TO authenticated
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

CREATE POLICY wishlist_items_read_own
  ON public.wishlist_items FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY wishlist_items_insert_own
  ON public.wishlist_items FOR INSERT TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.products AS active_product
      WHERE active_product.id = wishlist_items.product_id
        AND active_product.is_active
    )
  );

CREATE POLICY wishlist_items_delete_own
  ON public.wishlist_items FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

REVOKE ALL ON TABLE
  public.categories,
  public.products,
  public.product_variants,
  public.product_images,
  public.orders,
  public.order_items,
  public.profiles,
  public.wishlist_items
FROM anon, authenticated, service_role;

GRANT SELECT ON TABLE
  public.categories,
  public.products,
  public.product_variants,
  public.product_images
TO anon, authenticated;

GRANT INSERT, UPDATE, DELETE ON TABLE
  public.categories,
  public.products,
  public.product_variants,
  public.product_images
TO authenticated;

GRANT SELECT ON TABLE
  public.orders,
  public.order_items,
  public.profiles,
  public.wishlist_items
TO authenticated;

GRANT UPDATE (full_name, phone) ON TABLE public.profiles TO authenticated;
GRANT INSERT, DELETE ON TABLE public.wishlist_items TO authenticated;

GRANT ALL PRIVILEGES ON TABLE
  public.categories,
  public.products,
  public.product_variants,
  public.product_images,
  public.orders,
  public.order_items,
  public.profiles,
  public.wishlist_items
TO service_role;

REVOKE ALL ON SEQUENCE public.order_number_seq FROM PUBLIC, anon, authenticated, service_role;
GRANT USAGE, SELECT ON SEQUENCE public.order_number_seq TO service_role;

REVOKE ALL ON FUNCTION public.generate_order_number() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.generate_order_number() TO service_role;

REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated, service_role;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

REVOKE ALL ON FUNCTION public.decrement_variant_stock(uuid, integer)
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.decrement_variant_stock(uuid, integer) TO service_role;

INSERT INTO public.categories (name, slug)
VALUES
  ('Shoes', 'shoes'),
  ('Clothing', 'clothing')
ON CONFLICT (slug) DO UPDATE
SET name = EXCLUDED.name;

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
FROM (
  VALUES
    ('Classic Leather Court', 'classic-leather-court', 'A versatile leather shoe for everyday wear.', 'shoes', 6400, 7900, true),
    ('Everyday Runner', 'everyday-runner', 'A lightweight everyday running shoe.', 'shoes', 5200, 6500, false),
    ('City Loafer', 'city-loafer', 'A simple slip-on loafer with a clean finish.', 'shoes', 7200, NULL::integer, false),
    ('Soft Cotton Tee', 'soft-cotton-tee', 'A comfortable cotton tee for daily use.', 'clothing', 1400, NULL::integer, true),
    ('Everyday Hoodie', 'everyday-hoodie', 'A soft midweight layer for cooler days.', 'clothing', 3600, 4500, false),
    ('Relaxed Chino', 'relaxed-chino', 'A relaxed-fit trouser with an easy everyday shape.', 'clothing', 3200, NULL::integer, false)
) AS seed(
  name,
  slug,
  description,
  category_slug,
  base_price_kes,
  compare_at_price_kes,
  is_featured
)
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
  is_featured = EXCLUDED.is_featured;

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
  seed.size,
  seed.color,
  seed.sku,
  seed.stock_quantity,
  seed.price_override_kes
FROM (
  VALUES
    ('classic-leather-court', '38', 'Black', 'SE-1001', 5, NULL::integer),
    ('classic-leather-court', '39', 'Black', 'SE-1002', 4, NULL::integer),
    ('classic-leather-court', '40', 'Brown', 'SE-1003', 3, NULL::integer),
    ('everyday-runner', '39', 'White', 'SE-1004', 6, NULL::integer),
    ('everyday-runner', '40', 'White', 'SE-1005', 5, NULL::integer),
    ('everyday-runner', '41', 'Blue', 'SE-1006', 3, NULL::integer),
    ('city-loafer', '40', 'Brown', 'SE-1007', 4, NULL::integer),
    ('city-loafer', '41', 'Black', 'SE-1008', 2, NULL::integer),
    ('soft-cotton-tee', 'S', 'White', 'SE-1009', 10, NULL::integer),
    ('soft-cotton-tee', 'M', 'White', 'SE-1010', 8, NULL::integer),
    ('soft-cotton-tee', 'M', 'Black', 'SE-1011', 7, NULL::integer),
    ('soft-cotton-tee', 'L', 'Black', 'SE-1012', 5, NULL::integer),
    ('everyday-hoodie', 'M', 'Navy', 'SE-1013', 6, NULL::integer),
    ('everyday-hoodie', 'L', 'Navy', 'SE-1014', 4, NULL::integer),
    ('everyday-hoodie', 'L', 'Grey', 'SE-1015', 3, NULL::integer),
    ('relaxed-chino', '32', 'Khaki', 'SE-1016', 5, NULL::integer),
    ('relaxed-chino', '34', 'Khaki', 'SE-1017', 4, NULL::integer),
    ('relaxed-chino', '32', 'Navy', 'SE-1018', 3, NULL::integer)
) AS seed(product_slug, size, color, sku, stock_quantity, price_override_kes)
JOIN public.products AS product
  ON product.slug = seed.product_slug
ON CONFLICT (sku) DO NOTHING;

COMMIT;
