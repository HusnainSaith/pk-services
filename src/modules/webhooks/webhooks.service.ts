import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from '../payments/entities/payment.entity';
import { UserSubscription } from '../subscriptions/entities/user-subscription.entity';
import { StripeService } from '../payments/stripe.service';
import { InvoiceService } from '../payments/invoice.service';
import { NotificationsService } from '../notifications/notifications.service';
import { User } from '../users/entities/user.entity';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);
  private webhookLogs = [];

  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(UserSubscription)
    private userSubscriptionRepository: Repository<UserSubscription>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private stripeService: StripeService,
    private invoiceService: InvoiceService,
    private notificationsService: NotificationsService,
  ) {}

  async handleStripeWebhook(body: any, signature: string): Promise<any> {
    try {
      const event = await this.stripeService.constructWebhookEvent(
        body,
        signature,
      );

      this.logger.log('Received webhook event: ' + event.type);
      this.logger.log('Webhook signature verified successfully');

      let result: any = { received: true, processed: false };

      switch (event.type) {
        case 'checkout.session.completed':
          result = await this.handleCheckoutSessionCompleted(event.data.object);
          break;
        case 'payment_intent.succeeded':
          result = await this.handlePaymentIntentSucceeded(event.data.object);
          break;
        case 'payment_intent.payment_failed':
          result = await this.handlePaymentIntentFailed(event.data.object);
          break;
        case 'customer.subscription.created':
          result = await this.handleSubscriptionCreated(event.data.object);
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
        case 'invoice.payment_failed':
          result = await this.handleInvoicePaymentFailed(event.data.object);
          break;
        default:
          this.logger.log('Unhandled webhook event type: ' + event.type);
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
      this.logger.error('Webhook processing error: ' + error.message);
      this.logWebhookEvent({
        event: 'error',
        status: 'failed',
        error: error.message,
      });
      return { received: false, error: error.message };
    }
  }

  /**
   * Handle checkout.session.completed event
   * This is triggered when a user completes the Stripe Checkout payment
   */
  private async handleCheckoutSessionCompleted(session: any): Promise<any> {
    try {
      this.logger.log('Processing checkout session: ' + session.id);

      // Get subscription ID from session metadata or subscription field
      const userId = session.metadata?.userId || session.client_reference_id;
      // const subscriptionPlanName = session.metadata?.subscriptionPlan;

      if (!userId) {
        this.logger.error('No userId found in checkout session metadata');
        return { received: true, processed: false, error: 'Missing userId' };
      }

      // Find the pending subscription for this user
      this.logger.log('Looking for pending subscription for user: ' + userId);
      
      const userSubscription = await this.userSubscriptionRepository.findOne({
        where: {
          userId,
          status: 'pending',
        },
        relations: ['user', 'plan'],
        order: { createdAt: 'DESC' },
      });

      if (!userSubscription) {
        this.logger.error('No pending subscription found for user ' + userId);
        
        // Check if there are any subscriptions for this user
        const allSubs = await this.userSubscriptionRepository.find({
          where: { userId },
          order: { createdAt: 'DESC' },
        });
        this.logger.log('Total subscriptions for user: ' + allSubs.length);
        if (allSubs.length > 0) {
          this.logger.log('Latest subscription status: ' + allSubs[0].status);
        }
        
        return {
          received: true,
          processed: false,
          error: 'Subscription not found',
        };
      }

      this.logger.log('Found pending subscription: ' + userSubscription.id);

      // Update subscription status to active
      userSubscription.status = 'active';
      userSubscription.stripeSubscriptionId = session.subscription as string;
      userSubscription.startDate = new Date();

      // Calculate end date based on billing period
      const endDate = new Date();
      if (userSubscription.billingCycle === 'monthly') {
        endDate.setMonth(endDate.getMonth() + 1);
      } else if (userSubscription.billingCycle === 'annual') {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }
      userSubscription.endDate = endDate;

      const savedSubscription = await this.userSubscriptionRepository.save(userSubscription);

      this.logger.log('Subscription activated for user: ' + userId);
      this.logger.log('Updated subscription ID: ' + savedSubscription.id);
      this.logger.log('Updated subscription status: ' + savedSubscription.status);
      this.logger.log('Stripe subscription ID: ' + savedSubscription.stripeSubscriptionId);

      // Create payment record
      const payment = this.paymentRepository.create({
        userId,
        subscriptionId: userSubscription.id,
        amount: session.amount_total / 100, // Convert from cents
        currency: session.currency.toUpperCase(),
        status: 'completed',
        stripePaymentIntentId: session.payment_intent as string,
        description:
          'Subscription: ' +
          userSubscription.plan.name +
          ' (' +
          userSubscription.billingCycle +
          ')',
        paidAt: new Date(),
        metadata: {
          checkoutSessionId: session.id,
          stripeCustomerId: session.customer as string,
          subscriptionPlan: userSubscription.plan.name,
        },
      });

      const savedPayment = await this.paymentRepository.save(payment);
      this.logger.log('Payment record created: ' + savedPayment.id);

      // Generate and send invoice
      try {
        const invoice = await this.invoiceService.generateInvoiceFromPayment(
          savedPayment.id,
        );
        this.logger.log('Invoice generated: ' + invoice.id);

        // Send invoice email to user
        const user = await this.userRepository.findOne({
          where: { id: userId },
        });
        if (user && user.email) {
          const emailHtml = `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .header h1 { margin: 0; font-size: 28px; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .greeting { font-size: 18px; margin-bottom: 20px; }
                .message { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
                .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
                .details-title { font-size: 20px; color: #667eea; margin-bottom: 15px; font-weight: bold; }
                .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
                .detail-label { font-weight: 600; color: #666; }
                .detail-value { color: #333; }
                .invoice-box { background: #667eea; color: white; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0; }
                .invoice-number { font-size: 24px; font-weight: bold; margin: 10px 0; }
                .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                .footer { text-align: center; color: #666; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>Payment Confirmation</h1>
              </div>
              <div class="content">
                <div class="greeting">Hello ${user.fullName},</div>
                <div class="message">
                  <p>We're pleased to inform you that your payment has been successfully processed.</p>
                </div>
                <div class="details">
                  <div class="details-title">Invoice Details:</div>
                  <div class="detail-row">
                    <span class="detail-label">Invoice Number:</span>
                    <span class="detail-value"><strong>${invoice.invoiceNumber}</strong></span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Date:</span>
                    <span class="detail-value">${new Date().toLocaleDateString()}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Amount:</span>
                    <span class="detail-value" style="color: #667eea; font-size: 20px; font-weight: bold;">${(session.amount_total / 100).toFixed(2)} EUR</span>
                  </div>
                </div>
                <p style="text-align: center;">You can download your invoice using the button below:</p>
                <div style="text-align: center;">
                  <a href="${process.env.FRONTEND_URL || 'http://localhost:3001'}/dashboard/invoices/${invoice.id}" class="button">Download Invoice</a>
                </div>
                <div class="footer">
                  <p>If you have any questions about this invoice, please don't hesitate to contact our support team.</p>
                  <p><strong>PK SERVIZI</strong><br>Your trusted partner for professional services</p>
                </div>
              </div>
            </body>
            </html>
          `;

          const emailText =
            'Payment Confirmation\n\n' +
            'Dear ' +
            user.fullName +
            ',\n\n' +
            'Thank you for your payment! Your subscription has been activated.\n\n' +
            'Plan: ' +
            userSubscription.plan.name +
            '\n' +
            'Amount: €' +
            (session.amount_total / 100).toFixed(2) +
            '\n' +
            'Invoice: ' +
            invoice.invoiceNumber;

          await this.notificationsService.send({
            userId: user.id,
            userEmail: user.email,
            title: 'Payment Successful - Invoice Attached',
            message: emailText,
            htmlContent: emailHtml,
            type: 'payment',
            data: {
              subscriptionId: userSubscription.id,
              paymentId: savedPayment.id,
              invoiceId: invoice.id,
              invoiceNumber: invoice.invoiceNumber,
              amount: session.amount_total / 100,
              plan: userSubscription.plan.name,
              billingCycle: userSubscription.billingCycle,
            },
          });

          this.logger.log('Notification sent to: ' + user.email);
        }
      } catch (error) {
        this.logger.error('Failed to generate/send invoice: ' + error.message);
        // Don't fail the webhook - invoice generation is non-blocking
      }

      return {
        received: true,
        processed: true,
        action: 'checkout_completed',
        subscriptionId: userSubscription.id,
        paymentId: savedPayment.id,
      };
    } catch (error) {
      this.logger.error(
        'Error handling checkout session: ' + error.message,
        error.stack,
      );
      throw error;
    }
  }

  private async handlePaymentIntentSucceeded(paymentIntent: any): Promise<any> {
    try {
      const payment = await this.paymentRepository.findOne({
        where: { stripePaymentIntentId: paymentIntent.id },
      });

      if (payment) {
        await this.paymentRepository.update(payment.id, {
          status: 'completed',
          paidAt: new Date(),
        });

        this.logger.log('Payment completed: ' + payment.id);
      }

      return { received: true, processed: true, action: 'payment_completed' };
    } catch (error) {
      this.logger.error('Error handling payment success: ' + error.message);
      throw error;
    }
  }

  private async handleSubscriptionCreated(subscription: any): Promise<any> {
    this.logger.log('Subscription created: ' + subscription.id);
    return { received: true, processed: true, action: 'subscription_created' };
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

    return {
      received: true,
      processed: true,
      action: 'subscription_cancelled',
    };
  }

  private async handleInvoicePaid(invoice: any): Promise<any> {
    this.logger.log('Invoice paid: ' + invoice.id);

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

  private async handleInvoicePaymentFailed(invoice: any): Promise<any> {
    this.logger.warn('Invoice payment failed: ' + invoice.id);
    return {
      received: true,
      processed: true,
      action: 'invoice_payment_failed',
    };
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
      id: 'log_' + Date.now(),
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
