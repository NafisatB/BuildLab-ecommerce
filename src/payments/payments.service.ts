import crypto from 'node:crypto';
import { ConflictException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { PaystackService } from './paystack.service';


@Injectable()
export class PaymentsService {
    private readonly logger = new Logger(PaymentsService.name)

    constructor(
        private readonly database: DatabaseService,
        private readonly paystackService: PaystackService
    ) { }

    async initialize(orderId: string, userId: string) {
        const order = await this.database.order.findFirst({
            where: {
                id: orderId, userId
            },
            include: { user: { select: { email: true } }, payment: true },

        })
        if (!order) {
            throw new NotFoundException('Order not found')
        }
        if (order.status !== 'PENDING') {
            throw new ConflictException('Payment can only be initialized for a pending order')
        }
        if (order.payment) {
            throw new ConflictException('Payment has already been initialized for this order')
        }

        const reference = this.generateReference()

        try {
            const payment = await this.database.payment.create({
                data: {
                    orderId: order.id,
                    reference,
                    amount: order.totalAmount,
                    status: 'PENDING',
                    provider: 'PAYSTACK'
                }
            })

            try {
                const paymentResult = await this.paystackService.initialize({
                    email: order.user.email,
                    amount: Number(order.totalAmount),
                    reference: payment.reference
                })

                return {
                    message: 'Payment initialized successfully',
                    payment: {
                        id: payment.id,
                        reference: payment.reference,
                        amount: payment.amount,
                        status: payment.status,
                        provider: payment.provider
                    },
                    paymentUrl: paymentResult.authorizationUrl,
                    accessCode: paymentResult.accessCode
                }
            } catch (error) {
                await this.database.payment.delete({
                    where: {
                        id: payment.id
                    }
                })

                throw error
            }
        } catch (error) {
            if (error instanceof ConflictException || error instanceof NotFoundException) {
                throw error
            }

            this.logger.error(
                'Payment initialization failed', error instanceof Error ? error.stack : undefined
            )

            throw new InternalServerErrorException('Unable to initialize payment')
        }

    }

    private generateReference(): string {
        return `BL-${Date.now()}-${crypto.randomUUID()}`
    }
}
