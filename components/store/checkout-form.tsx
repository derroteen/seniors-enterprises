"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { useCartStore, getCartSubtotal } from "@/lib/cart-store";
import {
  createCheckoutOrder,
  recordDemoPayment,
} from "@/app/(store)/checkout/actions";
import {
  checkoutFormSchema,
  type CheckoutFormValues,
} from "@/lib/checkout/schema";
import { getDeliveryFee, KENYAN_COUNTIES } from "@/lib/config/delivery";
import { mockRepository, saveMockOrder } from "@/lib/data/mock/repository";
import type { DemoPaymentOutcome } from "@/lib/payments/types";
import { mockPaymentProvider } from "@/lib/payments/mock";
import { formatKes } from "@/lib/store-format";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";

type FieldErrors = Partial<Record<keyof CheckoutFormValues, string>>;

const initialValues: Record<keyof CheckoutFormValues, string> = {
  fullName: "",
  email: "",
  phone: "",
  county: "",
  town: "",
  street: "",
  landmark: "",
};

function getFieldErrors(
  issues: { path: PropertyKey[]; message: string }[],
): FieldErrors {
  const errors: FieldErrors = {};
  for (const issue of issues) {
    const field = issue.path[0];
    if (typeof field === "string" && field in initialValues) {
      errors[field as keyof CheckoutFormValues] ??= issue.message;
    }
  }
  return errors;
}

