import { ConfigService } from '@nestjs/config';
import { S3ClientConfig } from '@aws-sdk/client-s3';

export const s3Config = (config: ConfigService): S3ClientConfig => ({
  region: config.get<string>('AWS_REGION'),
  credentials: {
    accessKeyId: config.get<string>('AWS_ACCESS_KEY_ID'),
    secretAccessKey: config.get<string>('AWS_SECRET_ACCESS_KEY'),
  },
});
