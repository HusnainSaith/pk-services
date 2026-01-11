# 🚀 Quick Start Guide - PK SERVIZI Backend

## Server Commands

```bash
# Development
npm run start:dev          # Start in watch mode

# Production
npm run build              # Build for production
npm run start:prod         # Start production server

# Database
npm run migration:run      # Run pending migrations
npm run migration:revert   # Revert last migration
npm run seed:all           # Seed database with initial data
npm run db:reset           # Reset & reseed database

# Testing
npm test                   # Run unit tests
npm run test:watch         # Run tests in watch mode
npm run test:cov           # Run with coverage
npm run test:e2e           # Run e2e tests

# Docker
npm run docker:dev         # Start in Docker (dev)
npm run docker:down        # Stop Docker containers
npm run docker:logs        # View logs
```

## API Endpoints Quick Reference

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh` - Refresh token
- `GET /api/v1/auth/me` - Get current user

### Service Requests
- `POST /api/v1/service-requests` - Create request (requires subscription)
- `GET /api/v1/service-requests/my` - Get my requests
- `POST /api/v1/service-requests/:id/submit` - Submit request
- `GET /api/v1/service-types` - List available services

### Subscriptions
- `GET /api/v1/subscription-plans` - List plans
- `POST /api/v1/subscriptions/checkout` - Create checkout session
- `GET /api/v1/subscriptions/my` - My subscription
- `POST /api/v1/subscriptions/cancel` - Cancel subscription

### Documents
- `POST /api/v1/documents/upload-multiple` - Upload documents
- `GET /api/v1/documents/request/:requestId` - Get request documents
- `PATCH /api/v1/documents/:id/approve` - Approve (admin)

### Appointments
- `GET /api/v1/appointments/available-slots` - Available slots
- `POST /api/v1/appointments` - Book appointment
- `GET /api/v1/appointments/my` - My appointments

### Admin
- `GET /api/v1/admin/dashboard/stats` - Dashboard stats
- `GET /api/v1/admin/requests` - All requests
- `POST /api/v1/admin/requests/:id/assign` - Assign operator

## Environment Variables

```env
# Required
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=pk_servizi
JWT_SECRET=your_jwt_secret
STRIPE_SECRET_KEY=sk_test_xxx

# Optional
SMTP_HOST=smtp.gmail.com
SMTP_USER=your_email
AWS_ACCESS_KEY_ID=your_key
AWS_S3_BUCKET=your_bucket
```

## Test Admin Login

```json
{
  "email": "admin_labverse@gmail.com",
  "password": "Admin@12345"
}
```

## Common Issues & Solutions

### Port Already in Use
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or change port in .env
API_PORT=3001
```

### Database Connection Failed
```bash
# Check PostgreSQL is running
# Update .env with correct credentials
npm run migration:run
```

### Stripe Webhook Testing
```bash
# Use Stripe CLI
stripe listen --forward-to localhost:3000/api/v1/webhooks/stripe
```

## URLs

- **API**: http://localhost:3000
- **Swagger Docs**: http://localhost:3000/api/docs
- **Health Check**: http://localhost:3000/health

## File Upload

Max file size: 10MB  
Supported formats: PDF, JPG, PNG, DOC, DOCX

## Subscription Enforcement

⚠️ Users **must have an active subscription** to create service requests. The system automatically:
- Checks subscription status
- Validates service access per plan
- Enforces monthly limits
- Blocks expired subscriptions

---

Need help? Check [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) for detailed documentation.
