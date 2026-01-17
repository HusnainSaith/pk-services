import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import { SubscriptionPlan } from './entities/subscription-plan.entity';
import { UserSubscription } from './entities/user-subscription.entity';
import { User } from '../users/entities/user.entity';
import { Payment } from '../payments/entities/payment.entity';

// Controllers
import { SubscriptionsController } from './subscriptions-customer.controller';
import { SubscriptionPlansController } from './subscription-plans.controller';
import { UserSubscriptionsController } from './user-subscriptions.controller';

// Services
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionPlansService } from './subscription-plans.service';
import { UserSubscriptionsService } from './user-subscriptions.service';

// Modules
import { UsersModule } from '../users/users.module';
import { PaymentsModule } from '../payments/payments.module';

/**
 * Subscriptions Module
 *
 * ARCHITECTURE:
 * - SubscriptionsController (subscriptions-customer.controller.ts)
 *   → Customer-facing: View plans, subscribe, manage my subscription
 *   → Routes: /subscriptions/*
 *
 * - SubscriptionPlansController (subscription-plans.controller.ts)
 *   → Admin: CRUD operations on plan templates
 *   → Routes: /admin/subscription-plans/*
 *
 * - UserSubscriptionsController (user-subscriptions.controller.ts)
 *   → Admin: Manage individual user subscriptions
 *   → Routes: /admin/user-subscriptions/*
 *
 * This separation provides:
 * - Clear boundaries between customer and admin operations
 * - Better permission management
 * - Easier maintenance and testing
 * - Follows separation of concerns principle
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      SubscriptionPlan,
      UserSubscription,
      User,
      Payment,
    ]),
    UsersModule,
    forwardRef(() => PaymentsModule),
  ],
  controllers: [
    SubscriptionsController, // Customer operations
    SubscriptionPlansController, // Admin: Plan CRUD
    UserSubscriptionsController, // Admin: User subscription management
  ],
  providers: [
    SubscriptionsService,
    SubscriptionPlansService,
    UserSubscriptionsService,
  ],
  exports: [
    SubscriptionsService,
    SubscriptionPlansService,
    UserSubscriptionsService,
  ],
})
export class SubscriptionsModule {}
