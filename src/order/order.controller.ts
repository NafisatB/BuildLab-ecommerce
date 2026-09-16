import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiParam, ApiResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { OrderService } from './order.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CreateOrderDto } from './dto/create-order.dto';
import type { AuthenticatedRequest } from 'src/auth/types/authenticated-request';
import { request } from 'node:http';
import { UpdatedOrderStatusDto } from './dto/order-status.dto';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/common/roles.decorator';
import { UserRole } from 'generated/prisma/enums';

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

    @Patch(':id/status')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth('access-token')
    @ApiOperation({
        summary: 'Update order status',
        description:
            'Updates an order through the permitted order lifecycle. Only administrators can change order status.',
    })
    @ApiParam({
        name: 'id',
        description: 'Order UUID',
        format: 'uuid',
    })
    @ApiResponse({
        status: 200,
        description: 'Order status updated successfully',
    })
    @ApiResponse({
        status: 400,
        description: 'Invalid order ID or status',
    })
    @ApiResponse({
        status: 401,
        description: 'Authentication required',
    })
    @ApiResponse({
        status: 403,
        description:
            'Only administrators can update order status',
    })
    @ApiResponse({
        status: 404,
        description: 'Order not found',
    })
    @ApiResponse({
        status: 409,
        description: 'Invalid order status transition',
    })
    async updateStatus(@Param('id', new ParseUUIDPipe({
        version: '4'
    }))
    orderId: string,
        @Body()
        updateOrderStatusDto: UpdatedOrderStatusDto,
    ) {
        return this.orderService.updateStatus(
            orderId,
            updateOrderStatusDto.status,
        );
    }
}
