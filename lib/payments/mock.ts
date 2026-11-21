import type { PaymentProvider } from "@/lib/payments/types";

export const mockPaymentProvider: PaymentProvider = {
  async pay({ outcome }) {
    if (process.env.NEXT_PUBLIC_PAYMENT_MODE !== "demo") {
      throw new Error("The mock payment provider is only available in demo mode.");
    }

    if (typeof window === "undefined") {
      throw new Error("The mock payment provider can only run in a browser.");
    }

    await new Promise<void>((resolve) => {
      window.setTimeout(resolve, 800);
    });

    return {
      reference: `DEMO-${Date.now()}`,
      status: outcome,
    };
  },
};
