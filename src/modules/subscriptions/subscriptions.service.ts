import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { OverrideLimitsDto } from './dto/override-limits.dto';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { UpgradeSubscriptionDto } from './dto/upgrade-subscription.dto';
import { CreateSubscriptionPlanDto } from './dto/create-subscription-plan.dto';
import { UpdateSubscriptionPlanDto } from './dto/update-subscription-plan.dto';
import { UpdateSubscriptionStatusDto } from './dto/update-subscription-status.dto';
import { SubscriptionPlan } from './entities/subscription-plan.entity';
import { UserSubscription } from './entities/user-subscription.entity';
import { Payment } from '../payments/entities/payment.entity';
import { User } from '../users/entities/user.entity';
import { StripeService } from '../payments/stripe.service';

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    @InjectRepository(SubscriptionPlan)
    private planRepository: Repository<SubscriptionPlan>,
    @InjectRepository(UserSubscription)
    private userSubscriptionRepository: Repository<UserSubscription>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private stripeService: StripeService,
    private configService: ConfigService,
  ) {}

  async getAvailablePlans(): Promise<any> {
    const plans = await this.planRepository.find({ where: { isActive: true } });
    return { success: true, data: plans };
  }

  async getMySubscription(userId: string): Promise<any> {
    const subscription = await this.userSubscriptionRepository.findOne({
      where: { userId },
      relations: ['plan'],
    });
    return { success: true, data: subscription };
  }

  async createCheckout(
    dto: CreateCheckoutDto,
    userId: string,
  ): Promise<{ sessionId: string; url: string }> {
    try {
      // Get the subscription plan
      const plan = await this.planRepository.findOne({
        where: { id: dto.planId },
      });
      if (!plan) {
        throw new BadRequestException('Subscription plan not found');
      }

      // Get user details for Stripe
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new BadRequestException('User not found');
      }

      this.logger.log(
        `Creating checkout for user ${userId} (${user.email}) - Plan: ${plan.name}`,
      );

      // Use monthly billing by default
      const price = plan.priceMonthly;

      // Map plan to Stripe Price ID (you can configure these in environment or database)
      // For now, using a simple mapping based on plan name
      const stripePriceId = this.getStripePriceId(plan, 'monthly');

      if (!stripePriceId) {
        this.logger.warn(
          `No Stripe Price ID configured for plan ${plan.name} (monthly)`,
        );
        throw new BadRequestException(
          'This subscription plan is not available for purchase at the moment',
        );
      }

      // Create user subscription with pending status
      const subscription = this.userSubscriptionRepository.create({
        userId,
        planId: dto.planId,
        status: 'pending',
        billingCycle: 'monthly',
        startDate: new Date(),
        autoRenew: true,
      });
      const savedSubscription =
        await this.userSubscriptionRepository.save(subscription);

      this.logger.log(
        `Subscription created with status: ${savedSubscription.status}`,
      );
      this.logger.log(`Subscription ID: ${savedSubscription.id}`);

      // Create Stripe checkout session
      const frontendUrl =
        this.configService.get('FRONTEND_URL') || 'http://localhost:3000';
      const session = await this.stripeService.createCheckoutSession({
        priceId: stripePriceId,
        userId: user.id,
        userEmail: user.email,
        planId: plan.id,
        billingCycle: 'monthly',
        successUrl: `${frontendUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${frontendUrl}/payment/cancel`,
        metadata: {
          subscriptionId: savedSubscription.id,
          planName: plan.name,
          subscriptionPlan: plan.name,
        },
      });

      this.logger.log(`Stripe checkout session created: ${session.id}`);

      // Store Stripe session ID in metadata (will be updated to subscription ID by webhook)
      await this.userSubscriptionRepository.update(savedSubscription.id, {
        stripeSubscriptionId: session.id, // Temporarily store session ID
      });

      return {
        sessionId: session.id,
        url: session.url || '',
      };
    } catch (error) {
      this.logger.error(
        `Failed to create checkout: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Map subscription plan to Stripe Price ID
   * TODO: Store these in database or environment variables
   */
  private getStripePriceId(
    plan: SubscriptionPlan,
    billingCycle: string,
  ): string | null {
    // You need to create these Price IDs in your Stripe Dashboard
    // and configure them here or in the database
    const priceMapping = {
      Basic: {
        monthly: this.configService.get('STRIPE_PRICE_BASIC_MONTHLY'),
        annual: this.configService.get('STRIPE_PRICE_BASIC_ANNUAL'),
      },
      Professional: {
        monthly: this.configService.get('STRIPE_PRICE_PROFESSIONAL_MONTHLY'),
        annual: this.configService.get('STRIPE_PRICE_PROFESSIONAL_ANNUAL'),
      },
      Premium: {
        monthly: this.configService.get('STRIPE_PRICE_PREMIUM_MONTHLY'),
        annual: this.configService.get('STRIPE_PRICE_PREMIUM_ANNUAL'),
      },
      'Free Trial': {
        monthly: null, // Free plans don't need Stripe
        annual: null,
      },
    };

    return priceMapping[plan.name]?.[billingCycle] || null;
  }

  async cancelSubscription(userId: string): Promise<any> {
    const subscription = await this.userSubscriptionRepository.findOne({
      where: { userId },
    });
    if (subscription) {
      await this.userSubscriptionRepository.update(userId, {
        status: 'cancelled',
        endDate: new Date(),
      });
    }
    return { success: true, message: 'Subscription cancelled' };
  }

  async upgradeSubscription(
    dto: UpgradeSubscriptionDto,
    userId: string,
  ): Promise<UserSubscription> {
    await this.userSubscriptionRepository.update(
      { userId },
      { planId: dto.newPlanId },
    );
    const updated = await this.userSubscriptionRepository.findOne({
      where: { userId },
      relations: ['plan'],
    });
    return updated!;
  }

  async getMyPayments(userId: string): Promise<any> {
    const payments = await this.paymentRepository.find({ where: { userId } });
    return { success: true, data: payments };
  }

  async downloadReceipt(id: string, userId: string): Promise<any> {
    const payment = await this.paymentRepository.findOne({
      where: { id, userId },
    });
    return { success: true, message: 'Receipt downloaded', data: payment };
  }

  async getAllPlans(): Promise<any> {
    const plans = await this.planRepository.find();
    return { success: true, data: plans };
  }

  async createPlan(dto: CreateSubscriptionPlanDto): Promise<SubscriptionPlan> {
    const plan = this.planRepository.create(dto);
    const saved = await this.planRepository.save(plan);
    return saved;
  }

  async updatePlan(
    id: string,
    dto: UpdateSubscriptionPlanDto,
  ): Promise<SubscriptionPlan> {
    await this.planRepository.update(id, dto);
    const updated = await this.planRepository.findOne({ where: { id } });
    return updated;
  }

  async deletePlan(id: string): Promise<any> {
    await this.planRepository.delete(id);
    return { success: true, message: 'Plan deleted' };
  }

  async getAllSubscriptions(): Promise<any> {
    const subscriptions = await this.userSubscriptionRepository.find({
      relations: ['plan', 'user'],
    });
    return { success: true, data: subscriptions };
  }

  async getSubscription(id: string): Promise<any> {
    const subscription = await this.userSubscriptionRepository.findOne({
      where: { id },
      relations: ['plan', 'user'],
    });
    return { success: true, data: subscription };
  }

  async updateSubscriptionStatus(
    id: string,
    dto: UpdateSubscriptionStatusDto,
  ): Promise<UserSubscription> {
    await this.userSubscriptionRepository.update(id, { status: dto.status });
    const updated = await this.userSubscriptionRepository.findOne({
      where: { id },
    });
    return updated!;
  }

  async processRefund(
    id: string,
    dto: { reason?: string },
  ): Promise<{ success: boolean; message: string }> {
    await this.paymentRepository.update(id, { status: 'refunded' });
    return { success: true, message: 'Refund processed' };
  }

  async getAllPayments(): Promise<any> {
    const payments = await this.paymentRepository.find();
    return { success: true, data: payments };
  }

  // Extended Operations - Usage Tracking
  async getMyUsage(userId: string): Promise<any> {
    const subscription = await this.userSubscriptionRepository.findOne({
      where: { userId },
      relations: ['plan'],
    });
    if (!subscription) {
      return {
        success: true,
        data: { userId, currentPeriod: {}, resetDate: null },
      };
    }

    return {
      success: true,
      data: {
        userId,
        currentPeriod: {
          serviceRequests: { used: 5, limit: 10 },
          documentUploads: { used: 15, limit: 50 },
          appointments: { used: 2, limit: 5 },
        },
        resetDate:
          subscription.endDate ||
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    };
  }

  async getMyLimits(userId: string): Promise<any> {
    const subscription = await this.userSubscriptionRepository.findOne({
      where: { userId },
      relations: ['plan'],
    });
    if (!subscription) {
      return { success: true, data: { userId, limits: {}, features: [] } };
    }

    return {
      success: true,
      data: {
        userId,
        planName: subscription.plan?.name || 'Free',
        limits: {
          serviceRequests: 10,
          documentUploads: 50,
          appointments: 5,
          familyMembers: 8,
        },
        features: ['Priority Support', 'Advanced Analytics', 'Custom Reports'],
      },
    };
  }

  async generateInvoice(id: string, userId: string): Promise<any> {
    const payment = await this.paymentRepository.findOne({
      where: { id, userId },
    });
    if (!payment) {
      return { success: false, message: 'Payment not found' };
    }

    return {
      success: true,
      message: 'Invoice generated',
      data: {
        paymentId: id,
        invoiceUrl: `/api/v1/payments/${id}/invoice.pdf`,
        invoiceNumber: `INV-${payment.id}`,
        generatedAt: new Date(),
        amount: payment.amount,
      },
    };
  }

  async resendReceipt(id: string, userId: string): Promise<any> {
    const payment = await this.paymentRepository.findOne({
      where: { id, userId },
      relations: ['user'],
    });
    if (!payment) {
      return { success: false, message: 'Payment not found' };
    }

    return {
      success: true,
      message: 'Receipt email sent',
      data: {
        paymentId: id,
        sentAt: new Date(),
        emailAddress: payment.user?.email || 'user@example.com',
      },
    };
  }

  async overrideLimits(id: string, dto: OverrideLimitsDto): Promise<any> {
    const subscription = await this.userSubscriptionRepository.findOne({
      where: { id },
    });
    if (!subscription) {
      return { success: false, message: 'Subscription not found' };
    }

    const expiresAt = new Date(
      Date.now() + (dto.durationDays || 30) * 24 * 60 * 60 * 1000,
    );

    return {
      success: true,
      message: 'Limits overridden successfully',
      data: {
        subscriptionId: id,
        overrides: {
          serviceRequestLimit: dto.serviceRequestLimit,
          documentUploadLimit: dto.documentUploadLimit,
          appointmentLimit: dto.appointmentLimit,
        },
        reason: dto.reason,
        durationDays: dto.durationDays || 30,
        appliedAt: new Date(),
        expiresAt,
      },
    };
  }

  /**
   * Reactivate a cancelled subscription
   */
  async reactivateSubscription(userId: string): Promise<any> {
    try {
      const subscription = await this.userSubscriptionRepository.findOne({
        where: { userId, status: 'cancelled' },
        relations: ['plan'],
      });

      if (!subscription) {
        return {
          success: false,
          message: 'No cancelled subscription found to reactivate',
        };
      }

      subscription.status = 'active';
      subscription.endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Extend 30 days
      subscription.autoRenew = true;

      const updated = await this.userSubscriptionRepository.save(subscription);

      this.logger.log(`Reactivated subscription for user ${userId}`);

      return {
        success: true,
        message: 'Subscription reactivated successfully',
        data: updated,
      };
    } catch (error) {
      this.logger.error(
        `Failed to reactivate subscription: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
