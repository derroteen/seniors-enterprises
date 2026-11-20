"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";

import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { mockRepository } from "@/lib/data/mock/repository";
import type {
  Category,
  Order,
  OrderStatus,
  Product,
  ProductVariant,
} from "@/lib/data/types";
import {
  readMockAdminCatalog,
  writeMockAdminCatalog,
  type MockAdminCatalog,
} from "@/lib/admin/mock-catalog-storage";
import { formatKes } from "@/lib/store-format";

type AdminSection = "dashboard" | "products" | "categories" | "orders";

interface AdminDashboardProps {
  initialCatalog: MockAdminCatalog;
}

interface ProductFormValues {
  name: string;
  slug: string;
  categoryId: string;
  price: string;
  compareAtPrice: string;
  description: string;
  variants: string;
  isActive: boolean;
  isFeatured: boolean;
}

const emptyProductForm: ProductFormValues = {
  name: "",
  slug: "",
  categoryId: "",
  price: "",
  compareAtPrice: "",
  description: "",
  variants: "S,Black,5",
  isActive: true,
  isFeatured: false,
};

const orderStatuses: OrderStatus[] = [
  "pending",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
];

const sections: { id: AdminSection; label: string }[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "products", label: "Products" },
  { id: "categories", label: "Categories" },
  { id: "orders", label: "Orders" },
];

function toSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function variantsToText(variants: ProductVariant[]) {
  return variants
    .map((variant) => `${variant.size},${variant.color},${variant.stock_quantity}`)
    .join("\n");
}

function makeVariants(
  value: string,
  productId: string,
  slug: string,
): ProductVariant[] {
  const lines = value.split("\n").map((line) => line.trim()).filter(Boolean);
  if (lines.length === 0) {
    throw new Error("Add at least one size, color, and stock row.");
  }

  return lines.map((line, index) => {
    const [size, color, quantityText, extra] = line.split(",").map((part) => part.trim());
    const quantity = Number(quantityText);
    if (
      !size ||
      !color ||
      extra !== undefined ||
      !Number.isSafeInteger(quantity) ||
      quantity < 0
    ) {
      throw new Error(
        `Variant row ${index + 1} must be "size,color,stock" with a non-negative stock count.`,
      );
    }

    return {
      id: globalThis.crypto.randomUUID(),
      product_id: productId,
      size,
      color,
      sku: `${slug}-${size}-${color}`.replace(/[^a-zA-Z0-9-]/g, "-").toUpperCase(),
      stock_quantity: quantity,
      price_override_kes: null,
    };
  });
}

function getTodayOrders(orders: Order[]) {
  const today = new Date().toLocaleDateString("en-CA");
  return orders.filter(
    (order) => new Date(order.created_at).toLocaleDateString("en-CA") === today,
  );
}

