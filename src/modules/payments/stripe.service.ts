import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private stripe: Stripe;
  private logger = new Logger(StripeService.name);

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    
    if (apiKey) {
      this.stripe = new Stripe(apiKey, {
        apiVersion: '2025-12-15.clover',
      });
      this.logger.log('Stripe service initialized successfully');
    } else {
      this.logger.warn('STRIPE_SECRET_KEY not configured - Stripe features will be disabled');
      // Initialize with a dummy key to prevent constructor errors
      this.stripe = null;
    }
  }

  async createCheckoutSession(
    userId: string,
    planId: string,
    billingCycle: 'monthly' | 'annual',
  ) {
    if (!this.stripe) {
      throw new Error('Stripe not configured');
    }

    const priceId = billingCycle === 'monthly' 
      ? this.configService.get<string>('STRIPE_PRICE_ID_MONTHLY')
      : this.configService.get<string>('STRIPE_PRICE_ID_ANNUAL');

    return this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${this.configService.get('FRONTEND_URL')}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${this.configService.get('FRONTEND_URL')}/payment/cancel`,
      metadata: {
        userId,
        planId,
        billingCycle,
      },
    });
  }

  async createCustomer(user: any) {
    if (!this.stripe) {
      throw new Error('Stripe not configured');
    }

    return this.stripe.customers.create({
      email: user.email,
      name: user.fullName,
      metadata: {
        userId: user.id,
      },
    });
  }

  async createSubscription(customerId: string, priceId: string) {
    if (!this.stripe) {
      throw new Error('Stripe not configured');
    }

    return this.stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
    });
  }

  async cancelSubscription(subscriptionId: string) {
    if (!this.stripe) {
      throw new Error('Stripe not configured');
    }

    return this.stripe.subscriptions.cancel(subscriptionId);
  }

  async createPaymentIntent(amount: number, currency: string, metadata: any) {
    if (!this.stripe) {
      throw new Error('Stripe not configured');
    }

    return this.stripe.paymentIntents.create({
      amount: amount * 100, // Convert to cents
      currency,
      metadata,
    });
  }

  async retrieveSubscription(subscriptionId: string) {
    if (!this.stripe) {
      throw new Error('Stripe not configured');
    }

    return this.stripe.subscriptions.retrieve(subscriptionId);
  }

  async constructWebhookEvent(payload: Buffer, signature: string) {
    if (!this.stripe) {
      throw new Error('Stripe not configured');
    }

    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
    return this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  }
}