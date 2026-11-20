import type { PaymentProvider } from "@/lib/payments/types";

export const mockPaymentProvider: PaymentProvider = {
  async pay({ outcome }) {
    await new Promise<void>((resolve) => {
      window.setTimeout(resolve, 800);
    });

    return {
      reference: `DEMO-${Date.now()}`,
      status: outcome,
    };
  },
};
