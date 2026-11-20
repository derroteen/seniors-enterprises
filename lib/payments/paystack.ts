import type { PaymentProvider } from "@/lib/payments/types";

export const paystackPaymentProvider: PaymentProvider = {
  async pay() {
    throw new Error(
      "Not implemented yet: connect Paystack in the backend phase.",
    );
  },
};
