import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

const databaseConfig = (configService: ConfigService): TypeOrmModuleOptions => {
  const isProduction = configService.get('NODE_ENV') === 'production';

  return {
    type: 'postgres',
    host: configService.get<string>('DB_HOST', 'localhost'),
    port: configService.get<number>('DB_PORT', 5432),
    username: configService.get<string>('DB_USER', 'postgres'),
    password: String(configService.get('DB_PASSWORD') || 'postgres'),
    database: configService.get<string>('DB_NAME', 'postgres'),

    // Performance optimizations
    extra: {
      max: configService.get<number>('DB_POOL_SIZE', 20), // Increased from 10
      min: 5, // Minimum pool size
      connectionTimeoutMillis: configService.get<number>(
        'DB_CONNECTION_TIMEOUT',
        5000,
      ),
      idleTimeoutMillis: configService.get<number>('DB_IDLE_TIMEOUT', 10000), // Reduced from 30s to 10s
      query_timeout: configService.get<number>('DB_QUERY_TIMEOUT', 30000),
    },

    entities: [__dirname + '/../modules/*/entities/*.entity.{ts,js}'],
    migrations: [__dirname + '/../../migrations/*.{ts,js}'],

    synchronize: false,
    migrationsRun: false,
    logging:
      !isProduction && configService.get<boolean>('TYPEORM_LOGGING', false),
    namingStrategy: new SnakeNamingStrategy(),

    // Query result cache (increased duration for better performance)
    cache: configService.get<boolean>('DB_CACHE', true)
      ? {
          type: 'database',
          duration: configService.get<number>('DB_CACHE_DURATION', 60000), // Increased from 30s to 60s
        }
      : false,

    maxQueryExecutionTime: configService.get<number>('DB_SLOW_QUERY_LOG', 1000),

    // SSL for production
    ssl: isProduction ? { rejectUnauthorized: false } : false,
  };
};

export default databaseConfig;
