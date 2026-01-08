import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

/**
 * AWS S3 Folder Structure Service
 * Manages automatic folder structure creation for users in S3
 *
 * Structure created:
 * users/{userId}/
 * ├── profile/                    (profile images)
 * └── services/                   (service documents)
 *     ├── ISEE/
 *     ├── Modello730/
 *     └── IMU/
 */
@Injectable()
export class AwsS3FolderService {
  private s3Client: S3Client;
  private bucket: string;
  private region: string;
  private endpoint: string;
  private readonly logger = new Logger(AwsS3FolderService.name);

  // Service types available in the platform
  private readonly SERVICE_TYPES = ['ISEE', 'Modello730', 'IMU'];

  constructor(private readonly configService: ConfigService) {
    this.region = this.configService.get<string>('AWS_REGION') || 'us-east-1';
    this.endpoint = this.configService.get<string>('AWS_S3_ENDPOINT');
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>(
      'AWS_SECRET_ACCESS_KEY',
    );
    this.bucket = this.configService.get<string>('AWS_S3_BUCKET');

    const clientConfig: any = {
      region: this.region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: true,
      s3ForcePathStyle: true,
    };

    if (this.endpoint) {
      clientConfig.endpoint = this.endpoint;
    } else {
      clientConfig.endpoint = `https://s3.${this.region}.amazonaws.com`;
    }

    this.s3Client = new S3Client(clientConfig);
  }

  /**
   * Create complete folder structure for new user
   * Called automatically when user registers
   */
  async createUserFolderStructure(userId: string): Promise<void> {
    try {
      this.logger.debug(`Creating S3 folder structure for user: ${userId}`);

      // Create profile folder
      await this.createFolder(userId, 'profile');

      // Create services folder
      await this.createFolder(userId, 'services');

      // Create service type subfolders
      for (const serviceType of this.SERVICE_TYPES) {
        await this.createFolder(userId, `services/${serviceType}`);
      }

      this.logger.log(
        `S3 folder structure created successfully for user: ${userId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to create S3 folder structure for user ${userId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Create a single folder in S3
   * Note: S3 doesn't have true folders, they are created implicitly when files are uploaded
   * We no longer create marker files - folders will exist once files are added
   */
  private async createFolder(
    userId: string,
    folderPath: string,
  ): Promise<void> {
    // Folders are created implicitly in S3 when files are uploaded
    // No need to create marker files
    this.logger.debug(`Folder will be created implicitly: users/${userId}/${folderPath}`);
  }

  /**
   * Get complete folder structure path for user profile uploads
   */
  getProfileFolderPath(userId: string): string {
    return `users/${userId}/profile`;
  }

  /**
   * Get complete folder structure path for service documents
   */
  getServicesFolderPath(userId: string, serviceType: string): string {
    return `users/${userId}/services/${serviceType}`;
  }

  /**
   * Get base user folder path
   */
  getUserFolderPath(userId: string): string {
    return `users/${userId}`;
  }

  /**
   * List all available service types
   */
  getAvailableServiceTypes(): string[] {
    return [...this.SERVICE_TYPES];
  }

  /**
   * Get all folder paths for a user
   */
  getUserFolderPaths(userId: string): {
    base: string;
    profile: string;
    services: string;
    serviceTypes: { [key: string]: string };
  } {
    const serviceTypesFolders: { [key: string]: string } = {};
    this.SERVICE_TYPES.forEach((type) => {
      serviceTypesFolders[type] = this.getServicesFolderPath(userId, type);
    });

    return {
      base: this.getUserFolderPath(userId),
      profile: this.getProfileFolderPath(userId),
      services: `users/${userId}/services`,
      serviceTypes: serviceTypesFolders,
    };
  }
}