export function CheckoutForm() {
  const router = useRouter();
  const isDemoMode = process.env.NEXT_PUBLIC_PAYMENT_MODE === "demo";
  const isSupabaseSource =
    process.env.NEXT_PUBLIC_DATA_SOURCE === "supabase";
  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [paymentOutcome, setPaymentOutcome] =
    useState<DemoPaymentOutcome>("success");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const subtotal = getCartSubtotal(items);
  const deliveryFee = values.county ? getDeliveryFee(values.county) : 0;
  const total = subtotal + deliveryFee;

  function updateField(field: keyof CheckoutFormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFormError("");
  }

  async function submitCheckout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    if (items.length === 0) {
      setFormError("Your cart is empty. Add a product before checking out.");
      return;
    }

    const parsedValues = checkoutFormSchema.safeParse(values);
    if (!parsedValues.success) {
      setErrors(getFieldErrors(parsedValues.error.issues));
      return;
    }

    setIsSubmitting(true);

    try {
      const customer = parsedValues.data;
      const orderResult = await createCheckoutOrder({
        ...customer,
        items: items.map((item) => ({
          variantId: item.variantId,
          quantity: item.quantity,
        })),
      });
      if (!orderResult.ok) {
        throw new Error(orderResult.message);
      }

      if (orderResult.mockOrder) {
        saveMockOrder(orderResult.mockOrder);
      }

      let outcome: DemoPaymentOutcome | null = null;
      if (isDemoMode) {
        const payment = await mockPaymentProvider.pay({
          amountKes: orderResult.totalKes,
          orderNumber: orderResult.orderNumber,
          outcome: paymentOutcome,
        });
        outcome = payment.status;

        if (isSupabaseSource) {
          const updateResult = await recordDemoPayment({
            orderNumber: orderResult.orderNumber,
            contact: customer.email,
            paymentReference: payment.reference,
            outcome: payment.status,
          });
          if (!updateResult.ok) {
            throw new Error(updateResult.message);
          }
        } else {
          const updatedOrder = await mockRepository.updateOrderPayment(
            orderResult.orderNumber,
            {
              paymentReference: payment.reference,
              paymentStatus: payment.status === "success" ? "paid" : "failed",
              status: payment.status === "success" ? "paid" : "cancelled",
            },
          );
          if (!updatedOrder) {
            throw new Error("The demo order could not be updated after payment.");
          }
        }
      }

      const succeeded = !isDemoMode || outcome === "success";
      if (succeeded) {
        clearCart();
      }

      router.push(
        `/checkout/${outcome === "failure" ? "failed" : "success"}?order=${encodeURIComponent(
          orderResult.orderNumber,
        )}`,
      );
    } catch (error) {
      console.error("Demo checkout failed.", error);
      setFormError(
        error instanceof Error
          ? error.message
          : "Checkout could not be completed. Please try again.",
      );
      setIsSubmitting(false);
    }
  }

  if (items.length === 0) {
    return (
      <Section>
        <Container>
          <div className="mx-auto max-w-xl rounded-2xl border border-border bg-surface p-8 text-center">
            <h1 className="font-display text-3xl font-semibold">Your cart is empty</h1>
            <p className="mt-3 text-muted-foreground">
              Add a product before continuing to checkout.
            </p>
            <Link
              href="/shop"
              className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground"
            >
              Shop products
            </Link>
          </div>
        </Container>
      </Section>
    );
  }

  return (
    <Section>
      <Container>
        {isDemoMode ? (
          <div className="mb-7 rounded-xl border border-accent bg-accent/15 px-4 py-3 text-sm font-semibold text-foreground">
            DEMO MODE: no real payment taken
          </div>
        ) : (
          <p className="mb-7 rounded-xl border border-border bg-background px-4 py-3 text-sm text-muted-foreground">
            Online payment is not enabled yet. You can arrange payment on WhatsApp after placing your order.
          </p>
        )}
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
          <form onSubmit={submitCheckout} noValidate className="grid gap-6">
            <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
              <h1 className="font-display text-3xl font-semibold">Checkout</h1>
              <h2 className="mt-6 text-lg font-semibold">Contact details</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="grid gap-1.5 sm:col-span-2">
                  <label htmlFor="checkout-full-name" className="text-sm font-medium">
                    Full name
                  </label>
                  <input
                    id="checkout-full-name"
                    name="fullName"
                    autoComplete="name"
                    value={values.fullName}
                    onChange={(event) => updateField("fullName", event.target.value)}
                    aria-invalid={Boolean(errors.fullName)}
                    aria-describedby={errors.fullName ? "checkout-full-name-error" : undefined}
                    className="min-h-11 rounded-lg border border-border bg-background px-3 text-foreground"
                  />
                  {errors.fullName ? (
                    <p id="checkout-full-name-error" className="text-sm text-red-700 dark:text-red-300">
                      {errors.fullName}
                    </p>
                  ) : null}
                </div>

                <div className="grid gap-1.5">
                  <label htmlFor="checkout-email" className="text-sm font-medium">
                    Email address
                  </label>
                  <input
                    id="checkout-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={values.email}
                    onChange={(event) => updateField("email", event.target.value)}
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? "checkout-email-error" : undefined}
                    className="min-h-11 rounded-lg border border-border bg-background px-3 text-foreground"
                  />
                  {errors.email ? (
                    <p id="checkout-email-error" className="text-sm text-red-700 dark:text-red-300">
                      {errors.email}
                    </p>
                  ) : null}
                </div>

                <div className="grid gap-1.5">
                  <label htmlFor="checkout-phone" className="text-sm font-medium">
                    Kenyan mobile number
                  </label>
                  <input
                    id="checkout-phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="0712 345 678"
                    value={values.phone}
                    onChange={(event) => updateField("phone", event.target.value)}
                    aria-invalid={Boolean(errors.phone)}
                    aria-describedby={errors.phone ? "checkout-phone-error" : "checkout-phone-hint"}
                    className="min-h-11 rounded-lg border border-border bg-background px-3 text-foreground"
                  />
                  <p id="checkout-phone-hint" className="text-xs text-muted-foreground">
                    Use 07…, 01…, or +254…
                  </p>
                  {errors.phone ? (
                    <p id="checkout-phone-error" className="text-sm text-red-700 dark:text-red-300">
                      {errors.phone}
                    </p>
                  ) : null}
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
              <h2 className="text-lg font-semibold">Delivery address</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <label htmlFor="checkout-county" className="text-sm font-medium">
                    County
                  </label>
                  <select
                    id="checkout-county"
                    name="county"
                    autoComplete="address-level1"
                    value={values.county}
                    onChange={(event) => updateField("county", event.target.value)}
                    aria-invalid={Boolean(errors.county)}
                    aria-describedby={errors.county ? "checkout-county-error" : undefined}
                    className="min-h-11 rounded-lg border border-border bg-background px-3 text-foreground"
                  >
                    <option value="">Select county</option>
                    {KENYAN_COUNTIES.map((county) => (
                      <option key={county} value={county}>{county}</option>
                    ))}
                  </select>
                  {errors.county ? (
                    <p id="checkout-county-error" className="text-sm text-red-700 dark:text-red-300">
                      {errors.county}
                    </p>
                  ) : null}
                </div>

                <div className="grid gap-1.5">
                  <label htmlFor="checkout-town" className="text-sm font-medium">
                    Town or area
                  </label>
                  <input
                    id="checkout-town"
                    name="town"
                    autoComplete="address-level2"
                    value={values.town}
                    onChange={(event) => updateField("town", event.target.value)}
                    aria-invalid={Boolean(errors.town)}
                    aria-describedby={errors.town ? "checkout-town-error" : undefined}
                    className="min-h-11 rounded-lg border border-border bg-background px-3 text-foreground"
                  />
                  {errors.town ? (
                    <p id="checkout-town-error" className="text-sm text-red-700 dark:text-red-300">
                      {errors.town}
                    </p>
                  ) : null}
                </div>

                <div className="grid gap-1.5">
                  <label htmlFor="checkout-street" className="text-sm font-medium">
                    Street or estate
                  </label>
                  <input
                    id="checkout-street"
                    name="street"
                    autoComplete="street-address"
                    value={values.street}
                    onChange={(event) => updateField("street", event.target.value)}
                    aria-invalid={Boolean(errors.street)}
                    aria-describedby={errors.street ? "checkout-street-error" : undefined}
                    className="min-h-11 rounded-lg border border-border bg-background px-3 text-foreground"
                  />
                  {errors.street ? (
                    <p id="checkout-street-error" className="text-sm text-red-700 dark:text-red-300">
                      {errors.street}
                    </p>
                  ) : null}
                </div>

                <div className="grid gap-1.5">
                  <label htmlFor="checkout-landmark" className="text-sm font-medium">
                    Nearby landmark
                  </label>
                  <input
                    id="checkout-landmark"
                    name="landmark"
                    value={values.landmark}
                    onChange={(event) => updateField("landmark", event.target.value)}
                    aria-invalid={Boolean(errors.landmark)}
                    aria-describedby={errors.landmark ? "checkout-landmark-error" : undefined}
                    className="min-h-11 rounded-lg border border-border bg-background px-3 text-foreground"
                  />
                  {errors.landmark ? (
                    <p id="checkout-landmark-error" className="text-sm text-red-700 dark:text-red-300">
                      {errors.landmark}
                    </p>
                  ) : null}
                </div>
              </div>
            </section>

            {isDemoMode ? (
              <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
                <fieldset>
                  <legend className="text-lg font-semibold">Demo payment result</legend>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Choose a test outcome. No payment is processed.
                  </p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {(["success", "failure"] as const).map((outcome) => (
                      <label
                        key={outcome}
                        className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border px-3 text-sm ${
                          paymentOutcome === outcome
                            ? "border-primary bg-primary/10"
                            : "border-border"
                        }`}
                      >
                        <input
                          type="radio"
                          name="paymentOutcome"
                          value={outcome}
                          checked={paymentOutcome === outcome}
                          onChange={() => setPaymentOutcome(outcome)}
                          className="accent-primary"
                        />
                        Simulate {outcome}
                      </label>
                    ))}
                  </div>
                </fieldset>
              </section>
            ) : null}

            {formError ? (
              <p role="alert" className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-800 dark:text-red-200">
                {formError}
              </p>
            ) : null}

            <Button type="submit" size="lg" disabled={isSubmitting} className="w-full">
              {isSubmitting
                ? "Creating your order…"
                : `${isDemoMode ? "Place demo order" : "Place order"} · ${formatKes(total)}`}
            </Button>
          </form>

          <aside className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
            <h2 className="text-lg font-semibold">Order summary</h2>
            <ul className="mt-4 grid gap-4">
              {items.map((item) => (
                <li key={item.variantId} className="flex gap-3">
                  <span className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-background">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.productName}
                        fill
                        sizes="64px"
                        unoptimized
                        className="object-cover"
                      />
                    ) : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block line-clamp-2 text-sm font-medium">
                      {item.productName}
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {item.size} · {item.color} · Qty {item.quantity}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm font-medium">
                    {formatKes(item.unitPriceKes * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>

            <dl className="mt-5 grid gap-3 border-t border-border pt-4 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="font-medium">{formatKes(subtotal)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">
                  Delivery{values.county ? ` · ${values.county}` : ""}
                </dt>
                <dd className="font-medium">
                  {values.county ? formatKes(deliveryFee) : "Select county"}
                </dd>
              </div>
              <div className="flex justify-between gap-4 border-t border-border pt-3 text-base font-semibold">
                <dt>Total</dt>
                <dd>{formatKes(total)}</dd>
              </div>
            </dl>
          </aside>
        </div>
      </Container>
    </Section>
  );
}
