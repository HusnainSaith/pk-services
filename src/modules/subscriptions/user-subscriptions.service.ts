import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserSubscription } from './entities/user-subscription.entity';
import { SubscriptionPlan } from './entities/subscription-plan.entity';
import { User } from '../users/entities/user.entity';
import { CreateUserSubscriptionDto } from './dto/create-user-subscription.dto';
import { UpdateUserSubscriptionDto } from './dto/update-user-subscription.dto';

/**
 * User Subscriptions Service
 * Handles operations on individual user subscriptions
 */
@Injectable()
export class UserSubscriptionsService {
  private readonly logger = new Logger(UserSubscriptionsService.name);

  constructor(
    @InjectRepository(UserSubscription)
    private userSubscriptionRepository: Repository<UserSubscription>,
    @InjectRepository(SubscriptionPlan)
    private planRepository: Repository<SubscriptionPlan>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  /**
   * Create a new user subscription
   */
  async create(dto: CreateUserSubscriptionDto): Promise<any> {
    try {
      const subscription = this.userSubscriptionRepository.create(dto);
      const saved = await this.userSubscriptionRepository.save(subscription);

      this.logger.log(
        `Created subscription ${saved.id} for user ${dto.userId}`,
      );

      return {
        success: true,
        data: saved,
        message: 'Subscription created successfully',
      };
    } catch (error) {
      this.logger.error(
        `Failed to create subscription: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Find all user subscriptions
   */
  async findAll(): Promise<any> {
    try {
      const subscriptions = await this.userSubscriptionRepository.find({
        relations: ['plan', 'user'],
        order: { createdAt: 'DESC' },
      });

      return {
        success: true,
        data: subscriptions,
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch subscriptions: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Find one subscription by ID
   */
  async findOne(id: string): Promise<any> {
    try {
      const subscription = await this.userSubscriptionRepository.findOne({
        where: { id },
        relations: ['plan', 'user'],
      });

      if (!subscription) {
        throw new NotFoundException(`Subscription with ID ${id} not found`);
      }

      return {
        success: true,
        data: subscription,
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch subscription ${id}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Find active subscription for a user
   */
  async findActiveByUser(userId: string): Promise<any> {
    try {
      const subscription = await this.userSubscriptionRepository.findOne({
        where: { userId, status: 'active' },
        relations: ['plan'],
      });

      return {
        success: true,
        data: subscription,
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch active subscription for user ${userId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Find all subscriptions for a user (history)
   */
  async findByUser(userId: string): Promise<any> {
    try {
      const subscriptions = await this.userSubscriptionRepository.find({
        where: { userId },
        relations: ['plan'],
        order: { createdAt: 'DESC' },
      });

      return {
        success: true,
        data: subscriptions,
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch subscriptions for user ${userId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Update a subscription
   */
  async update(id: string, dto: UpdateUserSubscriptionDto): Promise<any> {
    try {
      const subscription = await this.userSubscriptionRepository.findOne({
        where: { id },
      });

      if (!subscription) {
        throw new NotFoundException(`Subscription with ID ${id} not found`);
      }

      Object.assign(subscription, dto);
      const updated = await this.userSubscriptionRepository.save(subscription);

      this.logger.log(`Updated subscription ${id}`);

      return {
        success: true,
        data: updated,
        message: 'Subscription updated successfully',
      };
    } catch (error) {
      this.logger.error(
        `Failed to update subscription ${id}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Cancel a subscription
   */
  async cancel(id: string): Promise<any> {
    try {
      const subscription = await this.userSubscriptionRepository.findOne({
        where: { id },
      });

      if (!subscription) {
        throw new NotFoundException(`Subscription with ID ${id} not found`);
      }

      subscription.status = 'cancelled';
      subscription.endDate = new Date();
      subscription.autoRenew = false;

      const updated = await this.userSubscriptionRepository.save(subscription);

      this.logger.log(`Cancelled subscription ${id}`);

      return {
        success: true,
        data: updated,
        message: 'Subscription cancelled successfully',
      };
    } catch (error) {
      this.logger.error(
        `Failed to cancel subscription ${id}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Find subscription by Stripe subscription ID
   */
  async findByStripeId(stripeId: string): Promise<any> {
    try {
      const subscription = await this.userSubscriptionRepository.findOne({
        where: { stripeSubscriptionId: stripeId },
        relations: ['plan', 'user'],
      });

      return {
        success: true,
        data: subscription,
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch subscription by Stripe ID ${stripeId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Manually assign a subscription to a user (admin function)
   */
  async manuallyAssign(
    userId: string,
    planId: string,
    reason?: string,
  ): Promise<any> {
    try {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      const plan = await this.planRepository.findOne({ where: { id: planId } });
      if (!plan) {
        throw new NotFoundException(`Plan with ID ${planId} not found`);
      }

      // Check if user already has an active subscription
      const existing = await this.userSubscriptionRepository.findOne({
        where: { userId, status: 'active' },
      });

      if (existing) {
        // Cancel existing subscription
        existing.status = 'cancelled';
        existing.endDate = new Date();
        await this.userSubscriptionRepository.save(existing);
      }

      // Create new subscription
      const subscription = this.userSubscriptionRepository.create({
        userId,
        planId,
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        billingCycle: 'annual',
        autoRenew: false,
      });

      const saved = await this.userSubscriptionRepository.save(subscription);

      this.logger.log(
        `Manually assigned plan ${plan.name} to user ${userId}. Reason: ${reason || 'N/A'}`,
      );

      return {
        success: true,
        data: saved,
        message: `Successfully assigned ${plan.name} plan to user`,
      };
    } catch (error) {
      this.logger.error(
        `Failed to manually assign subscription: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Get subscription statistics for admin dashboard
   */
  async getStatistics(): Promise<any> {
    try {
      const total = await this.userSubscriptionRepository.count();
      const active = await this.userSubscriptionRepository.count({
        where: { status: 'active' },
      });
      const cancelled = await this.userSubscriptionRepository.count({
        where: { status: 'cancelled' },
      });
      const pastDue = await this.userSubscriptionRepository.count({
        where: { status: 'past_due' },
      });

      // Get subscriptions by plan
      const plans = await this.planRepository.find();
      const byPlan = await Promise.all(
        plans.map(async (plan) => {
          const count = await this.userSubscriptionRepository.count({
            where: { planId: plan.id, status: 'active' },
          });
          return {
            planId: plan.id,
            planName: plan.name,
            activeSubscribers: count,
          };
        }),
      );

      return {
        success: true,
        data: {
          total,
          active,
          cancelled,
          pastDue,
          byPlan,
          churnRate: total > 0 ? ((cancelled / total) * 100).toFixed(2) : 0,
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to get statistics: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
