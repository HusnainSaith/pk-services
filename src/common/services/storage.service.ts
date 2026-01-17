import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { extname } from 'path';

@Injectable()
export class StorageService {
  private s3Client: S3Client;
  private bucket: string;
  private region: string;
  private endpoint: string;
  private readonly logger = new Logger(StorageService.name);

  constructor(private readonly configService: ConfigService) {
    this.region = this.configService.get<string>('AWS_REGION') || 'us-east-1';
    this.endpoint = this.configService.get<string>('AWS_S3_ENDPOINT');
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>(
      'AWS_SECRET_ACCESS_KEY',
    );
    this.bucket = this.configService.get<string>('AWS_S3_BUCKET');

    this.logger.debug(
      `S3 Config - Region: ${this.region}, Bucket: ${this.bucket}, Endpoint: ${this.endpoint}`,
    );

    if (!accessKeyId || !secretAccessKey || !this.bucket) {
      this.logger.error('AWS S3 configuration is missing');
    }

    const clientConfig: any = {
      region: this.region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      // Use path-style addressing
      forcePathStyle: true,
      // Disable signature validation for path-style requests
      s3ForcePathStyle: true,
    };

    // Add custom endpoint if configured (for LocalStack, MinIO, etc.)
    if (this.endpoint) {
      clientConfig.endpoint = this.endpoint;
      this.logger.debug(`Using custom S3 endpoint: ${this.endpoint}`);
    } else {
      // For AWS S3, explicitly set the endpoint to the regional endpoint
      // This helps avoid redirect issues
      clientConfig.endpoint = `https://s3.${this.region}.amazonaws.com`;
      this.logger.debug(
        `Using AWS regional endpoint: ${clientConfig.endpoint}`,
      );
    }

    this.s3Client = new S3Client(clientConfig);
  }

  async uploadFile(
    file: Express.Multer.File,
    pathPrefix: string,
  ): Promise<{ path: string; publicUrl: string }> {
    try {
      const fileExt = extname(file.originalname);
      const fileName = `${uuidv4()}${fileExt}`;
      const filePath = `${pathPrefix}/${fileName}`;

      // Minimal logging - only info level for production
      if (process.env.NODE_ENV !== 'production') {
        this.logger.debug(`Uploading: ${filePath}`);
      }

      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: filePath,
        Body: file.buffer,
        ContentType: file.mimetype,
      });

      // Send to S3 without waiting for response processing
      await this.s3Client.send(command);

      // Build URL while S3 confirms receipt
      const publicUrl = this.endpoint
        ? `${this.endpoint}/${this.bucket}/${filePath}`
        : `https://s3.${this.region}.amazonaws.com/${this.bucket}/${filePath}`;

      return {
        path: filePath,
        publicUrl,
      };
    } catch (error) {
      this.logger.error(`Upload failed: ${error.message}`);

      if (
        error.Code === 'InvalidAccessKeyId' ||
        error.Code === 'SignatureDoesNotMatch'
      ) {
        throw new BadRequestException('AWS credentials invalid');
      }

      throw new BadRequestException('File upload failed');
    }
  }

  async getSignedUrl(path: string, expiresIn = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: path,
      });

      return getSignedUrl(this.s3Client, command, { expiresIn });
    } catch (error) {
      this.logger.error(`Error generating signed URL: ${error.message}`);
      throw new BadRequestException('Failed to generate secure link');
    }
  }

  async deleteFile(path: string): Promise<void> {
    try {
      this.logger.debug(
        `Deleting S3 object - Bucket: ${this.bucket}, Key: ${path}`,
      );
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: path,
      });
      await this.s3Client.send(command);
      this.logger.debug(`Successfully deleted: ${path}`);
    } catch (error) {
      this.logger.error(
        `Error deleting file - Key: ${path}, Error: ${error.message}`,
      );
      throw new BadRequestException('Failed to delete file');
    }
  }

  getBucketName(): string {
    return this.bucket;
  }
}
