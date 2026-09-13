export interface PaystackWebhookTransaction {
  id: number;
  status: string;
  reference: string;
  amount: number;
  currency: string;
  paid_at?: string;
}

export interface PaystackWebhookPayload {
  event: string;
  data: PaystackWebhookTransaction;
}