import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { OrderService } from './order.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CreateOrderDto } from './dto/dto';
import type { AuthenticatedRequest } from 'src/auth/types/authenticated-request';

@ApiTags('Orders')
@ApiBearerAuth('access-token')
@Controller('orders')
export class OrderController {
    constructor(private readonly orderService: OrderService){}

    @Post()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({
        summary: 'Create an order',
        description: 'Creates an order for the authenticated customer using the supplied products and quantities'
    })
    @ApiCreatedResponse({
        description: 'Order created successfully'
    })
    @ApiUnauthorizedResponse({
        description: 'Authentication is required or the access token is invalid'
    })
    async create(
        @Req() request: AuthenticatedRequest,
        @Body() createOrderDto: CreateOrderDto){
        return this.orderService.create(request.user.userId, createOrderDto)
    }
}
