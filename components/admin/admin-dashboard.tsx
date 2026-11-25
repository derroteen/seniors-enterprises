"use client";

import Link from "next/link";
import { useMemo, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import {
  deleteProduct as deleteProductAction,
  logoutAdmin,
  saveCategory as saveCategoryAction,
  updateOrderStatus as updateOrderStatusAction,
} from "@/app/admin/actions";
import { LowStockPanel } from "@/components/admin/low-stock-panel";
import { ProductForm } from "@/components/admin/product-form";
import { ProductsPanel } from "@/components/admin/products-panel";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { SubmitButton } from "@/components/ui/submit-button";
import { StatusBadge, StatusMessage } from "@/components/ui/status-message";
import type { Category, Order, OrderStatus, Product } from "@/lib/data/types";
import { formatKes } from "@/lib/store-format";

interface AdminCatalog {
  categories: Category[];
  products: Product[];
}

interface AdminDashboardProps {
  initialCatalog: AdminCatalog;
  initialOrders: AdminOrder[];
}

type AdminOrder = Pick<
  Order,
  | "id"
  | "order_number"
  | "customer_name"
  | "email"
  | "phone"
  | "delivery_address"
  | "subtotal_kes"
  | "delivery_fee_kes"
  | "total_kes"
  | "status"
  | "payment_status"
  | "created_at"
  | "items"
>;

const orderStatuses: OrderStatus[] = [
  "pending",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
];

const sections = [
  { id: "dashboard", label: "Dashboard" },
  { id: "products", label: "Products" },
  { id: "categories", label: "Categories" },
  { id: "orders", label: "Orders" },
] as const;

type AdminSection = (typeof sections)[number]["id"];

function toSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function getTodayOrders(orders: AdminOrder[]) {
  const dateInKenya = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Nairobi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const today = dateInKenya.format(new Date());
  return orders.filter(
    (order) => dateInKenya.format(new Date(order.created_at)) === today,
  );
}

function showError(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function AdminDashboard({
  initialCatalog,
  initialOrders,
}: AdminDashboardProps) {
  const router = useRouter();
  const catalog = initialCatalog;
  const orders = initialOrders;
  const [activeSection, setActiveSection] = useState<AdminSection>("dashboard");
  const [categoryName, setCategoryName] = useState("");
  const [categorySlug, setCategorySlug] = useState("");
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  // Snapshot of a just-saved product. It stays valid only until the refreshed
  // catalog arrives (catalog.products changes identity), then the fresh server
  // data takes over automatically.
  const [editingSnapshot, setEditingSnapshot] = useState<{
    product: Product;
    productsRef: Product[];
  } | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [expandedOrderNumber, setExpandedOrderNumber] = useState<string | null>(null);
  const [formError, setFormError] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const [orderError, setOrderError] = useState("");
  const [isPending, startTransition] = useTransition();
  const [savingCategory, setSavingCategory] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [updatingOrderNumber, setUpdatingOrderNumber] = useState<string | null>(null);

  const todayOrders = useMemo(() => getTodayOrders(orders), [orders]);
  const todayRevenue = todayOrders
    .filter((order) => order.payment_status === "paid")
    .reduce((total, order) => total + order.total_kes, 0);
  const lowStockVariants = catalog.products.flatMap((product) =>
    product.variants
      .filter((variant) => variant.stock_quantity <= 2)
      .map((variant) => ({ productName: product.name, variant })),
  );

  const editingProduct =
    editingSnapshot && editingSnapshot.productsRef === catalog.products
      ? editingSnapshot.product
      : (catalog.products.find((product) => product.id === editingProductId) ??
        null);

  function startProductEdit(product: Product) {
    setEditingProductId(product.id);
    setEditingSnapshot(null);
    setFormMessage("");
    setFormError("");
    setActiveSection("products");
  }

  function handleProductSaved(product: Product, warnings: string[]) {
    setEditingProductId(product.id);
    setEditingSnapshot({ product, productsRef: catalog.products });
    setFormError("");
    setFormMessage(warnings[0] ?? "Product saved.");
    router.refresh();
  }

  function cancelProductEdit() {
    setEditingProductId(null);
    setEditingSnapshot(null);
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

    setSavingCategory(true);
    startTransition(async () => {
      try {
        await saveCategoryAction({
          id: editingCategoryId,
          name,
          slug,
        });
        setCategoryName("");
        setCategorySlug("");
        setEditingCategoryId(null);
        setFormError("");
        setFormMessage("Category saved.");
        router.refresh();
      } catch (error) {
        setFormError(showError(error, "Category could not be saved."));
      } finally {
        setSavingCategory(false);
      }
    });
  }

  function removeProduct(product: Product) {
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) {
      return;
    }

    setDeletingProductId(product.id);
    startTransition(async () => {
      try {
        await deleteProductAction(product.id);
        if (editingProduct?.id === product.id) {
          cancelProductEdit();
        }
        setFormError("");
        setFormMessage("Product deleted.");
        router.refresh();
      } catch (error) {
        setFormError(showError(error, "Product could not be deleted."));
      } finally {
        setDeletingProductId(null);
      }
    });
  }

  function changeOrderStatus(orderNumber: string, status: OrderStatus) {
    setOrderError("");
    setUpdatingOrderNumber(orderNumber);
    startTransition(async () => {
      try {
        await updateOrderStatusAction(orderNumber, status);
        router.refresh();
      } catch (error) {
        setOrderError(showError(error, "Order status could not be changed."));
        router.refresh();
      } finally {
        setUpdatingOrderNumber(null);
      }
    });
  }

  return (
    <Section>
      <Container>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary">
              Seniors Enterprises
            </p>
            <h1 className="mt-1 font-display text-3xl font-semibold">Store admin</h1>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/" className="text-sm font-medium text-primary hover:underline">
              View storefront
            </Link>
            <form action={logoutAdmin}>
              <SubmitButton pendingLabel="Logging out…" className={secondaryButtonClass}>
                Log out
              </SubmitButton>
            </form>
          </div>
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
          <StatusMessage tone="success" className="mt-4">
            {formMessage}
          </StatusMessage>
        ) : null}
        {formError ? (
          <StatusMessage tone="danger" className="mt-4">
            {formError}
          </StatusMessage>
        ) : null}

        {activeSection === "dashboard" ? (
          <div className="mt-6 grid gap-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <MetricCard label="Today's orders" value={String(todayOrders.length)} />
              <MetricCard label="Today's paid revenue" value={formatKes(todayRevenue)} />
              <MetricCard label="Low-stock variants" value={String(lowStockVariants.length)} />
            </div>
            <LowStockPanel
              products={catalog.products}
              categories={catalog.categories}
              onEditProduct={startProductEdit}
            />
          </div>
        ) : null}

        {activeSection === "products" ? (
          <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(18rem,0.8fr)]">
            <ProductForm
              categories={catalog.categories}
              product={editingProduct}
              onSaved={handleProductSaved}
              onCancel={cancelProductEdit}
            />

            <ProductsPanel
              products={catalog.products}
              categories={catalog.categories}
              isPending={isPending}
              deletingProductId={deletingProductId}
              onEditProduct={startProductEdit}
              onDeleteProduct={removeProduct}
            />
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
                <SubmitButton
                  pending={savingCategory}
                  pendingLabel="Saving…"
                  disabled={isPending}
                  className={primaryButtonClass}
                >
                  {editingCategoryId ? "Save category" : "Create category"}
                </SubmitButton>
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
                <StatusMessage tone="danger" className="mt-2">
                  {orderError}
                </StatusMessage>
              ) : null}
            </div>
            {orders.length ? orders.map((order) => (
              <article
                key={order.order_number}
                className="rounded-xl border border-border bg-surface p-4 sm:p-5"
              >
                <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{order.order_number} · {order.customer_name}</h3>
                      <StatusBadge status={order.status} />
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatKes(order.total_kes)} · {new Date(order.created_at).toLocaleString()}
                    </p>
                  </div>
                  <label className="grid gap-1 text-sm">
                    <span className="font-medium">Order status</span>
                    <select
                      value={order.status}
                      disabled={isPending}
                      onChange={(event) => {
                        const nextStatus = orderStatuses.find(
                          (status) => status === event.target.value,
                        );
                        if (nextStatus) {
                          changeOrderStatus(order.order_number, nextStatus);
                        }
                      }}
                      className={inputClassName}
                    >
                      {orderStatuses.map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                    {updatingOrderNumber === order.order_number ? (
                      <span className="text-xs text-muted-foreground">Updating…</span>
                    ) : null}
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
                        {order.delivery_address.county}. Landmark: {order.delivery_address.landmark}
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
                No orders have been placed yet.
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
  "inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:bg-muted-bg disabled:text-muted-foreground disabled:opacity-100";
const secondaryButtonClass =
  "inline-flex min-h-11 items-center justify-center rounded-lg border border-border px-4 text-sm font-semibold hover:bg-background disabled:cursor-not-allowed disabled:bg-muted-bg disabled:text-muted-foreground disabled:opacity-100";
