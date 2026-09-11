import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { CreateOrderDto } from './dto/dto';
import { OrderStatus } from 'generated/prisma/enums';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class OrderService {
    private readonly logger = new Logger(OrderService.name);

    constructor(private readonly database: DatabaseService) { }


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
        if(!order){
            throw new NotFoundException('Order not found')
        }
        return{
            order
        }
    }
}
