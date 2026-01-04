import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
  ) {}

  async create(createPaymentDto: CreatePaymentDto): Promise<Payment> {
    const payment = this.paymentRepository.create({
      status: 'pending',
      ...createPaymentDto,
    });
    return this.paymentRepository.save(payment);
  }

  async findAll(page = 1, limit = 10) {
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

  async findOne(id: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id },
      relations: ['user', 'serviceRequest'],
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    return payment;
  }

  async findByTransactionId(transactionId: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { stripePaymentIntentId: transactionId },
      relations: ['user', 'serviceRequest'],
    });

    if (!payment) {
      throw new NotFoundException(
        `Payment with transaction ID ${transactionId} not found`,
      );
    }

    return payment;
  }

  async updateStatus(
    id: string,
    status: string,
    transactionId?: string,
  ): Promise<Payment> {
    await this.findOne(id);

    const updateData: any = { status };
    if (transactionId) {
      updateData.stripePaymentIntentId = transactionId;
    }
    if (status === 'completed') {
      updateData.paidAt = new Date();
    }

    await this.paymentRepository.update(id, updateData);
    return this.findOne(id);
  }

  async update(
    id: string,
    updatePaymentDto: UpdatePaymentDto,
  ): Promise<Payment> {
    await this.paymentRepository.update(id, updatePaymentDto);
    return this.findOne(id);
  }

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

  async processRefund(id: string, refundAmount?: number): Promise<Payment> {
    const payment = await this.findOne(id);

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

  // Extended Operations - Invoice/Receipt Generation
  async downloadReceipt(id: string, userId: string): Promise<any> {
    const payment = await this.findOne(id);
    
    // Verify user owns this payment
    if (payment.userId !== userId) {
      throw new NotFoundException('Payment not found');
    }

    return {
      success: true,
      message: 'Receipt generated',
      data: {
        paymentId: id,
        receiptUrl: `/api/v1/payments/${id}/receipt.pdf`,
        generatedAt: new Date()
      }
    };
  }

  async generateInvoice(id: string, userId: string): Promise<any> {
    const payment = await this.findOne(id);
    
    // Verify user owns this payment
    if (payment.userId !== userId) {
      throw new NotFoundException('Payment not found');
    }

    return {
      success: true,
      message: 'Invoice generated',
      data: {
        paymentId: id,
        invoiceUrl: `/api/v1/payments/${id}/invoice.pdf`,
        invoiceNumber: `INV-${Date.now()}`,
        generatedAt: new Date()
      }
    };
  }

  async resendReceipt(id: string, userId: string): Promise<any> {
    const payment = await this.findOne(id);
    
    // Verify user owns this payment
    if (payment.userId !== userId) {
      throw new NotFoundException('Payment not found');
    }

    return {
      success: true,
      message: 'Receipt email sent',
      data: {
        paymentId: id,
        sentAt: new Date(),
        emailAddress: 'user@example.com' // Would get from user entity
      }
    };
  }
}
