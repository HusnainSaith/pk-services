import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionPlansService } from './subscription-plans.service';
import { UserSubscriptionsService } from './user-subscriptions.service';
import { SubscriptionPlan } from './entities/subscription-plan.entity';
import { UserSubscription } from './entities/user-subscription.entity';
import { User } from '../users/entities/user.entity';
import { Payment } from '../payments/entities/payment.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SubscriptionPlan, UserSubscription, User, Payment]),
    UsersModule,
  ],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService, SubscriptionPlansService, UserSubscriptionsService],
  exports: [SubscriptionsService, SubscriptionPlansService, UserSubscriptionsService],
})
export class SubscriptionsModule {}
