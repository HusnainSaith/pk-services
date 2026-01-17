/**
 * Stripe Webhook Event Interfaces
 * Properly typed Stripe webhook event payloads
 */

import Stripe from 'stripe';

// Use Stripe SDK types directly
export type StripeCheckoutSession = Stripe.Checkout.Session;
export type StripeSubscription = Stripe.Subscription;
export type StripePaymentIntent = Stripe.PaymentIntent;
export type StripeInvoice = Stripe.Invoice;

export interface WebhookEventLog {
  eventId: string;
  eventType: string;
  status: 'received' | 'processing' | 'completed' | 'failed';
  processed: boolean;
  error?: string;
  timestamp: Date;
}

export interface WebhookResponse {
  received: boolean;
  processed: boolean;
  eventType?: string;
  eventId?: string;
  action?: string;
  success?: boolean;
  message?: string;
  subscriptionId?: string;
  paymentId?: string;
  result?: any;
  data?: any;
  error?: string;
}
