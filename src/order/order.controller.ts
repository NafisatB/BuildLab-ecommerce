import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { OrderService } from './order.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CreateOrderDto } from './dto/dto';
import type { AuthenticatedRequest } from 'src/auth/types/authenticated-request';
import { request } from 'node:http';

@ApiTags('Orders')
@ApiBearerAuth('access-token')
@Controller('orders')
export class OrderController {
    constructor(private readonly orderService: OrderService) { }

    @Post()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({
        summary: 'Create an order',
    })
    @ApiCreatedResponse({
        description: 'Order created successfully'
    })
    @ApiUnauthorizedResponse({
        description: 'Authentication is required or the access token is invalid'
    })
    async create(
        @Req() request: AuthenticatedRequest,
        @Body() createOrderDto: CreateOrderDto) {
        return this.orderService.create(request.user.userId, createOrderDto)
    }

    @Get()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Get authenticated user order history' })
    @ApiOkResponse({ description: 'Order history retrieved successfully' })
    async findAll(@Req() request: AuthenticatedRequest) {
        return this.orderService.findAll(request.user.userId)
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Get an order by ID' })
    @ApiParam({ name: 'id', description: 'Order UUID' })
    @ApiOkResponse({ description: 'Order retrieved successfully' })
    async findOne(@Req() request: AuthenticatedRequest, @Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
        return this.orderService.findOne(id, request.user.userId)
    }
}
