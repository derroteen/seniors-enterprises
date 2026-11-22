"use server";

import { z } from "zod";

import { checkoutFormSchema } from "@/lib/checkout/schema";
import { getCurrentUserId } from "@/lib/auth/session";
import { getKenyanCountyByName } from "@/lib/config/kenya-locations";
import { dataRepository } from "@/lib/data";
import type { Order } from "@/lib/data/types";

const checkoutOrderSchema = checkoutFormSchema
  .extend({
    items: z
      .array(
        z.object({
          variantId: z.string().uuid(),
          quantity: z.number().int().min(1).max(100),
        }),
      )
      .min(1)
      .max(50),
  })
  .superRefine((input, context) => {
    const variantIds = new Set<string>();
    for (const [index, item] of input.items.entries()) {
      if (variantIds.has(item.variantId)) {
        context.addIssue({
          code: "custom",
          message: "A product variant can only appear once in the cart.",
          path: ["items", index, "variantId"],
        });
      }
      variantIds.add(item.variantId);
    }
  });

const demoPaymentSchema = z.object({
  orderNumber: z.string().trim().regex(/^SE-\d{6,}$/i).transform((value) =>
    value.toUpperCase(),
  ),
  contact: z.string().trim().min(5).max(254),
  paymentReference: z.string().trim().regex(/^DEMO-\d+$/),
  outcome: z.enum(["success", "failure"]),
});

export type CheckoutOrderActionResult =
  | {
      ok: true;
      orderNumber: string;
      totalKes: number;
      mockOrder: Order | null;
    }
  | { ok: false; message: string };

export async function createCheckoutOrder(
  input: unknown,
): Promise<CheckoutOrderActionResult> {
  const parsed = checkoutOrderSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Check your checkout details." };
  }

  try {
    const { data } = parsed;
    const county = getKenyanCountyByName(data.county);
    if (!county) {
      return { ok: false, message: "Select a county from the list." };
    }

    const userId = await getCurrentUserId();
    const order = await dataRepository.createOrder({
      user_id: userId,
      customer_name: data.fullName,
      email: data.email,
      phone: data.phone,
      delivery_address: {
        county: county.name,
        county_code: county.code,
        town: data.town,
        street: data.street,
        landmark: data.landmark,
      },
      items: data.items.map((item) => ({
        variant_id: item.variantId,
        quantity: item.quantity,
      })),
    });

    return {
      ok: true,
      orderNumber: order.order_number,
      totalKes: order.total_kes,
      mockOrder:
        (process.env.NEXT_PUBLIC_DATA_SOURCE ?? "supabase") === "mock"
          ? order
          : null,
    };
  } catch (error) {
    console.error("Could not create checkout order.", error);
    return {
      ok: false,
      message: "We couldn't create your order. Please check availability and try again.",
    };
  }
}

export async function recordDemoPayment(input: unknown) {
  if (process.env.NEXT_PUBLIC_PAYMENT_MODE !== "demo") {
    return { ok: false, message: "Demo payments are disabled." };
  }
  if ((process.env.NEXT_PUBLIC_DATA_SOURCE ?? "supabase") !== "supabase") {
    return { ok: false, message: "This action is only available for Supabase orders." };
  }

  const parsed = demoPaymentSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "The demo payment details are invalid." };
  }

  try {
    const { orderNumber, contact, paymentReference, outcome } = parsed.data;
    const order = await dataRepository.getOrderByNumber(orderNumber, contact);
    if (!order) {
      return { ok: false, message: "The order could not be verified." };
    }

    const updatedOrder = await dataRepository.updateOrderPayment(orderNumber, {
      paymentReference,
      paymentStatus: outcome === "success" ? "paid" : "failed",
      status: outcome === "success" ? "paid" : "cancelled",
    });
    if (!updatedOrder) {
      return { ok: false, message: "The demo payment could not be recorded." };
    }

    return { ok: true };
  } catch (error) {
    console.error("Could not record demo payment.", error);
    return { ok: false, message: "The demo payment could not be recorded." };
  }
}
