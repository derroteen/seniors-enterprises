# Supabase setup

The original schema migration already exists at
[`../supabase/migrations/20261120223454_initial_schema.sql`](../supabase/migrations/20261120223454_initial_schema.sql).
This setup reuses it and adds
[`../supabase/migrations/20261121110000_secure_access_and_storage.sql`](../supabase/migrations/20261121110000_secure_access_and_storage.sql)
after it. Do not rename the earlier migration or add a new `0001_init.sql`: it
would sort before the existing migration and try to create the same tables.

## 1. Create or open a Supabase project

1. Sign in to the Supabase dashboard and create a project, or open your existing
   development project.
2. Select **SQL Editor** in the project menu.
3. Keep the two migration files in version order. They define the catalog,
   profiles, orders, order items, RLS policies, stock function, and image bucket.

## 2. Run the migrations

Run each migration once, in this order:

1. Open `supabase/migrations/20261120223454_initial_schema.sql` in the
   repository. Copy its full contents into a new SQL Editor query and run it.
2. Open `supabase/migrations/20261121110000_secure_access_and_storage.sql`.
   Copy its full contents into a separate SQL Editor query and run it.

The first migration creates the schema, sequence-based `SE-000123` order
numbers, indexes, profile trigger, and initial RLS policies. The second tightens
catalog visibility, removes browser access to orders and order items, limits
profile updates, and creates the public-read `product-images` bucket with
admin-only uploads, updates, and deletes.

Public categories are those with at least one active product. Public product,
variant, and image reads are limited to active products. Orders and order items
have no browser read or write grants; server code must use the Supabase service
role for those operations.

## 3. Add development catalog data

For a fresh development project, paste the full contents of
`supabase/seed.sql` into a new SQL Editor query and run it after both migrations.
It seeds the same 24 products, variants, stock values, prices, and local
placeholder image paths used by `lib/data/mock/products.ts`. It also marks the
six older sample products from the initial migration inactive so the public
catalog contains the 24 mock products.

**This is test data. Never run `supabase/seed.sql` in production once real
products exist.** The seed updates products and variants with matching slugs and
variants, and replaces the placeholder images for those 24 mock products.

## 4. Create the first admin user

1. In the Supabase dashboard, open **Authentication → Users**.
2. Choose **Add user** and create the account you will use as the first admin.
   The database trigger automatically creates a `customer` profile for a new
   Auth user.
3. In **SQL Editor**, replace the email below with that account's exact email
   and run this one SQL statement:

   ```sql
   UPDATE public.profiles SET role = 'admin' WHERE id = (SELECT id FROM auth.users WHERE email = 'your-admin@example.com');
   ```

Run this promotion as the project owner in SQL Editor, not as the signed-in
customer. Normal users can update only their own `full_name` and `phone`; they
cannot change `role`. The `is_admin()` helper reads the role from `profiles`
when an admin-only policy is checked.

## 5. Verify the setup

- The `product-images` bucket is public for reads. Only authenticated users
  whose profile role is `admin` can write to it.
- The shop can read active catalog data and its category and image records.
- Browser clients cannot select or mutate `orders` or `order_items`.
- A newly created Auth user has a profile with the default `customer` role.
- After promotion, the admin can manage catalog rows and product-image files.

Do not paste a service-role key into browser code. Use it only in trusted
server-side code when the backend order flow is connected.
