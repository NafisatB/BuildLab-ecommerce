import { Injectable, InternalServerErrorException, Logger, UnauthorizedException } from "@nestjs/common";
import { InitializePaymentInput, InitializePaymentResult, PaymentProvider, VerifyPaymentResult } from "./payment-provide.interface";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { firstValueFrom } from "rxjs";

interface PaystackInitializeResponse {
    status: boolean;
    message: string;
    data?: {
        authorization_url: string;
        access_code: string;
        reference: string
    }
}

interface PaystackVerifyResponse {
    status: boolean;
    message: string;
    data?: {
        status: string;
        reference: string;
        amount: number;
        currency: string;
        paid_at?: string;
    }
}

@Injectable()
export class PaystackService implements PaymentProvider {
    private readonly logger = new Logger(PaystackService.name);

    private readonly baseUrl: string;
    private readonly secretKey: string;

    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService
    ) {
        this.baseUrl = this.configService.get<string>('PAYSTACK_BASE_URL') ?? 'https://api.paystack.co';

        this.secretKey = this.configService.getOrThrow<string>('PAYSTACK_SECRET_KEY');
    }

    async initialize(input: InitializePaymentInput): Promise<InitializePaymentResult> {
        try {
            const response = await firstValueFrom(
                this.httpService.post<PaystackInitializeResponse>(`${this.baseUrl}/transaction/initialize`, {
                    email: input.email,
                    amount: Math.round(input.amount * 100),
                    reference: input.reference,
                    callback_url: input.callbackUrl
                }, {
                    headers: { Authorization: `Bearer ${this.secretKey}`, 'Content-Type': 'application/json' }
                })
            )

            if (!response.data.status || !response.data.data) {
                throw new InternalServerErrorException('Unable to initialize payment')
            }

            return {
                authorizationUrl: response.data.data.authorization_url, accessCode: response.data.data.access_code, reference: response.data.data.reference
            }

        } catch (error) {
            this.logger.error('Paystack payment initialization failed', error instanceof Error ? error.stack : undefined)

            throw new InternalServerErrorException('Unable to initialize payment')
        }
    }

    async verify(reference: string): Promise<VerifyPaymentResult> {
        try {
            const response = await firstValueFrom(
                this.httpService.get<PaystackVerifyResponse>(
                    `${this.baseUrl}/transaction/verify/${encodeURIComponent(reference)}`, { headers: { Authorization: `Bearer ${this.secretKey}` } }
                )
            )

            if (!response.data.data?.status || !response.data.data) {
                throw new UnauthorizedException('Payment verification failed')
            }

            return {
                status: response.data.data.status,
                reference: response.data.data.reference,
                amount: response.data.data.amount,
                currency: response.data.data.currency,
                paidAt: response.data.data.paid_at
            }

        } catch (error) {
            this.logger.error('Paystack payment verification failed', error instanceof Error ? error.stack : undefined);

            if (error instanceof UnauthorizedException) {
                throw error
            }

            throw new InternalServerErrorException('Unable to verify payment')
        }
    }
}