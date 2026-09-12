import { initialize } from "passport";

export interface InitializePaymentInput{
    email: string;
    amount: number;
    reference: string;
    callbackUrl?: string;
}

export interface InitializePaymentResult{
    authorizationUrl: string;
    accessCode: string;
    reference: string
}

export interface VerifyPaymentResult{
    status: string;
    reference: string;
    amount: number;
    currency: string;
    paidAt?: string
}

export interface PaymentProvider{
    initialize(input: InitializePaymentInput): Promise<InitializePaymentResult>

    verify(reference: string): Promise<VerifyPaymentResult>
}