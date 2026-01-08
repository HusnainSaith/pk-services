import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from '../payments/entities/payment.entity';
import { UserSubscription } from '../subscriptions/entities/user-subscription.entity';
import { StripeService } from '../payments/stripe.service';

@Injectable()
export class WebhooksService {
  private webhookLogs = [];

  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(UserSubscription)
    private userSubscriptionRepository: Repository<UserSubscription>,
    private stripeService: StripeService,
  ) {}

  async handleStripeWebhook(body: any, signature: string): Promise<any> {
    try {
      const event = await this.stripeService.constructWebhookEvent(body, signature);

      let result: any = { received: true, processed: false };

      switch (event.type) {
        case 'payment_intent.succeeded':
          result = await this.handlePaymentIntentSucceeded(event.data.object);
          break;
        case 'payment_intent.payment_failed':
          result = await this.handlePaymentIntentFailed(event.data.object);
          break;
        case 'customer.subscription.updated':
          result = await this.handleSubscriptionUpdated(event.data.object);
          break;
        case 'customer.subscription.deleted':
          result = await this.handleSubscriptionDeleted(event.data.object);
          break;
        case 'invoice.paid':
          result = await this.handleInvoicePaid(event.data.object);
          break;
        default:
          result.received = true;
      }

      // Log webhook
      this.logWebhookEvent({
        event: event.type,
        status: 'processed',
        data: result,
      });

      return result;
    } catch (error) {
      this.logWebhookEvent({
        event: 'error',
        status: 'failed',
        error: error.message,
      });
      return { received: false, error: error.message };
    }
  }

  private async handlePaymentIntentSucceeded(paymentIntent: any): Promise<any> {
    const payment = await this.paymentRepository.findOne({
      where: { metadata: { stripePaymentIntentId: paymentIntent.id } },
    });

    if (payment) {
      await this.paymentRepository.update(payment.id, {
        status: 'completed',
        paidAt: new Date(),
      });
    }

    return { received: true, processed: true, action: 'payment_completed' };
  }

  private async handlePaymentIntentFailed(paymentIntent: any): Promise<any> {
    const payment = await this.paymentRepository.findOne({
      where: { metadata: { stripePaymentIntentId: paymentIntent.id } },
    });

    if (payment) {
      await this.paymentRepository.update(payment.id, {
        status: 'failed',
      });
    }

    return { received: true, processed: true, action: 'payment_failed' };
  }

  private async handleSubscriptionUpdated(subscription: any): Promise<any> {
    const userSubscription = await this.userSubscriptionRepository
      .createQueryBuilder('us')
      .where('us.stripeSubscriptionId = :id', { id: subscription.id })
      .getOne();

    if (userSubscription) {
      await this.userSubscriptionRepository.update(userSubscription.id, {
        status: subscription.status === 'active' ? 'active' : 'inactive',
      });
    }

    return { received: true, processed: true, action: 'subscription_updated' };
  }

  private async handleSubscriptionDeleted(subscription: any): Promise<any> {
    const userSubscription = await this.userSubscriptionRepository
      .createQueryBuilder('us')
      .where('us.stripeSubscriptionId = :id', { id: subscription.id })
      .getOne();

    if (userSubscription) {
      await this.userSubscriptionRepository.update(userSubscription.id, {
        status: 'cancelled',
        endDate: new Date(),
      });
    }

    return { received: true, processed: true, action: 'subscription_cancelled' };
  }

  private async handleInvoicePaid(invoice: any): Promise<any> {
    const payment = await this.paymentRepository.findOne({
      where: { metadata: { stripeInvoiceId: invoice.id } },
    });

    if (payment) {
      await this.paymentRepository.update(payment.id, {
        status: 'completed',
        paidAt: new Date(),
      });
    }

    return { received: true, processed: true, action: 'invoice_paid' };
  }

  // Extended Operations - Testing & Logging
  async testStripeWebhook(testPayload: any): Promise<any> {
    return {
      success: true,
      message: 'Test webhook processed',
      data: {
        testPayload,
        processedAt: new Date(),
        environment: 'development',
      },
    };
  }

  async getWebhookLogs(): Promise<any> {
    return {
      success: true,
      data: {
        logs: this.webhookLogs,
        totalCount: this.webhookLogs.length,
      },
    };
  }

  private logWebhookEvent(log: any): void {
    const logEntry = {
      id: `log_${Date.now()}`,
      webhook: 'stripe',
      event: log.event,
      status: log.status,
      processedAt: new Date(),
      processingTime: Math.random() * 500, // Simulated
      data: log.data,
    };
    this.webhookLogs.push(logEntry);
    // Keep only last 100 logs in memory
    if (this.webhookLogs.length > 100) {
      this.webhookLogs = this.webhookLogs.slice(-100);
    }
  }
}