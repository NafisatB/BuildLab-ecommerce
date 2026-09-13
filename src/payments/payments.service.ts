import crypto from 'node:crypto';
import { ConflictException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { PaystackService } from './paystack.service';
import { ConfigService } from '@nestjs/config';
import { PaystackWebhookPayload } from './paystack-webhook';



@Injectable()
export class PaymentsService {
    private readonly logger = new Logger(PaymentsService.name)

    constructor(
        private readonly database: DatabaseService,
        private readonly paystackService: PaystackService,
        private readonly configService: ConfigService
    ) { }

    async initialize(orderId: string, userId: string) {
        const reference = `BL-${Date.now()}-${crypto.randomUUID()}`;

        let paymentId: string | undefined;
        try {
            const result = await this.database.$transaction(async (tx) => {
                const order = await tx.order.findFirst({
                    where: { id: orderId, userId },
                    include: {
                        user: { select: { email: true } },
                        payment: {
                            where: {
                                status: 'PENDING'
                            },
                            select: { id: true }
                        }
                    }
                })
                if (!order) {
                    throw new NotFoundException('Order not found')
                }

                if (order.status === 'PAID') {
                    throw new ConflictException('Payment cannot be initialized for a paid order')
                }

                if (order.payment.length > 0) {
                    throw new ConflictException('A payment is already pending for this order')
                }

                if (order.status !== 'PENDING' && order.status !== 'FAILED') {
                    throw new ConflictException(`Payment cannot be initialized for an order with status ${order.status}`)
                }

                const payment = await tx.payment.create({
                    data: {
                        orderId: order.id,
                        reference,
                        amount: order.totalAmount,
                        status: 'PENDING',
                        provider: 'PAYSTACK'
                    }
                })

                if (order.status === 'FAILED') {
                    await tx.order.update({
                        where: { id: order.id },
                        data: { status: 'PENDING' }
                    })
                }

                return {
                    paymentId: payment.id,
                    email: order.user.email,
                    amount: order.totalAmount
                }
            })

            paymentId = result.paymentId

            const payment = await this.paystackService.initialize({
                email: result.email,
                amount: Number(result.amount),
                reference
            })

            return {
                message: 'Payment initialiazed successfully',
                payment: {
                    id: paymentId,
                    reference: payment.reference,
                    amount: result.amount,
                    status: 'PENDING',
                    provider: 'PAYSTACK'
                },
                paymentUrl: payment.authorizationUrl,
                accessCode: payment.accessCode
            }
        } catch (error) {
            if (paymentId) {
                try {
                    await this.database.$transaction(async (tx) => {
                        await tx.payment.delete({
                            where: { id: paymentId }
                        })

                        const remainingPending =
                            await tx.payment.count({
                                where: {
                                    orderId,
                                    status: 'PENDING',
                                },
                            });

                        if (remainingPending === 0) {
                            await tx.order.update({
                                where: { id: orderId },
                                data: { status: 'FAILED' }
                            })
                        }
                    })

                } catch (error) {
                    this.logger.error('Failed to clean up payment initialization', error instanceof Error ? error.stack : undefined)
                }
            }

            if (error instanceof NotFoundException || error instanceof ConflictException) {
                throw error;
            }
            this.logger.error('Payment initialization failed', error instanceof Error ? error.stack : undefined)

            throw new InternalServerErrorException('Unable to initialized payment')
        }

    }

    private generateReference(): string {
        return `BL-${Date.now()}-${crypto.randomUUID()}`
    }

    async verify(reference: string, userId: string) {
        const payment = await this.database.payment.findUnique({
            where: { reference }, include: {
                order: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                email: true
                            }
                        }
                    }
                }
            }
        })

        if (!payment) {
            throw new NotFoundException('Payment not found')
        }

        if (payment.order.userId !== userId) {
            throw new NotFoundException('Payment not found')
        }
        const verification = await this.paystackService.verify(payment.reference)

        const expectedAmount = payment.amount.mul(100).toNumber()

        const receivedAmount = Math.round(verification.amount)

        if (receivedAmount !== expectedAmount) {
            await this.database.payment.update({
                where: { id: payment.id },
                data: { status: 'FAILED' }
            })

            throw new ConflictException('Payment amount does not match the order amount')
        }

        if (verification.status === 'success') {
            return this.markPaymentSuccessful(
                payment.id,
                payment.orderId,
                verification.paidAt
            )
        }

        if (['failed', 'abandoned', 'reversed'].includes(verification.status)) {
            return this.markPaymentFailed(
                payment.id,
                payment.orderId
            )
        }

        return {
            message: 'Payment is still processing',
            payment: {
                id: payment.id,
                reference: payment.reference,
                status: payment.status
            },
            order: {
                id: payment.order.id,
                status: payment.order.status
            }
        }
    }

    private async markPaymentSuccessful(
        paymentId: string,
        orderId: string,
        paidAt?: string,
    ) {
        return this.database.$transaction(async (tx) => {
            const payment = await tx.payment.findUnique({
                where: { id: paymentId },
            });

            if (!payment) {
                throw new NotFoundException('Payment not found');
            }

            if (payment.status === 'SUCCESS') {
                return {
                    message: 'Payment already verified',
                    payment,
                };
            }

            if (payment.status === 'FAILED') {
                throw new ConflictException(
                    'A failed payment cannot be marked as successful',
                );
            }

            const order = await tx.order.findUnique({
                where: { id: orderId },
            });

            if (!order) {
                throw new NotFoundException('Order not found');
            }

            if (order.status === 'PAID') {
                return {
                    message: 'Order already paid',
                    payment,
                    order,
                };
            }

            if (order.status !== 'PENDING') {
                throw new ConflictException(
                    `Order cannot be marked as paid from ${order.status} status`,
                );
            }

            const updatedPayment = await tx.payment.update({
                where: { id: paymentId },
                data: {
                    status: 'SUCCESS',
                    paidAt: paidAt ? new Date(paidAt) : new Date(),
                },
            });

            const updatedOrder = await tx.order.update({
                where: { id: orderId },
                data: {
                    status: 'PAID',
                },
            });

            return {
                message: 'Payment verified successfully',
                payment: updatedPayment,
                order: updatedOrder,
            };
        });
    }

    private async markPaymentFailed(
        paymentId: string,
        orderId: string,
    ) {
        return this.database.$transaction(async (tx) => {
            const payment = await tx.payment.findUnique({
                where: { id: paymentId },
            });

            if (!payment) {
                throw new NotFoundException('Payment not found');
            }

            if (payment.status === 'FAILED') {
                return {
                    message: 'Payment already marked as failed',
                    payment,
                };
            }

            if (payment.status === 'SUCCESS') {
                throw new ConflictException(
                    'A successful payment cannot be marked as failed',
                );
            }

            const order = await tx.order.findUnique({
                where: { id: orderId },
            });

            if (!order) {
                throw new NotFoundException('Order not found');
            }

            if (order.status === 'PAID') {
                throw new ConflictException(
                    'A paid order cannot be marked as failed',
                );
            }

            const updatedPayment = await tx.payment.update({
                where: { id: paymentId },
                data: {
                    status: 'FAILED',
                },
            });

            const updatedOrder = await tx.order.update({
                where: { id: orderId },
                data: {
                    status: 'FAILED',
                },
            });

            return {
                message: 'Payment failed',
                payment: updatedPayment,
                order: updatedOrder,
            };
        });
    }

    verifyWebhookSignature(
        rawBody: Buffer,
        signature: string,
    ): boolean {
        const secretKey =
            this.configService.getOrThrow<string>(
                'PAYSTACK_SECRET_KEY',
            );

        const expectedSignature =
            crypto
                .createHmac('sha512', secretKey)
                .update(rawBody)
                .digest('hex');

        const expectedBuffer =
            Buffer.from(expectedSignature, 'utf8');

        const receivedBuffer =
            Buffer.from(signature, 'utf8');

        if (
            expectedBuffer.length !== receivedBuffer.length
        ) {
            return false;
        }

        return crypto.timingSafeEqual(
            expectedBuffer,
            receivedBuffer,
        );
    }

    async handlePaystackWebhook(
        payload: PaystackWebhookPayload,
    ) {
        if (payload.event !== 'charge.success') {
            return {
                message: 'Event ignored',
            };
        }

        const transaction = payload.data;

        if (
            transaction.status !== 'success' ||
            !transaction.reference
        ) {
            return {
                message: 'Payment event ignored',
            };
        }

        const payment =
            await this.database.payment.findUnique({
                where: {
                    reference: transaction.reference,
                },
            });

        if (!payment) {
            this.logger.warn(
                `Webhook received for unknown payment reference: ${transaction.reference}`,
            );

            return {
                message: 'Payment reference not found',
            };
        }

        const expectedAmount =
            payment.amount.mul(100).toNumber();

        if (
            Math.round(transaction.amount) !== expectedAmount
        ) {
            this.logger.error(
                `Payment amount mismatch for ${transaction.reference}`,
            );

            await this.database.payment.update({
                where: {
                    id: payment.id,
                },
                data: {
                    status: 'FAILED',
                },
            });

            return {
                message: 'Payment amount mismatch',
            };
        }

        return this.markPaymentSuccessful(
            payment.id,
            payment.orderId,
            transaction.paid_at,
        );
    }
}
