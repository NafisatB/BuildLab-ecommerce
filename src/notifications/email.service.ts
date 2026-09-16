import { Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Resend } from "resend";
import { NotificationEvent } from "./notification-event";

@Injectable()
export class EmailService{
    private readonly logger = new Logger(EmailService.name);
    private readonly resend: Resend;
    private readonly fromEmail: string;

    constructor(private readonly configService: ConfigService){
        const apiKey = this.configService.getOrThrow<string>('RESEND_API_KEY');

        this.fromEmail = this.configService.getOrThrow<string>('RESEND_FROM_EMAIL')

        this.resend = new Resend(apiKey)
    }

    async sendOrderNotificationEmail(input: {
        to: string;
        event: NotificationEvent;
        orderId: string;
        paymentReference?: string;
        amount?: string;
    }): Promise<void>{
         const content =this.buildEmailContent(input);

        const {data, error} = await this.resend.emails.send({
            from: this.fromEmail,
            to: [input.to],
            subject: content.subject,
             html: content.html
             });
       
        if(error){
            this.logger.error(`Resend rejected email: ${error.message}`);

            throw new InternalServerErrorException('Unable to send email notification')
        }
        this.logger.log(`Order notification email sent to ${input.to} (${data?.id ?? 'no-id'})`)
    }

    private buildEmailContent(input: {
    event: NotificationEvent;
    orderId: string;
    paymentReference?: string;
    amount?: string;
  }) {
    switch (input.event) {
      case NotificationEvent.PAYMENT_SUCCESS:
        return {
          subject:
            'Payment successful - BuildLab',
          html: `
            <h2>Payment Successful</h2>

            <p>
              Your payment has been successfully received.
            </p>

            <p>
              <strong>Order ID:</strong>
              ${input.orderId}
            </p>

            <p>
              <strong>Payment Reference:</strong>
              ${input.paymentReference ?? 'N/A'}
            </p>

            <p>
              <strong>Amount:</strong>
              ₦${input.amount ?? 'N/A'}
            </p>

            <p>
              Thank you for your purchase.
            </p>
          `,
        };

      case NotificationEvent.ORDER_PROCESSING:
        return {
          subject:
            'Your BuildLab order is being processed',
          html: `
            <h2>Order Processing</h2>

            <p>
              Your order is now being processed.
            </p>

            <p>
              <strong>Order ID:</strong>
              ${input.orderId}
            </p>
          `,
        };

      case NotificationEvent.ORDER_SHIPPED:
        return {
          subject:
            'Your BuildLab order has shipped',
          html: `
            <h2>Order Shipped</h2>

            <p>
              Your order has been shipped.
            </p>

            <p>
              <strong>Order ID:</strong>
              ${input.orderId}
            </p>
          `,
        };

      case NotificationEvent.ORDER_DELIVERED:
        return {
          subject:
            'Your BuildLab order has been delivered',
          html: `
            <h2>Order Delivered</h2>

            <p>
              Your order has been marked as delivered.
            </p>

            <p>
              <strong>Order ID:</strong>
              ${input.orderId}
            </p>
          `,
        };
    }
  }

}