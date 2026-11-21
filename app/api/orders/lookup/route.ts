import { z } from "zod";

import { dataRepository } from "@/lib/data";

const lookupSchema = z.object({
  orderNumber: z
    .string()
    .trim()
    .regex(/^SE-\d{6,}$/i)
    .transform((value) => value.toUpperCase()),
  contact: z.string().trim().min(5).max(254),
});

const rateLimitWindowMs = 60_000;
const maxAttemptsPerWindow = 5;
// This guard is per server instance; use shared storage before scaling across instances.
const attemptsByClient = new Map<string, { startedAt: number; count: number }>();

function getClientKey(request: Request) {
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) {
    return realIp;
  }

  const forwardedAddresses = request.headers
    .get("x-forwarded-for")
    ?.split(",")
    .map((address) => address.trim())
    .filter(Boolean);
  return forwardedAddresses?.at(-1) || "unknown";
}

function takeRateLimit(clientKey: string) {
  const now = Date.now();
  for (const [key, record] of attemptsByClient) {
    if (now - record.startedAt >= rateLimitWindowMs) {
      attemptsByClient.delete(key);
    }
  }

  const existing = attemptsByClient.get(clientKey);
  if (!existing) {
    attemptsByClient.set(clientKey, { startedAt: now, count: 1 });
    return { allowed: true, retryAfterSeconds: 0 };
  }
  if (existing.count >= maxAttemptsPerWindow) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((rateLimitWindowMs - (now - existing.startedAt)) / 1000),
      ),
    };
  }

  existing.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

export async function POST(request: Request) {
  const rateLimit = takeRateLimit(getClientKey(request));
  if (!rateLimit.allowed) {
    return Response.json(
      { message: "Too many lookup attempts. Please wait and try again." },
      {
        status: 429,
        headers: {
          "Cache-Control": "no-store",
          "Retry-After": String(rateLimit.retryAfterSeconds),
        },
      },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { message: "Enter a valid order number and checkout contact." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const parsed = lookupSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { message: "Enter a valid order number and checkout contact." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const order = await dataRepository.getOrderByNumber(
      parsed.data.orderNumber,
      parsed.data.contact,
    );
    if (!order) {
      return Response.json(
        { message: "The order number and contact did not match." },
        { status: 404, headers: { "Cache-Control": "no-store" } },
      );
    }

    return Response.json(
      {
        status: order.status,
        items: order.items.map((item) => ({
          product_name_snapshot: item.product_name_snapshot,
          unit_price_kes: item.unit_price_kes,
          quantity: item.quantity,
        })),
        total_kes: order.total_kes,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Order lookup failed.", error);
    return Response.json(
      { message: "Order lookup is unavailable. Please try again." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
