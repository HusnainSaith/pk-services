import { ConfigService } from '@nestjs/config';

export interface PerformanceConfig {
  database: {
    connectionPoolSize: number;
    queryTimeout: number;
    enableLogging: boolean;
    enableCache: boolean;
    cacheSize: number;
  };
  redis: {
    enabled: boolean;
    host: string;
    port: number;
    ttl: number;
  };
  compression: {
    enabled: boolean;
    threshold: number;
  };
  rateLimit: {
    windowMs: number;
    max: number;
  };
  cors: {
    origin: string[];
    credentials: boolean;
  };
}

export const createPerformanceConfig = (configService: ConfigService): PerformanceConfig => ({
  database: {
    connectionPoolSize: configService.get<number>('DB_POOL_SIZE', 10),
    queryTimeout: configService.get<number>('DB_QUERY_TIMEOUT', 30000),
    enableLogging: configService.get<boolean>('DB_LOGGING', false),
    enableCache: configService.get<boolean>('DB_CACHE', true),
    cacheSize: configService.get<number>('DB_CACHE_SIZE', 1000),
  },
  redis: {
    enabled: configService.get<boolean>('REDIS_ENABLED', false),
    host: configService.get<string>('REDIS_HOST', 'localhost'),
    port: configService.get<number>('REDIS_PORT', 6379),
    ttl: configService.get<number>('REDIS_TTL', 3600),
  },
  compression: {
    enabled: configService.get<boolean>('COMPRESSION_ENABLED', true),
    threshold: configService.get<number>('COMPRESSION_THRESHOLD', 1024),
  },
  rateLimit: {
    windowMs: configService.get<number>('RATE_LIMIT_WINDOW', 60000),
    max: configService.get<number>('RATE_LIMIT_MAX', 100),
  },
  cors: {
    origin: configService.get<string>('CORS_ORIGINS', 'http://localhost:3001').split(','),
    credentials: configService.get<boolean>('CORS_CREDENTIALS', true),
  },
});