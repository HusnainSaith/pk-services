import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceRequestsController } from './service-requests.controller';
import { ServiceRequestsService } from './service-requests.service';
import { ServiceTypesController } from './service-types.controller';
import { ServiceTypesService } from './service-types.service';
import { ServiceRequest } from './entities/service-request.entity';
import { ServiceType } from './entities/service-type.entity';
import { RequestStatusHistory } from './entities/request-status-history.entity';
import { IseeRequest } from './entities/isee-request.entity';
import { Modello730Request } from './entities/modello-730-request.entity';
import { ImuRequest } from './entities/imu-request.entity';
import { User } from '../users/entities/user.entity';
import { UserSubscription } from '../subscriptions/entities/user-subscription.entity';
import { SubscriptionPlan } from '../subscriptions/entities/subscription-plan.entity';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ServiceRequest,
      ServiceType,
      RequestStatusHistory,
      IseeRequest,
      Modello730Request,
      ImuRequest,
      User,
      UserSubscription,
      SubscriptionPlan,
    ]),
    SubscriptionsModule,
    NotificationsModule,
    UsersModule,
  ],
  controllers: [ServiceRequestsController, ServiceTypesController],
  providers: [ServiceRequestsService, ServiceTypesService],
  exports: [ServiceRequestsService, ServiceTypesService],
})
export class ServiceRequestsModule {}
