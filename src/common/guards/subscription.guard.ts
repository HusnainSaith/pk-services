import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserSubscriptionsService } from '../../modules/subscriptions/user-subscriptions.service';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private userSubscriptionsService: UserSubscriptionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Allow admin and operators to bypass subscription check
    if (user.role?.name === 'admin' || user.role?.name === 'operator') {
      return true;
    }

    // Check if user has active subscription
    const activeSubscription =
      await this.userSubscriptionsService.findActiveByUser(user.id);

    if (!activeSubscription) {
      throw new ForbiddenException(
        'Active subscription required to create service requests',
      );
    }

    return true;
  }
}
