import { Controller, Param, ParseUUIDPipe, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from 'src/auth/types/authenticated-request';

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
}
