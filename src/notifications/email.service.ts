import { Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Resend } from "resend";

@Injectable()
export class EmailService{
    private readonly logger = new Logger(EmailService.name);
    private readonly resend: Resend;
    private readonly fromEmail: string;

    constructor(private readonly configService: ConfigService){
        const apiKey = this.configService.getOrThrow<string>('RESEND_API_KEY');

        this.resend = new Resend(apiKey)
    }

    async sendPaymentSuccessEmail(input: {
        to: string;
        orderId: string;
        paymentReference: string;
        amount: string;
    }): Promise<void>{
        const {data, error} = await this.resend.emails.send({
            from: this.fromEmail,
            to: [input.to],
            subject: 'Payment successful - BuildLab',
            html: `
            <h2>Payment Successful</h2>
            <p>Your payment has been successfully received</p>
            <p><strong>Order ID:</strong>${input.orderId}</p>
            <p><strong>Payment Reference:<strong>${input.paymentReference}</p>
            <p> Thank you for your purchase</p>`
        });
        if(error){
            this.logger.error(`Failed to send payment email to ${input.to}: ${error.message}`);

            throw new InternalServerErrorException('Unable to send payment notification')
        }
        this.logger.log(`Payment success email send to ${input.to} (${data?.id ?? 'no-id'})`)
    }

}