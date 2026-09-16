import { Injectable, Logger } from '@nestjs/common';
import { EmailService } from './email.service';
import { SmsService } from './sms.service';
import { NotificationInput } from './notification-input';

@Injectable()
export class NotificationsService {
    private readonly logger = new Logger(NotificationsService.name);

    constructor(
        private readonly emailService: EmailService,
        private readonly smsService: SmsService
    ) { }

    async send(input: NotificationInput):Promise<void> {
        await Promise.allSettled([this.sendEmail(input), this.sendSms(input)])
    }

    private async sendEmail(input: NotificationInput): Promise<void> {
        try {
            await this.emailService.sendOrderNotificationEmail({
                to: input.email,
                event: input.event,
                orderId: input.orderId,
                paymentReference: input.paymentReference,
                amount: input.amount
            });
            this.logger.log(`Email notification sent for order ${input.orderId}`)
        } catch (error) {
            this.logger.error(`Email notification failed for order ${input.orderId}`, error instanceof Error ? error.stack : undefined)
        }
    }

    private async sendSms(input: NotificationInput): Promise<void> {
        if (!input.phoneNumber) {
            this.logger.debug(`SMS notification skipped for order ${input.orderId}: no phone number`);
            return;
        }
        try {
            await this.smsService.sendOrderNotificationSms({
                phoneNumber: input.phoneNumber,
                event: input.event,
                orderId: input.orderId,
                paymentReference: input.paymentReference,
                amount: input.amount
            })
        } catch (error) {
            this.logger.error(`SMS notification failed for order ${input.orderId}`, error instanceof Error ? error.stack : undefined)
        }
    }

}
