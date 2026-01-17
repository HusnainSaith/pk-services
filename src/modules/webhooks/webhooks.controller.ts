import {
  Controller,
  Post,
  Get,
  Body,
  Headers,
  RawBodyRequest,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WebhooksService } from './webhooks.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Request } from 'express';

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('stripe')
  @ApiOperation({ summary: '[Public] Stripe webhook handler' })
  handleStripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    return this.webhooksService.handleStripeWebhook(req.rawBody, signature);
  }

  // Extended Operations - Testing & Logging
  @Post('stripe/test')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('webhooks:test')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[Admin] Test webhook (dev environment)' })
  testStripeWebhook(@Body() testPayload: Record<string, unknown>) {
    return this.webhooksService.testStripeWebhook(testPayload);
  }

  @Get('logs')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('webhooks:read')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[Admin] View webhook processing logs' })
  getWebhookLogs() {
    return this.webhooksService.getWebhookLogs();
  }
}
