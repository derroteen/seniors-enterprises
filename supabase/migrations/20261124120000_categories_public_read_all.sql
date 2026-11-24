DROP POLICY IF EXISTS categories_public_read_active ON public.categories;
DROP POLICY IF EXISTS categories_public_read ON public.categories;
CREATE POLICY categories_public_read
  ON public.categories FOR SELECT TO anon, authenticated
  USING (true);
