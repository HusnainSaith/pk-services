import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { GlobalValidationPipe } from './common/pipes/global-validation.pipe';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import * as compression from 'compression';

async function bootstrap() {
  // Create app with rawBody enabled for Stripe webhooks
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
    bufferLogs: true,
    rawBody: true,
  });

  const configService = app.get(ConfigService);
  const isProduction = configService.get('NODE_ENV') === 'production';
  const port = configService.get<number>('API_PORT', 3000);

  // Compression middleware for faster response times
  app.use(
    compression({
      filter: (req, res) => {
        if (req.headers['x-no-compression']) {
          return false;
        }
        return compression.filter(req, res);
      },
      threshold: 1024, // Only compress responses larger than 1KB
      level: 6, // Balance between speed and compression ratio
    }),
  );

  // Security middleware
  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'img-src': ["'self'", 'data:', 'https:'],
          'script-src': ["'self'", "'unsafe-inline'"],
          'style-src': ["'self'", "'unsafe-inline'"],
        },
      },
      crossOriginEmbedderPolicy: false,
    }),
  );

  // Rate limiting with environment-specific settings
  const rateLimitConfig = {
    windowMs: configService.get<number>('RATE_LIMIT_WINDOW', 60000),
    limit: configService.get<number>(
      'RATE_LIMIT_MAX',
      isProduction ? 100 : 300,
    ),
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
    },
  };

  app.use(rateLimit(rateLimitConfig));

  // CORS configuration
  const corsOrigins = configService
    .get<string>('CORS_ORIGINS', 'http://localhost:3001')
    .split(',');
  app.enableCors({
    origin: corsOrigins,
    credentials: configService.get<boolean>('CORS_CREDENTIALS', true),
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Authorization, X-Requested-With',
    optionsSuccessStatus: 200,
  });

  // Global pipes and filters
  app.useGlobalPipes(new GlobalValidationPipe());

  app.useGlobalFilters(new GlobalExceptionFilter());

  // API versioning
  app.setGlobalPrefix('api/v1', {
    exclude: ['health', 'metrics'],
  });

  // Swagger documentation (only in development)
  if (!isProduction) {
    const config = new DocumentBuilder()
      .setTitle('PK SERVIZI API')
      .setDescription(
        'Complete service management system API with optimized performance',
      )
      .setVersion('1.0')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        'JWT-auth',
      )
      .addTag('Authentication', 'User authentication and authorization')
      .addTag('Users', 'User management operations')
      .addTag('Appointments', 'Appointment booking and management')
      .addTag('Service Requests', 'Service request processing')
      .addTag('Documents', 'Document management')
      .addTag('Payments', 'Payment processing')
      .addTag('Admin', 'Administrative operations')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        showExtensions: true,
      },
      customSiteTitle: 'PK SERVIZI API Documentation',
    });
  }

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully');
    await app.close();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully');
    await app.close();
    process.exit(0);
  });

  // Start server
  await app.listen(port, '0.0.0.0');

  console.log(`🚀 PK SERVIZI API running on: http://localhost:${port}`);
  console.log(
    `📊 Environment: ${configService.get('NODE_ENV', 'development')}`,
  );

  if (!isProduction) {
    console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
  }

  console.log(`🔧 Health Check: http://localhost:${port}/health`);
  console.log(`⚡ Performance optimizations enabled`);
}

bootstrap().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
