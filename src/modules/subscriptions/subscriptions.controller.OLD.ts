// import {
//   Controller,
//   Get,
//   Post,
//   Put,
//   Delete,
//   Patch,
//   Param,
//   Body,
//   UseGuards,
//   Query,
// } from '@nestjs/common';
// import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
// import { SubscriptionsService } from './subscriptions.service';
// import { CreateSubscriptionPlanDto } from './dto/create-subscription-plan.dto';
// import { UpdateSubscriptionPlanDto } from './dto/update-subscription-plan.dto';
// import { CreateCheckoutDto } from './dto/create-checkout.dto';
// import { UpgradeSubscriptionDto } from './dto/upgrade-subscription.dto';
// import { UpdateSubscriptionStatusDto } from './dto/update-subscription-status.dto';
// import { ProcessRefundDto } from './dto/process-refund.dto';
// import { OverrideLimitsDto } from './dto/override-limits.dto';
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
// import { PermissionsGuard } from '../../common/guards/permissions.guard';
// import { Permissions } from '../../common/decorators/permissions.decorator';
// import { CurrentUser } from '../auth/decorators/current-user.decorator';

// @ApiTags('Subscriptions & Payments')
// @Controller()
// export class SubscriptionsController {
//   constructor(private readonly subscriptionsService: SubscriptionsService) {}

//   // Public Routes - Consolidated subscription plans
//   @Get('subscription-plans')
//   @ApiOperation({ summary: 'List subscription plans' })
//   getSubscriptionPlans(@Query('admin') admin?: string) {
//     if (admin === 'true') {
//       return this.subscriptionsService.getAllPlans();
//     }
//     return this.subscriptionsService.getAvailablePlans();
//   }

//   // Customer Routes
//   @Get('subscriptions/my')
//   @UseGuards(JwtAuthGuard, PermissionsGuard)
//   @Permissions('subscriptions:read_own')
//   @ApiBearerAuth('JWT-auth')
//   @ApiOperation({ summary: 'Get my active subscription' })
//   getMySubscription(@CurrentUser() user: any) {
//     return this.subscriptionsService.getMySubscription(user.id);
//   }

//   @Post('subscriptions/checkout')
//   @UseGuards(JwtAuthGuard, PermissionsGuard)
//   @Permissions('subscriptions:write_own')
//   @ApiBearerAuth('JWT-auth')
//   @ApiOperation({ summary: 'Create checkout session' })
//   createCheckout(@Body() dto: CreateCheckoutDto, @CurrentUser() user: any) {
//     return this.subscriptionsService.createCheckout(dto, user.id);
//   }

//   @Post('subscriptions/cancel')
//   @UseGuards(JwtAuthGuard, PermissionsGuard)
//   @Permissions('subscriptions:write_own')
//   @ApiBearerAuth('JWT-auth')
//   @ApiOperation({ summary: 'Cancel subscription' })
//   cancelSubscription(@CurrentUser() user: any) {
//     return this.subscriptionsService.cancelSubscription(user.id);
//   }

//   @Post('subscriptions/upgrade')
//   @UseGuards(JwtAuthGuard, PermissionsGuard)
//   @Permissions('subscriptions:write_own')
//   @ApiBearerAuth('JWT-auth')
//   @ApiOperation({ summary: 'Upgrade plan' })
//   upgradeSubscription(@Body() dto: UpgradeSubscriptionDto, @CurrentUser() user: any) {
//     return this.subscriptionsService.upgradeSubscription(dto, user.id);
//   }

//   // Extended Operations - Usage Tracking
//   @Get('subscriptions/my/usage')
//   @UseGuards(JwtAuthGuard, PermissionsGuard)
//   @Permissions('subscriptions:read_own')
//   @ApiBearerAuth('JWT-auth')
//   @ApiOperation({ summary: 'Get current usage stats' })
//   getMyUsage(@CurrentUser() user: any) {
//     return this.subscriptionsService.getMyUsage(user.id);
//   }

//   @Get('subscriptions/my/limits')
//   @UseGuards(JwtAuthGuard, PermissionsGuard)
//   @Permissions('subscriptions:read_own')
//   @ApiBearerAuth('JWT-auth')
//   @ApiOperation({ summary: 'Get plan limits' })
//   getMyLimits(@CurrentUser() user: any) {
//     return this.subscriptionsService.getMyLimits(user.id);
//   }

//   @Get('payments/my')
//   @UseGuards(JwtAuthGuard, PermissionsGuard)
//   @Permissions('payments:read_own')
//   @ApiBearerAuth('JWT-auth')
//   @ApiOperation({ summary: 'List my payments' })
//   getMyPayments(@CurrentUser() user: any) {
//     return this.subscriptionsService.getMyPayments(user.id);
//   }

