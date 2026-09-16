import { HttpService } from "@nestjs/axios";
import { Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { channel } from "diagnostics_channel";
import { firstValueFrom } from "rxjs";

interface TermiiSendResponse{
    code?: string;
    message?: string;
    balance?: number;
    message_id?: string;
    user?: string;
}

@Injectable()
export class SmsService{
    private readonly logger = new Logger(SmsService.name);
    private readonly apiKey: string;
    private readonly baseUrl: string;
    private readonly senderId: string;

    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService
    ){
        this.apiKey = this.configService.getOrThrow<string>('TERMII_API_KEY');

        this.baseUrl = this.configService.get<string>('TERMII_BASE_URL') ?? 'https://api.ng.termii.com';

        this.senderId = this.configService.getOrThrow<string>('TERMII_SENDER_ID')
    }

    async sendPaymentSuccessSms(input: {
        phoneNumber: string;
        orderId: string;
        paymentReference: string;
        amount: string
    }): Promise<void>{
        const message = `BuildLab: Payment Successful` + `Order ${input.amount}` + `Ref: ${input.paymentReference}`;

        try {
            const response = await firstValueFrom(this.httpService.post<TermiiSendResponse>(`${this.baseUrl}/api/sms/send`, {
                api_key: this.apiKey,
                to: input.phoneNumber,
                from: this.senderId,
                sms: message,
                type: 'plain',
                channel: 'generic'
            }, {
                headers: {"Content-Type": "application/json"}
            }));

            const result = response.data;

            if(result.code !== undefined && result.code !== 'ok'){
                throw new Error(result.message ?? 'Termii rejected the SMS request')
            }

            this.logger.log(`Payment success, SMS sent to ${input.phoneNumber}`)
        } catch (error) {
            this.logger.error(`Failed to send payment SMS to ${input.phoneNumber}`, error instanceof Error? error.stack: undefined);
            throw new InternalServerErrorException('Unable to send SMS notification')
        }
    }
}