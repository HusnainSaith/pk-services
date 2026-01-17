import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT!, 10),
  username: process.env.DB_USER || process.env.DB_USERNAME,
  password: String(process.env.DB_PASSWORD || ''),
  database: process.env.DB_NAME || process.env.DB_DATABASE,
  entities: ['src/modules/*/entities/*.entity.ts'],
  migrations: ['migrations/*.ts'],
  synchronize: false,
  logging: process.env.TYPEORM_LOGGING === 'true',
  namingStrategy: new SnakeNamingStrategy(),
  // Connection pool optimization
  extra: {
    max: 20, // Maximum pool size
    min: 5, // Minimum pool size
    idle: 10000, // Close idle clients after 10 seconds
    connectionTimeoutMillis: 5000, // 5 second timeout
    statement_timeout: 30000, // 30 second query timeout
    query_timeout: 30000,
  },
  // Enable query result caching
  cache: {
    duration: 60000, // Cache for 1 minute
    type: 'database',
    tableName: 'query_result_cache',
  },
});
