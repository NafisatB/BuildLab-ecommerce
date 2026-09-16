import { Injectable, Logger } from '@nestjs/common';
import { EmailService } from './email.service';
import { SmsService } from './sms.service';

@Injectable()
export class NotificationsService {
    private readonly logger = new Logger(NotificationsService.name);

    constructor(
        private readonly emailService: EmailService,
        private readonly smsService: SmsService
    ) { }

    async sendPaymentSuccessNotification(input: {
        email: string;
        phoneNumber?: string | null;
        orderId: string;
        paymentReference: string;
        amount: string;
    }): Promise<void> {
        await Promise.allSettled([this.sendPaymentSuccessEmail(input), this.sendPaymentSuccessSms(input)])
    }

    private async sendPaymentSuccessEmail(input: {
        email: string;
        orderId: string;
        paymentReference: string;
        amount: string;
    }): Promise<void> {
        try {
            await this.emailService.sendPaymentSuccessEmail({
                to: input.email,
                orderId: input.orderId,
                paymentReference: input.paymentReference,
                amount: input.amount
            });
            this.logger.log(`Payment notification sent for order ${input.orderId}`)
        } catch (error) {
            this.logger.error(`Payment notification failed for order ${input.orderId}`, error instanceof Error ? error.stack : undefined)
        }
    }

    private async sendPaymentSuccessSms(input: {
        phoneNumber?: string | null;
        orderId: string;
        paymentReference: string;
        amount: string;
    }): Promise<void> {
        if (!input.phoneNumber) {
            this.logger.debug(`SMS notification skipped for order ${input.orderId}: no phone number`);
            return;
        }
        try {
            await this.smsService.sendPaymentSuccessSms({
                phoneNumber: input.phoneNumber,
                orderId: input.orderId,
                paymentReference: input.paymentReference,
                amount: input.amount
            })
        } catch (error) {
            this.logger.error(`Payment SMS notification failed for order ${input.orderId}`, error instanceof Error ? error.stack : undefined)
        }
    }

}
