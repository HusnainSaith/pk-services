import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { InvoiceService } from './invoice.service';
import { InvoicesController } from './invoices.controller';
import { Payment } from './entities/payment.entity';
import { Invoice } from './entities/invoice.entity';
import { User } from '../users/entities/user.entity';
import { ConfigModule } from '@nestjs/config';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { StripeService } from './stripe.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, Invoice, User]),
    ConfigModule,
    forwardRef(() => SubscriptionsModule),
    NotificationsModule,
  ],
  controllers: [PaymentsController, InvoicesController],
  providers: [PaymentsService, InvoiceService, StripeService],
  exports: [PaymentsService, InvoiceService, StripeService],
})
export class PaymentsModule {}
