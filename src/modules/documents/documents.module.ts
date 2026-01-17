import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { Document } from './entities/document.entity';
import { User } from '../users/entities/user.entity';
import { ServiceType } from '../service-requests/entities/service-type.entity';
import { ServiceRequest } from '../service-requests/entities/service-request.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { ConfigModule } from '@nestjs/config';
import { StorageService } from '../../common/services/storage.service';
import { multerConfig } from './multer.config';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Document, User, ServiceType, ServiceRequest]),
    ConfigModule,
    NotificationsModule,
    MulterModule.register(multerConfig),
    UsersModule,
  ],
  controllers: [DocumentsController],
  providers: [DocumentsService, StorageService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