export function AdminDashboard({ initialCatalog }: AdminDashboardProps) {
  const [catalog, setCatalog] = useState(initialCatalog);
  const [activeSection, setActiveSection] = useState<AdminSection>("dashboard");
  const [orders, setOrders] = useState<Order[]>([]);
  const [productForm, setProductForm] = useState(emptyProductForm);
  const [categoryName, setCategoryName] = useState("");
  const [categorySlug, setCategorySlug] = useState("");
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [expandedOrderNumber, setExpandedOrderNumber] = useState<string | null>(null);
  const [formError, setFormError] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const [orderError, setOrderError] = useState("");

  useEffect(() => {
    void Promise.resolve()
      .then(() => readMockAdminCatalog(initialCatalog))
      .then(setCatalog);
    mockRepository
      .getOrders()
      .then((savedOrders) => {
        setOrders(savedOrders.sort((first, second) =>
          second.created_at.localeCompare(first.created_at),
        ));
      })
      .catch((error: unknown) => {
        console.error("Could not load demo admin orders.", error);
        setOrderError("Demo orders could not be loaded.");
      });
  }, [initialCatalog]);

  const todayOrders = useMemo(() => getTodayOrders(orders), [orders]);
  const todayRevenue = todayOrders
    .filter((order) => order.payment_status === "paid")
    .reduce((total, order) => total + order.total_kes, 0);
  const lowStockVariants = catalog.products.flatMap((product) =>
    product.variants
      .filter((variant) => variant.stock_quantity <= 2)
      .map((variant) => ({ productName: product.name, variant })),
  );

  function saveCatalog(nextCatalog: MockAdminCatalog) {
    try {
      writeMockAdminCatalog(nextCatalog);
      setCatalog(nextCatalog);
      setFormError("");
      setFormMessage("Changes saved in this browser.");
      return true;
    } catch (error) {
      console.error("Could not save demo admin changes.", error);
      setFormError(
        error instanceof Error
          ? error.message
          : "Changes could not be saved in this browser.",
      );
      return false;
    }
  }

  function startProductEdit(product: Product) {
    setEditingProductId(product.id);
    setProductForm({
      name: product.name,
      slug: product.slug,
      categoryId: product.category_id,
      price: String(product.base_price_kes),
      compareAtPrice:
        product.compare_at_price_kes === null
          ? ""
          : String(product.compare_at_price_kes),
      description: product.description ?? "",
      variants: variantsToText(product.variants),
      isActive: product.is_active,
      isFeatured: product.is_featured,
    });
    setFormMessage("");
    setFormError("");
    setActiveSection("products");
  }

  function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    setFormMessage("");
    const category = catalog.categories.find(
      (entry) => entry.id === productForm.categoryId,
    );
    const name = productForm.name.trim();
    const slug = toSlug(productForm.slug || name);
    const price = Number(productForm.price);
    const compareAtPrice = productForm.compareAtPrice
      ? Number(productForm.compareAtPrice)
      : null;

    if (
      !category ||
      !name ||
      !slug ||
      !Number.isSafeInteger(price) ||
      price < 1 ||
      (compareAtPrice !== null &&
        (!Number.isSafeInteger(compareAtPrice) || compareAtPrice <= price))
    ) {
      setFormError(
        "Enter a product name, slug, category, whole-shilling price, and a higher compare-at price if used.",
      );
      return;
    }

    const existing = catalog.products.find(
      (product) => product.id === editingProductId,
    );
    const productId = existing?.id ?? globalThis.crypto.randomUUID();
    let variants: ProductVariant[];
    try {
      variants = makeVariants(productForm.variants, productId, slug);
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Product variants are invalid.",
      );
      return;
    }

    const now = new Date().toISOString();
    const nextProduct: Product = {
      id: productId,
      name,
      slug,
      description: productForm.description.trim() || null,
      category_id: category.id,
      base_price_kes: price,
      compare_at_price_kes: compareAtPrice,
      is_active: productForm.isActive,
      is_featured: productForm.isFeatured,
      created_at: existing?.created_at ?? now,
      updated_at: now,
      images:
        existing?.images ??
        (category.image_url
          ? [
              {
                id: globalThis.crypto.randomUUID(),
                product_id: productId,
                url: category.image_url,
                alt_text: name,
                sort_order: 0,
              },
            ]
          : []),
      variants,
    };
    const nextProducts = existing
      ? catalog.products.map((product) =>
          product.id === productId ? nextProduct : product,
        )
      : [nextProduct, ...catalog.products];
    if (
      nextProducts.some(
        (product) => product.id !== productId && product.slug === slug,
      )
    ) {
      setFormError("Another product already uses that slug.");
      return;
    }

    if (saveCatalog({ ...catalog, products: nextProducts })) {
      setProductForm(emptyProductForm);
      setEditingProductId(null);
    }
  }

  function startCategoryEdit(category: Category) {
    setEditingCategoryId(category.id);
    setCategoryName(category.name);
    setCategorySlug(category.slug);
    setFormError("");
    setFormMessage("");
  }

  function saveCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = categoryName.trim();
    const slug = toSlug(categorySlug || name);
    if (!name || !slug) {
      setFormError("Enter a category name and slug.");
      return;
    }
    if (
      catalog.categories.some(
        (category) => category.id !== editingCategoryId && category.slug === slug,
      )
    ) {
      setFormError("Another category already uses that slug.");
      return;
    }

    const existing = catalog.categories.find(
      (category) => category.id === editingCategoryId,
    );
    const nextCategory: Category = existing
      ? { ...existing, name, slug }
      : {
          id: globalThis.crypto.randomUUID(),
          name,
          slug,
          parent_id: null,
          image_url: null,
          created_at: new Date().toISOString(),
        };
    const categories = existing
      ? catalog.categories.map((category) =>
          category.id === editingCategoryId ? nextCategory : category,
        )
      : [...catalog.categories, nextCategory];
    if (saveCatalog({ ...catalog, categories })) {
      setCategoryName("");
      setCategorySlug("");
      setEditingCategoryId(null);
    }
  }

  async function changeOrderStatus(orderNumber: string, status: OrderStatus) {
    setOrderError("");
    try {
      const updatedOrder = await mockRepository.updateOrderStatus(orderNumber, status);
      if (!updatedOrder) {
        throw new Error(`Order ${orderNumber} was not found.`);
      }
      setOrders((current) =>
        current.map((order) =>
          order.order_number === orderNumber ? updatedOrder : order,
        ),
      );
    } catch (error) {
      console.error("Could not update demo order status.", error);
      setOrderError(
        error instanceof Error ? error.message : "Order status could not be changed.",
      );
    }
  }

  return (
    <Section>
      <Container>
        <div className="mb-6 rounded-xl border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-900 dark:text-red-100">
          DEMO ADMIN: not secured. Changes are mock data saved only in this browser.
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary">
              Seniors Enterprises
            </p>
            <h1 className="mt-1 font-display text-3xl font-semibold">Store admin</h1>
          </div>
          <Link href="/" className="text-sm font-medium text-primary hover:underline">
            View storefront
          </Link>
        </div>

        <nav
          aria-label="Admin sections"
          className="mt-6 flex gap-2 overflow-x-auto border-b border-border pb-3"
        >
          {sections.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => {
                setActiveSection(section.id);
                setFormError("");
                setFormMessage("");
              }}
              aria-current={activeSection === section.id ? "page" : undefined}
              className={`min-h-11 shrink-0 rounded-lg px-4 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                activeSection === section.id
                  ? "bg-primary text-primary-foreground"
                  : "border border-border hover:bg-surface"
              }`}
            >
              {section.label}
            </button>
          ))}
        </nav>

        {formMessage ? (
          <p role="status" className="mt-4 text-sm text-emerald-800 dark:text-emerald-300">
            {formMessage}
          </p>
        ) : null}
        {formError ? (
          <p role="alert" className="mt-4 text-sm text-red-800 dark:text-red-200">
            {formError}
          </p>
        ) : null}

        {activeSection === "dashboard" ? (
          <div className="mt-6 grid gap-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <MetricCard label="Today's orders" value={String(todayOrders.length)} />
              <MetricCard label="Today's paid revenue" value={formatKes(todayRevenue)} />
              <MetricCard label="Low-stock variants" value={String(lowStockVariants.length)} />
            </div>
            <section className="rounded-2xl border border-border bg-surface p-5">
              <h2 className="text-lg font-semibold">Low stock (2 or fewer)</h2>
              {lowStockVariants.length ? (
                <ul className="mt-4 grid gap-2">
                  {lowStockVariants.map(({ productName, variant }) => (
                    <li
                      key={variant.id}
                      className="flex flex-wrap justify-between gap-2 border-b border-border py-2 text-sm last:border-0"
                    >
                      <span>{productName} · {variant.size} · {variant.color}</span>
                      <span className="font-semibold">{variant.stock_quantity} left</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">
                  No variants are below the low-stock threshold.
                </p>
              )}
            </section>
          </div>
        ) : null}

        {activeSection === "products" ? (
          <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(18rem,0.8fr)_minmax(0,1.2fr)]">
            <form
              onSubmit={saveProduct}
              className="grid gap-4 rounded-2xl border border-border bg-surface p-5"
            >
              <h2 className="text-lg font-semibold">
                {editingProductId ? "Edit product" : "Create product"}
              </h2>
              <AdminField label="Product name" name="product-name">
                <input
                  id="product-name"
                  required
                  value={productForm.name}
                  onChange={(event) =>
                    setProductForm((current) => ({ ...current, name: event.target.value }))
                  }
                  className={inputClassName}
                />
              </AdminField>
              <AdminField label="Slug" name="product-slug">
                <input
                  id="product-slug"
                  value={productForm.slug}
                  onChange={(event) =>
                    setProductForm((current) => ({ ...current, slug: event.target.value }))
                  }
                  placeholder="generated-from-name"
                  className={inputClassName}
                />
              </AdminField>
              <AdminField label="Category" name="product-category">
                <select
                  id="product-category"
                  required
                  value={productForm.categoryId}
                  onChange={(event) =>
                    setProductForm((current) => ({
                      ...current,
                      categoryId: event.target.value,
                    }))
                  }
                  className={inputClassName}
                >
                  <option value="">Select category</option>
                  {catalog.categories.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </AdminField>
              <div className="grid gap-4 sm:grid-cols-2">
                <AdminField label="Price (KES)" name="product-price">
                  <input
                    id="product-price"
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={productForm.price}
                    onChange={(event) =>
                      setProductForm((current) => ({ ...current, price: event.target.value }))
                    }
                    className={inputClassName}
                  />
                </AdminField>
                <AdminField label="Was price (KES)" name="product-compare-price">
                  <input
                    id="product-compare-price"
                    type="number"
                    min="1"
                    step="1"
                    value={productForm.compareAtPrice}
                    onChange={(event) =>
                      setProductForm((current) => ({
                        ...current,
                        compareAtPrice: event.target.value,
                      }))
                    }
                    className={inputClassName}
                  />
                </AdminField>
              </div>
              <AdminField label="Description" name="product-description">
                <textarea
                  id="product-description"
                  rows={3}
                  value={productForm.description}
                  onChange={(event) =>
                    setProductForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  className={inputClassName}
                />
              </AdminField>
              <AdminField
                label="Variants (one size,color,stock row per line)"
                name="product-variants"
              >
                <textarea
                  id="product-variants"
                  required
                  rows={4}
                  value={productForm.variants}
                  onChange={(event) =>
                    setProductForm((current) => ({
                      ...current,
                      variants: event.target.value,
                    }))
                  }
                  aria-describedby="product-variants-help"
                  className={inputClassName}
                />
                <span id="product-variants-help" className="text-xs text-muted-foreground">
                  Example: M,Navy,4
                </span>
              </AdminField>
              <label className="flex min-h-10 items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={productForm.isActive}
                  onChange={(event) =>
                    setProductForm((current) => ({
                      ...current,
                      isActive: event.target.checked,
                    }))
                  }
                  className="size-4 accent-primary"
                />
                Active
              </label>
              <label className="flex min-h-10 items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={productForm.isFeatured}
                  onChange={(event) =>
                    setProductForm((current) => ({
                      ...current,
                      isFeatured: event.target.checked,
                    }))
                  }
                  className="size-4 accent-primary"
                />
                Featured
              </label>
              <div className="flex flex-wrap gap-2">
                <button type="submit" className={primaryButtonClass}>
                  {editingProductId ? "Save product" : "Create product"}
                </button>
                {editingProductId ? (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingProductId(null);
                      setProductForm(emptyProductForm);
                    }}
                    className={secondaryButtonClass}
                  >
                    Cancel edit
                  </button>
                ) : null}
              </div>
            </form>

            <section className="grid gap-3">
              <h2 className="text-lg font-semibold">
                Products <span className="text-sm font-normal text-muted-foreground">({catalog.products.length})</span>
              </h2>
              {catalog.products.map((product) => (
                <article
                  key={product.id}
                  className="flex flex-col justify-between gap-3 rounded-xl border border-border bg-surface p-4 sm:flex-row sm:items-center"
                >
                  <div>
                    <h3 className="font-semibold">{product.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatKes(product.base_price_kes)} · {product.variants.length} variants ·{" "}
                      {product.is_active ? "Active" : "Inactive"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => startProductEdit(product)}
                    className={secondaryButtonClass}
                  >
                    Edit product
                  </button>
                </article>
              ))}
            </section>
          </div>
        ) : null}

        {activeSection === "categories" ? (
          <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(18rem,0.7fr)_minmax(0,1.3fr)]">
            <form
              onSubmit={saveCategory}
              className="grid gap-4 rounded-2xl border border-border bg-surface p-5"
            >
              <h2 className="text-lg font-semibold">
                {editingCategoryId ? "Edit category" : "Create category"}
              </h2>
              <AdminField label="Category name" name="category-name">
                <input
                  id="category-name"
                  required
                  value={categoryName}
                  onChange={(event) => setCategoryName(event.target.value)}
                  className={inputClassName}
                />
              </AdminField>
              <AdminField label="Slug" name="category-slug">
                <input
                  id="category-slug"
                  value={categorySlug}
                  onChange={(event) => setCategorySlug(event.target.value)}
                  placeholder="generated-from-name"
                  className={inputClassName}
                />
              </AdminField>
              <div className="flex flex-wrap gap-2">
                <button type="submit" className={primaryButtonClass}>
                  {editingCategoryId ? "Save category" : "Create category"}
                </button>
                {editingCategoryId ? (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCategoryId(null);
                      setCategoryName("");
                      setCategorySlug("");
                    }}
                    className={secondaryButtonClass}
                  >
                    Cancel edit
                  </button>
                ) : null}
              </div>
            </form>
            <section className="grid gap-3">
              <h2 className="text-lg font-semibold">Categories ({catalog.categories.length})</h2>
              {catalog.categories.map((category) => (
                <article
                  key={category.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface p-4"
                >
                  <div>
                    <h3 className="font-semibold">{category.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">/{category.slug}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => startCategoryEdit(category)}
                    className={secondaryButtonClass}
                  >
                    Edit category
                  </button>
                </article>
              ))}
            </section>
          </div>
        ) : null}

        {activeSection === "orders" ? (
          <section className="mt-6 grid gap-4">
            <div>
              <h2 className="text-lg font-semibold">Orders ({orders.length})</h2>
              {orderError ? (
                <p role="alert" className="mt-2 text-sm text-red-800 dark:text-red-200">
                  {orderError}
                </p>
              ) : null}
            </div>
            {orders.length ? orders.map((order) => (
              <article
                key={order.order_number}
                className="rounded-xl border border-border bg-surface p-4 sm:p-5"
              >
                <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div>
                    <h3 className="font-semibold">{order.order_number} · {order.customer_name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatKes(order.total_kes)} · {new Date(order.created_at).toLocaleString()}
                    </p>
                  </div>
                  <label className="grid gap-1 text-sm">
                    <span className="font-medium">Order status</span>
                    <select
                      value={order.status}
                      onChange={(event) =>
                        void changeOrderStatus(
                          order.order_number,
                          event.target.value as OrderStatus,
                        )
                      }
                      className={inputClassName}
                    >
                      {orderStatuses.map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <details
                  open={expandedOrderNumber === order.order_number}
                  onToggle={(event) => {
                    if (event.currentTarget.open) {
                      setExpandedOrderNumber(order.order_number);
                    } else if (expandedOrderNumber === order.order_number) {
                      setExpandedOrderNumber(null);
                    }
                  }}
                  className="mt-4 border-t border-border pt-3"
                >
                  <summary className="min-h-10 cursor-pointer py-2 text-sm font-medium">
                    View order details
                  </summary>
                  <div className="grid gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <p>{order.email}</p>
                      <p>{order.phone}</p>
                      <p className="mt-2 text-muted-foreground">
                        {order.delivery_address.street}, {order.delivery_address.town},{" "}
                        {order.delivery_address.county}
                      </p>
                    </div>
                    <ul className="grid gap-2">
                      {order.items.map((item) => (
                        <li key={item.id} className="flex justify-between gap-3">
                          <span>{item.product_name_snapshot} × {item.quantity}</span>
                          <span>{formatKes(item.unit_price_kes * item.quantity)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </details>
              </article>
            )) : (
              <p className="rounded-xl border border-border bg-surface p-5 text-sm text-muted-foreground">
                No demo orders have been placed in this browser.
              </p>
            )}
          </section>
        ) : null}
      </Container>
    </Section>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-xl border border-border bg-surface p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-3xl font-semibold">{value}</p>
    </article>
  );
}

function AdminField({
  children,
  label,
  name,
}: {
  children: React.ReactNode;
  label: string;
  name: string;
}) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={name} className="text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}

const inputClassName =
  "min-h-11 w-full rounded-lg border border-border bg-background px-3 text-foreground";
const primaryButtonClass =
  "inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90";
const secondaryButtonClass =
  "inline-flex min-h-11 items-center justify-center rounded-lg border border-border px-4 text-sm font-semibold hover:bg-background";
