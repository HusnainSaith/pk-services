import { Injectable, Logger } from '@nestjs/common';
import { AwsS3FolderService } from '../../modules/aws/services/aws-s3-folder.service';
import { StorageService } from './storage.service';

/**
 * AWS S3 Upload Helper Service
 * Integrates folder structure with file uploads
 * Simplifies uploading files to user-specific folders
 */
@Injectable()
export class AwsS3UploadService {
  private readonly logger = new Logger(AwsS3UploadService.name);

  constructor(
    private readonly storageService: StorageService,
    private readonly awsS3FolderService: AwsS3FolderService,
  ) {}

  /**
   * Upload profile image for user
   * Automatically places in users/{userId}/profile/ folder
   */
  async uploadProfileImage(
    userId: string,
    file: Express.Multer.File,
  ): Promise<{ path: string; publicUrl: string }> {
    const profileFolderPath =
      this.awsS3FolderService.getProfileFolderPath(userId);

    this.logger.debug(
      `Uploading profile image for user ${userId} to ${profileFolderPath}`,
    );

    return this.storageService.uploadFile(file, profileFolderPath);
  }

  /**
   * Upload service document for user
   * Automatically places in users/{userId}/services/{serviceType}/ folder
   */
  async uploadServiceDocument(
    userId: string,
    serviceType: string,
    file: Express.Multer.File,
  ): Promise<{ path: string; publicUrl: string }> {
    const serviceFolderPath = this.awsS3FolderService.getServicesFolderPath(
      userId,
      serviceType,
    );

    this.logger.debug(
      `Uploading service document for user ${userId}, type ${serviceType} to ${serviceFolderPath}`,
    );

    return this.storageService.uploadFile(file, serviceFolderPath);
  }

  /**
   * Get upload path for profile images
   */
  getProfileImagePath(userId: string): string {
    return this.awsS3FolderService.getProfileFolderPath(userId);
  }

  /**
   * Get upload path for service documents
   */
  getServiceDocumentPath(userId: string, serviceType: string): string {
    return this.awsS3FolderService.getServicesFolderPath(userId, serviceType);
  }

  /**
   * Get all folder paths for user
   */
  getUserFolderPaths(userId: string) {
    return this.awsS3FolderService.getUserFolderPaths(userId);
  }
}
