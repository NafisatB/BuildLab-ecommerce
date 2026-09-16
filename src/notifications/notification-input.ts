import { NotificationEvent } from './notification-event';

export interface NotificationInput {
  event: NotificationEvent;
  email: string;
  phoneNumber?: string | null;
  orderId: string;
  paymentReference?: string;
  amount?: string;
}