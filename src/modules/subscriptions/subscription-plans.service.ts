import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubscriptionPlan } from './entities/subscription-plan.entity';
import { UserSubscription } from './entities/user-subscription.entity';
import { CreateSubscriptionPlanDto } from './dto/create-subscription-plan.dto';
import { UpdateSubscriptionPlanDto } from './dto/update-subscription-plan.dto';

/**
 * Subscription Plans Service
 * Manages subscription plan templates and CRUD operations
 * Admin-only service for managing available subscription tiers
 */
@Injectable()
export class SubscriptionPlansService {
  private readonly logger = new Logger(SubscriptionPlansService.name);

  constructor(
    @InjectRepository(SubscriptionPlan)
    private planRepository: Repository<SubscriptionPlan>,
    @InjectRepository(UserSubscription)
    private userSubscriptionRepository: Repository<UserSubscription>,
  ) {}

  /**
   * Get all active subscription plans (for public display)
   */
  async findActive(): Promise<any> {
    try {
      const plans = await this.planRepository.find({
        where: { isActive: true },
        order: { priceMonthly: 'ASC' },
      });

      return {
        success: true,
        data: plans,
        message: `Found ${plans.length} active subscription plans`,
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch active plans: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Get all subscription plans including inactive ones (admin only)
   */
  async findAll(): Promise<any> {
    try {
      const plans = await this.planRepository.find({
        order: { createdAt: 'DESC' },
      });

      const stats = await Promise.all(
        plans.map(async (plan) => {
          const subscriberCount = await this.userSubscriptionRepository.count({
            where: { planId: plan.id },
          });
          return { ...plan, subscriberCount };
        }),
      );

      return {
        success: true,
        data: stats,
        message: `Found ${plans.length} subscription plans`,
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch all plans: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Get a single subscription plan by ID
   */
  async findOne(id: string): Promise<any> {
    try {
      const plan = await this.planRepository.findOne({ where: { id } });

      if (!plan) {
        throw new NotFoundException(
          `Subscription plan with ID ${id} not found`,
        );
      }

      // Get subscriber count
      const subscriberCount = await this.userSubscriptionRepository.count({
        where: { planId: id },
      });

      // Get active subscriber count
      const activeSubscribers = await this.userSubscriptionRepository.count({
        where: { planId: id, status: 'active' },
      });

      return {
        success: true,
        data: {
          ...plan,
          subscriberCount,
          activeSubscribers,
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch plan ${id}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Create a new subscription plan
   */
  async create(dto: CreateSubscriptionPlanDto): Promise<any> {
    try {
      // Check if plan with same name exists
      const existing = await this.planRepository.findOne({
        where: { name: dto.name },
      });

      if (existing) {
        throw new BadRequestException(
          `A plan with name "${dto.name}" already exists`,
        );
      }

      // Validate pricing
      if (dto.priceMonthly && dto.priceAnnual) {
        const monthlyTotal = dto.priceMonthly * 12;
        if (dto.priceAnnual >= monthlyTotal) {
          this.logger.warn(
            `Annual price (${dto.priceAnnual}) should be less than monthly total (${monthlyTotal}) for discount`,
          );
        }
      }

      // Create plan
      const plan = this.planRepository.create({
        name: dto.name,
        description: dto.description,
        priceMonthly: dto.priceMonthly,
        priceAnnual: dto.priceAnnual,
        features: dto.features || [],
        serviceLimits: dto.serviceLimits || {},
        isActive: dto.isActive !== undefined ? dto.isActive : true,
      });

      const saved = await this.planRepository.save(plan);

      this.logger.log(
        `Created subscription plan: ${saved.name} (ID: ${saved.id})`,
      );

      return {
        success: true,
        data: saved,
        message: `Subscription plan "${saved.name}" created successfully`,
      };
    } catch (error) {
      this.logger.error(`Failed to create plan: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Update an existing subscription plan
   */
  async update(id: string, dto: UpdateSubscriptionPlanDto): Promise<any> {
    try {
      const plan = await this.planRepository.findOne({ where: { id } });

      if (!plan) {
        throw new NotFoundException(
          `Subscription plan with ID ${id} not found`,
        );
      }

      // Check if renaming to an existing name
      if (dto.name && dto.name !== plan.name) {
        const existing = await this.planRepository.findOne({
          where: { name: dto.name },
        });
        if (existing) {
          throw new BadRequestException(
            `A plan with name "${dto.name}" already exists`,
          );
        }
      }

      // Update fields
      Object.assign(plan, dto);
      const updated = await this.planRepository.save(plan);

      this.logger.log(`Updated subscription plan: ${updated.name} (ID: ${id})`);

      return {
        success: true,
        data: updated,
        message: `Subscription plan "${updated.name}" updated successfully`,
      };
    } catch (error) {
      this.logger.error(
        `Failed to update plan ${id}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Soft delete / deactivate a subscription plan
   * Does not delete to preserve data integrity for existing subscriptions
   */
  async deactivate(id: string): Promise<any> {
    try {
      const plan = await this.planRepository.findOne({ where: { id } });

      if (!plan) {
        throw new NotFoundException(
          `Subscription plan with ID ${id} not found`,
        );
      }

      // Check if plan has active subscriptions
      const activeSubscribers = await this.userSubscriptionRepository.count({
        where: { planId: id, status: 'active' },
      });

      if (activeSubscribers > 0) {
        this.logger.warn(
          `Deactivating plan ${plan.name} with ${activeSubscribers} active subscribers`,
        );
      }

      // Deactivate instead of deleting
      plan.isActive = false;
      await this.planRepository.save(plan);

      this.logger.log(
        `Deactivated subscription plan: ${plan.name} (ID: ${id})`,
      );

      return {
        success: true,
        message: `Subscription plan "${plan.name}" deactivated. ${activeSubscribers} active subscriptions will continue.`,
        data: { activeSubscribers },
      };
    } catch (error) {
      this.logger.error(
        `Failed to deactivate plan ${id}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Get plan comparison matrix for public display
   */
  async getComparison(): Promise<any> {
    try {
      const plans = await this.planRepository.find({
        where: { isActive: true },
        order: { priceMonthly: 'ASC' },
      });

      const comparison = plans.map((plan) => ({
        id: plan.id,
        name: plan.name,
        description: plan.description,
        priceMonthly: plan.priceMonthly,
        priceAnnual: plan.priceAnnual,
        features: plan.features,
        serviceLimits: plan.serviceLimits,
        recommended: plan.name === 'Professional', // Can be configured
      }));

      return {
        success: true,
        data: comparison,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get plan comparison: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Get statistics for a specific plan
   */
  async getStatistics(id: string): Promise<any> {
    try {
      const plan = await this.planRepository.findOne({ where: { id } });

      if (!plan) {
        throw new NotFoundException(
          `Subscription plan with ID ${id} not found`,
        );
      }

      const totalSubscribers = await this.userSubscriptionRepository.count({
        where: { planId: id },
      });

      const activeSubscribers = await this.userSubscriptionRepository.count({
        where: { planId: id, status: 'active' },
      });

      const cancelledSubscribers = await this.userSubscriptionRepository.count({
        where: { planId: id, status: 'cancelled' },
      });

      return {
        success: true,
        data: {
          planId: id,
          planName: plan.name,
          totalSubscribers,
          activeSubscribers,
          cancelledSubscribers,
          churnRate:
            totalSubscribers > 0
              ? (cancelledSubscribers / totalSubscribers) * 100
              : 0,
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to get statistics for plan ${id}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Clone an existing plan as a template
   */
  async clone(id: string, newName: string): Promise<any> {
    try {
      const original = await this.planRepository.findOne({ where: { id } });

      if (!original) {
        throw new NotFoundException(
          `Subscription plan with ID ${id} not found`,
        );
      }

      // Check if new name already exists
      const existing = await this.planRepository.findOne({
        where: { name: newName },
      });

      if (existing) {
        throw new BadRequestException(
          `A plan with name "${newName}" already exists`,
        );
      }

      // Create clone
      const clone = this.planRepository.create({
        name: newName,
        description: original.description + ' (Copy)',
        priceMonthly: original.priceMonthly,
        priceAnnual: original.priceAnnual,
        features: original.features,
        serviceLimits: original.serviceLimits,
        isActive: false, // Cloned plans start as inactive
      });

      const saved = await this.planRepository.save(clone);

      this.logger.log(
        `Cloned subscription plan "${original.name}" to "${newName}"`,
      );

      return {
        success: true,
        data: saved,
        message: `Plan cloned successfully as "${newName}"`,
      };
    } catch (error) {
      this.logger.error(
        `Failed to clone plan ${id}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
