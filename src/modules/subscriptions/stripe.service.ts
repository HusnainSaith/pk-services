import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private stripe: Stripe;

  constructor() {
    const apiKey = process.env.STRIPE_SECRET_KEY;
    if (!apiKey) {
      throw new Error('STRIPE_SECRET_KEY environment variable not set');
    }
    this.stripe = new Stripe(apiKey, { apiVersion: '2024-04-10' as any });
  }

  /**
   * Create checkout session for subscription
   */
  async createCheckoutSession(params: {
    priceId: string;
    userId: string;
    userEmail: string;
    successUrl: string;
    cancelUrl: string;
    metadata?: Record<string, string>;
  }): Promise<Stripe.Checkout.Session> {
    this.logger.debug(`Creating checkout session for user ${params.userId}`);

    try {
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price: params.priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: params.successUrl,
        cancel_url: params.cancelUrl,
        customer_email: params.userEmail,
        client_reference_id: params.userId,
        metadata: {
          userId: params.userId,
          ...params.metadata,
        },
        subscription_data: {
          metadata: {
            userId: params.userId,
          },
        },
      });

      this.logger.log(`Checkout session ${session.id} created`);
      return session;
    } catch (error) {
      this.logger.error(`Failed to create checkout session: ${error.message}`);
      throw new BadRequestException('Failed to create checkout session');
    }
  }

  /**
   * Get subscription details
   */
  async getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    try {
      return await this.stripe.subscriptions.retrieve(subscriptionId);
    } catch (error) {
      this.logger.error(
        `Failed to retrieve subscription ${subscriptionId}: ${error.message}`,
      );
      throw new BadRequestException('Subscription not found');
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(
    subscriptionId: string,
    atPeriodEnd: boolean = false,
  ): Promise<Stripe.Subscription> {
    try {
      return await this.stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: atPeriodEnd,
      });
    } catch (error) {
      this.logger.error(
        `Failed to cancel subscription ${subscriptionId}: ${error.message}`,
      );
      throw new BadRequestException('Failed to cancel subscription');
    }
  }

  /**
   * Update subscription to new plan
   */
  async updateSubscriptionPlan(
    subscriptionId: string,
    newPriceId: string,
  ): Promise<Stripe.Subscription> {
    try {
      const subscription =
        await this.stripe.subscriptions.retrieve(subscriptionId);
      const itemId = subscription.items.data[0].id;

      await (this.stripe.subscriptionItems as any).createUsageRecord(itemId, {
        quantity: 1,
      });

      return subscription;
    } catch (error) {
      this.logger.error(
        `Failed to update subscription ${subscriptionId}: ${error.message}`,
      );
      throw new BadRequestException('Failed to upgrade subscription');
    }
  }

  /**
   * Create refund
   */
  async createRefund(
    paymentIntentId: string,
    amount?: number,
  ): Promise<Stripe.Refund> {
    try {
      return await this.stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount,
      });
    } catch (error) {
      this.logger.error(`Failed to create refund: ${error.message}`);
      throw new BadRequestException('Failed to process refund');
    }
  }

  /**
   * Get payment intent
   */
  async getPaymentIntent(
    paymentIntentId: string,
  ): Promise<Stripe.PaymentIntent> {
    try {
      return await this.stripe.paymentIntents.retrieve(paymentIntentId);
    } catch (error) {
      this.logger.error(`Failed to retrieve payment intent: ${error.message}`);
      throw new BadRequestException('Payment not found');
    }
  }

  /**
   * List customer subscriptions
   */
  async getCustomerSubscriptions(
    customerId: string,
  ): Promise<Stripe.Subscription[]> {
    try {
      const subscriptions = await this.stripe.subscriptions.list({
        customer: customerId,
        limit: 100,
      });
      return subscriptions.data;
    } catch (error) {
      this.logger.error(`Failed to list subscriptions: ${error.message}`);
      throw new BadRequestException('Failed to fetch subscriptions');
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(body: string | Buffer, signature: string): any {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) {
      throw new Error('STRIPE_WEBHOOK_SECRET not configured');
    }

    try {
      return this.stripe.webhooks.constructEvent(body, signature, secret);
    } catch (error) {
      throw new BadRequestException('Invalid webhook signature');
    }
  }
}
