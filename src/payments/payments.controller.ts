import { Controller, Param, ParseUUIDPipe, Post, Headers, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from 'src/auth/types/authenticated-request';
import { Request } from 'express';

@ApiTags('Payments')
@ApiBearerAuth('access-token')
@Controller('payments')
export class PaymentsController {
    constructor(
        private readonly paymentService: PaymentsService
    ) { }

    @Post('orders/:orderId/initialize')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({
        summary: 'Initialize payment for an order',
        description: 'Initializes a paystack test payment for an authenticated user order'
    })
    @ApiParam({
        name: 'orderId',
        description: 'Order UUID',
    })
    @ApiCreatedResponse({
        description: 'Payment Initialized successfully'
    })
    async initialize(@Req() request: AuthenticatedRequest, @Param('orderId', new ParseUUIDPipe({ version: '4' }))
    orderId: string) {
        return this.paymentService.initialize(
            orderId, request.user.userId
        )
    }

    @Post('verify/:reference')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({
        summary: 'Verify a Paystack payment',
        description:
            'Verifies a payment with Paystack and updates the payment and order status.',
    })
    @ApiParam({
        name: 'reference',
        description:
            'Paystack transaction reference',
    })
    async verify(
        @Req() request: AuthenticatedRequest,
        @Param('reference') reference: string,
    ) {
        return this.paymentService.verify(
            reference,
            request.user.userId,
        );
    }

    @Post('webhook/paystack')
    async handlePaystackWebhook(
        @Req() request: RawBodyRequest<Request>,
        @Headers('x-paystack-signature')
        signature: string | undefined,
    ) {
        if (!signature) {
            throw new UnauthorizedException(
                'Missing Paystack signature',
            );
        }

        if (!request.rawBody) {
            throw new UnauthorizedException(
                'Raw request body is unavailable',
            );
        }

        const isValid =
            this.paymentService.verifyWebhookSignature(
                request.rawBody,
                signature,
            );

        if (!isValid) {
            throw new UnauthorizedException(
                'Invalid Paystack signature',
            );
        }

        return this.paymentService.handlePaystackWebhook(
            request.body,
        );
    }
}
