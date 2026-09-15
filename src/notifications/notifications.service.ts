import { Injectable, Logger } from '@nestjs/common';
import { EmailService } from './email.service';

@Injectable()
export class NotificationsService {
    private readonly logger = new Logger(NotificationsService.name);

    constructor(private readonly emailService: EmailService){}

    async sendPaymentSuccessNotification(input: {
        email: string;
        orderId: string;
        paymentReference: string;
        amount: string;
    }): Promise<void>{
        try {
            await this.emailService.sendPaymentSuccessEmail({
                to: input.email,
                orderId: input.orderId,
                paymentReference: input.paymentReference,
                amount: input.amount
            });
            this.logger.log(`Payment notification sent for order ${input.orderId}`)
        } catch (error) {
            this.logger.error(`Payment notification failed for order ${input.orderId}`, error instanceof Error? error.stack: undefined)
        }
    }
}
