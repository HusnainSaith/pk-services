import { ConfigService } from '@nestjs/config';

export const stripeConfig = (config: ConfigService) => ({
  apiKey: config.get<string>('STRIPE_SECRET_KEY'),
  apiVersion: '2025-12-15.clover' as const,
  webhookSecret: config.get<string>('STRIPE_WEBHOOK_SECRET'),
});
