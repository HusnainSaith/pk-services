import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionPlansService } from './subscription-plans.service';
import { UserRequest } from '../../common/interfaces/user-request.interface';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { UpgradeSubscriptionDto } from './dto/upgrade-subscription.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

/**
 * Subscriptions Controller - Customer-Facing Operations
 * Handles user interactions with subscriptions:
 * - View available plans
 * - Subscribe to a plan
 * - View my subscription
 * - Upgrade/downgrade
 * - Cancel subscription
 * - Check usage limits
 */
@ApiTags('Subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly plansService: SubscriptionPlansService,
  ) {}

  // ==================== PUBLIC ROUTES ====================

  /**
   * Get available subscription plans (public)
   */
  @Get('plans')
  @ApiOperation({ summary: '[Public] List available subscription plans' })
  async getAvailablePlans() {
    return this.plansService.findActive();
  }

  /**
   * Get plan comparison matrix (public)
   */
  @Get('plans/comparison')
  @ApiOperation({ summary: '[Public] Get plan comparison matrix' })
  async getPlansComparison() {
    return this.plansService.getComparison();
  }

  /**
   * Get specific plan details (public)
   */
  @Get('plans/:id')
  @ApiOperation({ summary: '[Public] Get plan details' })
  async getPlan(@Param('id') id: string) {
    return this.plansService.findOne(id);
  }

  // ==================== USER AUTHENTICATED ROUTES ====================

  /**
   * Get my active subscription
   */
  @Get('my')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('subscriptions:read_own')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[Customer] Get my active subscription' })
  async getMySubscription(@CurrentUser() user: UserRequest) {
    return this.subscriptionsService.getMySubscription(user.id);
  }

  /**
   * Get my subscription usage stats
   */
  @Get('my/usage')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('subscriptions:read_own')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[Customer] Get current usage statistics' })
  async getMyUsage(@CurrentUser() user: UserRequest) {
    return this.subscriptionsService.getMyUsage(user.id);
  }

  /**
   * Get my subscription limits
   */
  @Get('my/limits')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('subscriptions:read_own')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[Customer] Get plan limits and features' })
  async getMyLimits(@CurrentUser() user: UserRequest) {
    return this.subscriptionsService.getMyLimits(user.id);
  }

  /**
   * Create checkout session to subscribe
   */
  @Post('checkout')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('subscriptions:write_own')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: '[Customer] Create checkout session for subscription',
  })
  async createCheckout(
    @Body() dto: CreateCheckoutDto,
    @CurrentUser() user: UserRequest,
  ) {
    return this.subscriptionsService.createCheckout(dto, user.id);
  }

  /**
   * Upgrade/downgrade subscription plan
   */
  @Post('upgrade')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('subscriptions:write_own')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: '[Customer] Upgrade or downgrade subscription plan',
  })
  async upgradeSubscription(
    @Body() dto: UpgradeSubscriptionDto,
    @CurrentUser() user: any,
  ) {
    return this.subscriptionsService.upgradeSubscription(dto, user.id);
  }

  /**
   * Cancel my subscription
   */
  @Post('cancel')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('subscriptions:write_own')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[Customer] Cancel my subscription' })
  async cancelSubscription(@CurrentUser() user: UserRequest) {
    return this.subscriptionsService.cancelSubscription(user.id);
  }

  /**
   * Reactivate cancelled subscription
   */
  @Post('reactivate')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('subscriptions:write_own')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[Customer] Reactivate cancelled subscription' })
  async reactivateSubscription(@CurrentUser() user: UserRequest) {
    return this.subscriptionsService.reactivateSubscription(user.id);
  }
}
