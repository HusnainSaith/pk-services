import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserSubscriptionsService } from './user-subscriptions.service';
import { SubscriptionsService } from './subscriptions.service';
import { UpdateSubscriptionStatusDto } from './dto/update-subscription-status.dto';
import { OverrideLimitsDto } from './dto/override-limits.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';

/**
 * User Subscriptions Controller - Admin Operations
 * Manages individual user subscriptions (not the plan templates)
 * Admin can view all subscriptions, update status, override limits, etc.
 */
@ApiTags('Admin - User Subscriptions')
@Controller('admin/user-subscriptions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('JWT-auth')
export class UserSubscriptionsController {
  constructor(
    private readonly userSubscriptionsService: UserSubscriptionsService,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  /**
   * Get all user subscriptions with filtering
   */
  @Get()
  @Permissions('subscriptions:read')
  @ApiOperation({ summary: '[Admin] List all user subscriptions' })
  async findAll(
    @Query('status') status?: string,
    @Query('planId') planId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.subscriptionsService.getAllSubscriptions();
  }

  /**
   * Get a specific user subscription by ID
   */
  @Get(':id')
  @Permissions('subscriptions:read')
  @ApiOperation({ summary: '[Admin] Get user subscription details' })
  async findOne(@Param('id') id: string) {
    return this.subscriptionsService.getSubscription(id);
  }

  /**
   * Get subscriptions for a specific user
   */
  @Get('user/:userId')
  @Permissions('subscriptions:read')
  @ApiOperation({ summary: '[Admin] Get user subscription history' })
  async findByUser(@Param('userId') userId: string) {
    return this.userSubscriptionsService.findByUser(userId);
  }

  /**
   * Update subscription status (activate, cancel, suspend, etc.)
   */
  @Patch(':id/status')
  @Permissions('subscriptions:write')
  @ApiOperation({ summary: '[Admin] Update subscription status' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateSubscriptionStatusDto,
  ) {
    return this.subscriptionsService.updateSubscriptionStatus(id, dto);
  }

  /**
   * Override usage limits for a specific subscription
   */
  @Post(':id/override-limits')
  @Permissions('subscriptions:write')
  @ApiOperation({ summary: '[Admin] Override subscription usage limits' })
  async overrideLimits(
    @Param('id') id: string,
    @Body() dto: OverrideLimitsDto,
  ) {
    return this.subscriptionsService.overrideLimits(id, dto);
  }

  /**
   * Manually assign a plan to a user (free access, testing, etc.)
   */
  @Post('assign')
  @Permissions('subscriptions:write')
  @ApiOperation({ summary: '[Admin] Manually assign subscription to user' })
  async assignSubscription(
    @Body('userId') userId: string,
    @Body('planId') planId: string,
    @Body('reason') reason?: string,
  ) {
    return this.userSubscriptionsService.manuallyAssign(userId, planId, reason);
  }

  /**
   * Get subscription statistics dashboard
   */
  @Get('statistics/overview')
  @Permissions('subscriptions:read')
  @ApiOperation({ summary: '[Admin] Get subscription statistics' })
  async getStatistics() {
    return this.userSubscriptionsService.getStatistics();
  }
}
