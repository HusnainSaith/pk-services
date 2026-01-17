import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminRequestManagementService } from './admin-request-management.service';
import { AdminRequestManagementController } from './admin-request-management.controller';
import { User } from '../users/entities/user.entity';
import { ServiceRequest } from '../service-requests/entities/service-request.entity';
import { Payment } from '../payments/entities/payment.entity';
import { Document } from '../documents/entities/document.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { AdminDashboardService } from './admin-dashboard.service';
import { AdminUserManagementService } from './admin-user-management.service';
import { Appointment } from '../appointments/entities/appointment.entity';
import { UserSubscription } from '../subscriptions/entities/user-subscription.entity';
import { SubscriptionPlan } from '../subscriptions/entities/subscription-plan.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      ServiceRequest,
      Payment,
      Document,
      Appointment,
      UserSubscription,
      SubscriptionPlan,
    ]),
    NotificationsModule,
  ],
  controllers: [AdminController, AdminRequestManagementController],
  providers: [
    AdminService,
    AdminDashboardService,
    AdminUserManagementService,
    AdminRequestManagementService,
  ],
  exports: [AdminService, AdminDashboardService, AdminRequestManagementService],
})
export class AdminModule {}
