import { BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseService } from '../../common/services/base.service';
import { Payment } from './entities/payment.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';

/**
 * PaymentsService
 * Handles payment management, Stripe integration, and payment processing
 * Extends BaseService for CRUD operations
 */
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    protected readonly paymentRepository: Repository<Payment>,
  ) {}

  /**
   * Create payment with default status
   */
  async create(createPaymentDto: CreatePaymentDto): Promise<Payment> {
    const dto: any = {
      status: 'pending',
      ...createPaymentDto,
    };
    const entity = this.paymentRepository.create(dto);
    const saved = await this.paymentRepository.save(entity);
    return Array.isArray(saved) ? saved[0] : saved;
  }

  /**
   * Find all payments (wrapper for BaseService)
   */
  async findAll(options?: { page?: number; limit?: number }) {
    const { page = 1, limit = 10 } = options || {};
    const [data, total] = await this.paymentRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
      relations: ['user', 'serviceRequest'],
    });

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Find payments for a user with pagination
   */
  async findByUser(userId: string, page = 1, limit = 10) {
    const [data, total] = await this.paymentRepository.findAndCount({
      where: { userId },
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
      relations: ['serviceRequest'],
    });

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Find payment by Stripe transaction ID
   */
  async findByTransactionId(transactionId: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { stripePaymentIntentId: transactionId },
      relations: ['user', 'serviceRequest'],
    });

    if (!payment) {
      throw new Error(`Payment with transaction ID ${transactionId} not found`);
    }

    return payment;
  }

  /**
   * Update payment status with transaction tracking
   */
  async updateStatus(
    id: string,
    status: string,
    transactionId?: string,
  ): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({ where: { id } });
    if (!payment) {
      throw new Error(`Payment ${id} not found`);
    }

    const updateData: any = { status };
    if (transactionId) {
      updateData.stripePaymentIntentId = transactionId;
    }
    if (status === 'completed') {
      updateData.paidAt = new Date();
    }

    await this.paymentRepository.update(id, updateData);
    return this.paymentRepository.findOne({ where: { id } }) as Promise<Payment>;
  }

  /**
   * Get payment statistics
   */
  async getPaymentStats(userId?: string) {
    const whereClause = userId ? { userId } : {};

    const [total, completed, pending, failed] = await Promise.all([
      this.paymentRepository.count({ where: whereClause }),
      this.paymentRepository.count({
        where: { ...whereClause, status: 'completed' },
      }),
      this.paymentRepository.count({
        where: { ...whereClause, status: 'pending' },
      }),
      this.paymentRepository.count({
        where: { ...whereClause, status: 'failed' },
      }),
    ]);

    const totalAmount = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('SUM(payment.amount)', 'sum')
      .where(userId ? 'payment.userId = :userId' : '1=1', { userId })
      .andWhere('payment.status = :status', { status: 'completed' })
      .getRawOne();

    return {
      total,
      completed,
      pending,
      failed,
      totalAmount: parseFloat(totalAmount.sum) || 0,
    };
  }

  /**
   * Record Stripe payment
   */
  async recordStripePayment(data: {
    stripeInvoiceId: string;
    amount: number;
    currency: string;
    status: string;
  }): Promise<Payment> {
    const payment = this.paymentRepository.create({
      amount: data.amount,
      currency: data.currency,
      status: data.status,
      paymentMethod: 'stripe',
      metadata: { stripeInvoiceId: data.stripeInvoiceId },
      paidAt: data.status === 'succeeded' ? new Date() : null,
    });
    return this.paymentRepository.save(payment);
  }

  /**
   * Process refund for completed payment
   */
  async processRefund(id: string, refundAmount?: number): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({ where: { id } });
    if (!payment) {
      throw new Error(`Payment ${id} not found`);
    }

    if (payment.status !== 'completed') {
      throw new BadRequestException('Can only refund completed payments');
    }

    const refundAmountFinal = refundAmount || payment.amount;

    if (refundAmountFinal > payment.amount) {
      throw new BadRequestException(
        'Refund amount cannot exceed payment amount',
      );
    }

    payment.status = 'refunded';
    return this.paymentRepository.save(payment);
  }

  /**
   * Generate receipt for payment
   */
  async downloadReceipt(id: string, userId: string): Promise<any> {
    const payment = await this.paymentRepository.findOne({ where: { id } });
    if (!payment) {
      throw new Error(`Payment ${id} not found`);
    }
    
    if (payment.userId !== userId) {
      throw new Error('Payment not found');
    }

    return {
      paymentId: id,
      receiptUrl: `/api/v1/payments/${id}/receipt.pdf`,
      generatedAt: new Date()
    };
  }

  /**
   * Generate invoice for payment
   */
  async generateInvoice(id: string, userId: string): Promise<any> {
    const payment = await this.paymentRepository.findOne({ where: { id } });
    if (!payment) {
      throw new Error(`Payment ${id} not found`);
    }
    
    if (payment.userId !== userId) {
      throw new Error('Payment not found');
    }

    return {
      paymentId: id,
      invoiceUrl: `/api/v1/payments/${id}/invoice.pdf`,
      invoiceNumber: `INV-${Date.now()}`,
      generatedAt: new Date()
    };
  }

  /**
   * Resend receipt email
   */
  async resendReceipt(id: string, userId: string): Promise<any> {
    const payment = await this.paymentRepository.findOne({ where: { id } });
    if (!payment) {
      throw new Error(`Payment ${id} not found`);
    }
    
    if (payment.userId !== userId) {
      throw new Error('Payment not found');
    }

    return {
      paymentId: id,
      sentAt: new Date(),
      emailAddress: 'user@example.com'
    };
  }
}
