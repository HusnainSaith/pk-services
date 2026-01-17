import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { User } from '../users/entities/user.entity';
import { ServiceRequest } from '../service-requests/entities/service-request.entity';
import { Appointment } from '../appointments/entities/appointment.entity';
import { Payment } from '../payments/entities/payment.entity';
import { UserSubscription } from '../subscriptions/entities/user-subscription.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      ServiceRequest,
      Appointment,
      Payment,
      UserSubscription,
    ]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