//   @Get('payments/:id/receipt')
//   @UseGuards(JwtAuthGuard, PermissionsGuard)
//   @Permissions('payments:read_own')
//   @ApiBearerAuth('JWT-auth')
//   @ApiOperation({ summary: 'Download receipt' })
//   downloadReceipt(@Param('id') id: string, @CurrentUser() user: any) {
//     return this.subscriptionsService.downloadReceipt(id, user.id);
//   }

//   @Get('payments/:id/invoice')
//   @UseGuards(JwtAuthGuard, PermissionsGuard)
//   @Permissions('payments:read_own')
//   @ApiBearerAuth('JWT-auth')
//   @ApiOperation({ summary: 'Generate formal invoice' })
//   generateInvoice(@Param('id') id: string, @CurrentUser() user: any) {
//     return this.subscriptionsService.generateInvoice(id, user.id);
//   }

//   @Post('payments/:id/resend-receipt')
//   @UseGuards(JwtAuthGuard, PermissionsGuard)
//   @Permissions('payments:read_own')
//   @ApiBearerAuth('JWT-auth')
//   @ApiOperation({ summary: 'Resend receipt email' })
//   resendReceipt(@Param('id') id: string, @CurrentUser() user: any) {
//     return this.subscriptionsService.resendReceipt(id, user.id);
//   }

//   // Admin Routes
//   @Post('subscription-plans')
//   @UseGuards(JwtAuthGuard, PermissionsGuard)
//   @Permissions('subscription_plans:write')
//   @ApiBearerAuth('JWT-auth')
//   @ApiOperation({ summary: 'Create plan' })
//   createPlan(@Body() dto: CreateSubscriptionPlanDto) {
//     return this.subscriptionsService.createPlan(dto);
//   }

//   @Put('subscription-plans/:id')
//   @UseGuards(JwtAuthGuard, PermissionsGuard)
//   @Permissions('subscription_plans:write')
//   @ApiBearerAuth('JWT-auth')
//   @ApiOperation({ summary: 'Update plan' })
//   updatePlan(@Param('id') id: string, @Body() dto: UpdateSubscriptionPlanDto) {
//     return this.subscriptionsService.updatePlan(id, dto);
//   }

//   @Delete('subscription-plans/:id')
//   @UseGuards(JwtAuthGuard, PermissionsGuard)
//   @Permissions('subscription_plans:delete')
//   @ApiBearerAuth('JWT-auth')
//   @ApiOperation({ summary: 'Delete plan' })
//   deletePlan(@Param('id') id: string) {
//     return this.subscriptionsService.deletePlan(id);
//   }

//   @Get('subscriptions')
//   @UseGuards(JwtAuthGuard, PermissionsGuard)
//   @Permissions('subscriptions:read')
//   @ApiBearerAuth('JWT-auth')
//   @ApiOperation({ summary: 'List all subscriptions' })
//   getAllSubscriptions() {
//     return this.subscriptionsService.getAllSubscriptions();
//   }

//   @Get('subscriptions/:id')
//   @UseGuards(JwtAuthGuard, PermissionsGuard)
//   @Permissions('subscriptions:read')
//   @ApiBearerAuth('JWT-auth')
//   @ApiOperation({ summary: 'Get subscription details' })
//   getSubscription(@Param('id') id: string) {
//     return this.subscriptionsService.getSubscription(id);
//   }

//   @Patch('subscriptions/:id/status')
//   @UseGuards(JwtAuthGuard, PermissionsGuard)
//   @Permissions('subscriptions:write')
//   @ApiBearerAuth('JWT-auth')
//   @ApiOperation({ summary: 'Update subscription status' })
//   updateSubscriptionStatus(@Param('id') id: string, @Body() dto: UpdateSubscriptionStatusDto) {
//     return this.subscriptionsService.updateSubscriptionStatus(id, dto);
//   }

//   @Post('subscriptions/:id/override-limits')
//   @UseGuards(JwtAuthGuard, PermissionsGuard)
//   @Permissions('subscriptions:write')
//   @ApiBearerAuth('JWT-auth')
//   @ApiOperation({ summary: 'Admin override limits' })
//   overrideLimits(@Param('id') id: string, @Body() dto: OverrideLimitsDto) {
//     return this.subscriptionsService.overrideLimits(id, dto);
//   }

//   @Post('payments/:id/refund')
//   @UseGuards(JwtAuthGuard, PermissionsGuard)
//   @Permissions('payments:refund')
//   @ApiBearerAuth('JWT-auth')
//   @ApiOperation({ summary: 'Process refund' })
//   processRefund(@Param('id') id: string, @Body() dto: ProcessRefundDto) {
//     return this.subscriptionsService.processRefund(id, dto);
//   }

//   @Get('payments')
//   @UseGuards(JwtAuthGuard, PermissionsGuard)
//   @Permissions('payments:read')
//   @ApiBearerAuth('JWT-auth')
//   @ApiOperation({ summary: 'List all payments' })
//   getAllPayments() {
//     return this.subscriptionsService.getAllPayments();
//   }
// }
