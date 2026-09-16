import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus } from 'generated/prisma/enums';
import { DatabaseService } from 'src/database/database.service';
import { NotificationsService } from 'src/notifications/notifications.service';
import { NotificationEvent } from 'src/notifications/notification-event';

@Injectable()
export class OrderService {
    private readonly logger = new Logger(OrderService.name);

    private readonly allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
        [OrderStatus.PENDING]: [OrderStatus.FAILED, OrderStatus.CANCELLED], [OrderStatus.PAID]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED], [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED], [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED], [OrderStatus.DELIVERED]: [], [OrderStatus.FAILED]: [], [OrderStatus.CANCELLED]: []
    };

    constructor(
        private readonly database: DatabaseService,
        private readonly notificationsService: NotificationsService
    ) { }


    async create(
        userId: string,
        createOrderDto: CreateOrderDto) {
        const { items } = createOrderDto;
        this.validateDuplicateProducts(items);

        try {
            return await this.database.$transaction(async (tx) => {
                const productIds = items.map((item) => item.productId)

                const products = await tx.product.findMany({
                    where: { id: { in: productIds } }
                })

                if (products.length !== productIds.length) {
                    const foundProductIds = new Set(products.map((product) => product.id))

                    const missingProduct = productIds.find(
                        (productId) => !foundProductIds.has(productId)
                    )

                    throw new NotFoundException(`Product ${missingProduct} was not found`)
                }

                const productMap = new Map(products.map((product) => [
                    product.id, product
                ]))

                const orderItems = items.map((item) => {
                    const product = productMap.get(item.productId);

                    if (!product) {
                        throw new NotFoundException(`Product ${item.productId} was not found`)
                    }

                    if (product.stock < item.quantity) {
                        throw new ConflictException(`Insufficient stock for product "${product.name}"`)
                    }

                    const subtotal = product.price.mul(item.quantity);

                    return {
                        product,
                        quantity: item.quantity,
                        unitPrice: product.price,
                        subtotal,
                    }
                })

                const totalAmount = orderItems.reduce(
                    (total, item) => total.add(item.subtotal), orderItems[0].subtotal.mul(0))

                const order = await tx.order.create({
                    data: {
                        userId,
                        status: OrderStatus.PENDING,
                        totalAmount,
                        items: {
                            create: orderItems.map((item) => ({
                                productId: item.product.id,
                                quantity: item.quantity,
                                unitPrice: item.unitPrice,
                                subtotal: item.subtotal
                            }))
                        }
                    },
                    include: {
                        items: {
                            include: {
                                product: {
                                    select: {
                                        id: true,
                                        name: true,
                                        price: true
                                    }
                                }
                            }
                        }
                    }
                });

                for (const item of orderItems) {
                    const updatedProduct = await tx.product.updateMany({
                        where: {
                            id: item.product.id,
                            stock: { gte: item.quantity }
                        },
                        data: { stock: { decrement: item.quantity } }
                    });

                    if (updatedProduct.count !== 1) {
                        throw new ConflictException(`Insufficient stock for product "${item.product.name}"`)
                    }
                }

                return {
                    message: 'Order created successfully', order
                }
            })
        } catch (error) {
            if (error instanceof NotFoundException || error instanceof ConflictException || error instanceof BadRequestException) {
                throw error
            }
            this.logger.error('order creation failed', error instanceof Error ? error.stack : undefined)

            throw new InternalServerErrorException('Unable to create order')
        }
    }

    private validateDuplicateProducts(items: CreateOrderDto['items']): void {
        const productIds = items.map((item) => item.productId)

        const uniqueProductIds = new Set(productIds)

        if (uniqueProductIds.size !== productIds.length) {
            throw new BadRequestException('Each product can only appear once in an order')
        }
    }

    async findAll(userId: string) {
        const orders = await this.database.order.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: {
                items: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                imageUrl: true
                            }
                        }
                    }
                }
            }
        })
        return {
            orders,
        }
    }

    async findOne(orderId: string, userId: string) {
        const order = await this.database.order.findFirst({
            where: { id: orderId, userId },
            include: {
                items: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                imageUrl: true
                            }
                        }
                    }
                }
            }
        })
        if (!order) {
            throw new NotFoundException('Order not found')
        }
        return {
            order
        }
    }

    async updateStatus(orderId: string, status: OrderStatus) {
        const result = this.database.$transaction(async (tx) => {
            const order = await tx.order.findUnique({
                where: { id: orderId },
                include: {
                    user: {
                        select: {
                            email: true,
                            phoneNumber: true,
                        }
                    }
                }
            });

            if (!order) {
                throw new NotFoundException('Order not found');
            }

            const allowedStatuses = this.allowedTransitions[order.status];

            if (!allowedStatuses.includes(status)) {
                throw new ConflictException(`Order cannot transition from ${order.status} to ${status}`);
            }

            const updated = await tx.order.updateMany({
                where: {
                    id: orderId,
                    status: order.status,
                },
                data: { status },
            });

            if (updated.count !== 1) {
                throw new ConflictException('Order status changed before this update could be completed');
            }

            const updatedOrder = await tx.order.findUnique({
                where: { id: orderId },
                include: {
                    user: {
                        select: {
                            email: true,
                            phoneNumber: true,
                        }
                    },
                    items: {
                        include: {
                            product: {
                                select: {
                                    id: true,
                                    name: true,
                                    price: true,
                                },
                            },
                        },
                    },

                },
            });
            if (!updatedOrder) {
                throw new NotFoundException('Order not found')
            }

            const notificationEvent = this.getStatusNotificationEvent(status);

            if (notificationEvent) {
                await this.notificationsService.send({
                    event: notificationEvent,
                    email: updatedOrder.user.email,
                    phoneNumber: updatedOrder.user.phoneNumber,
                    orderId: updatedOrder.id
                })
            }
            return updatedOrder;


        },
        );
    }

    private getStatusNotificationEvent(
        status: OrderStatus,
    ): NotificationEvent | null {
        switch (status) {
            case OrderStatus.PROCESSING:
                return NotificationEvent.ORDER_PROCESSING;

            case OrderStatus.SHIPPED:
                return NotificationEvent.ORDER_SHIPPED;

            case OrderStatus.DELIVERED:
                return NotificationEvent.ORDER_DELIVERED;

            default:
                return null;
        }
    }
}
