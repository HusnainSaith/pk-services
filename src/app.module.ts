import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RolesModule } from './modules/roles/roles.module';
import { ServiceRequestsModule } from './modules/service-requests/service-requests.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { CoursesModule } from './modules/courses/courses.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { CmsModule } from './modules/cms/cms.module';
import { ReportsModule } from './modules/reports/reports.module';
import { AdminModule } from './modules/admin/admin.module';
import { AuditModule } from './modules/audit/audit.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { AwsModule } from './modules/aws/aws.module';
import { SharedModule } from './modules/shared/shared.module';

import databaseConfig from './config/database.config';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { StandardResponseInterceptor } from './common/interceptors/standard-response.interceptor';
import { HealthController } from './health.controller';

@Module({
  imports: [
    // Configuration with optimized settings
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      cache: true,
      expandVariables: true,
      validationOptions: {
        allowUnknown: false,
        abortEarly: true,
      },
    }),

    // Optimized database configuration
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: databaseConfig,
      inject: [ConfigService],
    }),

    // Enhanced throttling
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const isProduction = config.get('NODE_ENV') === 'production';
        return {
          throttlers: [
            {
              name: 'short',
              ttl: config.get<number>('THROTTLE_TTL', 60000),
              limit: config.get<number>(
                'THROTTLE_LIMIT',
                isProduction ? 100 : 300,
              ),
            },
            {
              name: 'long',
              ttl: config.get<number>('THROTTLE_LONG_TTL', 3600000), // 1 hour
              limit: config.get<number>(
                'THROTTLE_LONG_LIMIT',
                isProduction ? 1000 : 3000,
              ),
            },
          ],
        };
      },
    }),

    // Shared services (global)
    SharedModule,

    // AWS services
    AwsModule,

    // Core modules
    AuthModule,
    UsersModule,
    RolesModule,

    // Business modules
    ServiceRequestsModule,
    DocumentsModule,
    AppointmentsModule,
    CoursesModule,
    SubscriptionsModule,
    PaymentsModule,
    NotificationsModule,
    CmsModule,
    ReportsModule,
    AdminModule,
    AuditModule,
    WebhooksModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: StandardResponseInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule {}
