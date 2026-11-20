export type DemoPaymentOutcome = "success" | "failure";

export interface PaymentRequest {
  amountKes: number;
  outcome: DemoPaymentOutcome;
  orderNumber: string;
}

export interface PaymentResult {
  reference: string;
  status: DemoPaymentOutcome;
}

export interface PaymentProvider {
  pay(request: PaymentRequest): Promise<PaymentResult>;
}
