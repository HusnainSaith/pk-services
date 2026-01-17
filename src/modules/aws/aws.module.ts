import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GuardsModule } from '../../common/modules/guards.module';
import { AwsS3FolderService } from './services/aws-s3-folder.service';
import { AwsS3Controller } from './controllers/aws-s3.controller';
import { AwsS3UploadService } from '../../common/services/aws-s3-upload.service';
import { StorageService } from '../../common/services/storage.service';

/**
 * AWS Module
 * Provides AWS S3 integration and folder structure management
 *
 * Features:
 * - Automatic user folder structure creation on registration
 * - Profile image storage management
 * - Service document organization by type
 */
@Module({
  imports: [ConfigModule, GuardsModule],
  providers: [AwsS3FolderService, AwsS3UploadService, StorageService],
  controllers: [AwsS3Controller],
  exports: [AwsS3FolderService, AwsS3UploadService], // Export for use in other modules
})
export class AwsModule {}
