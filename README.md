# PK SERVIZI - Professional Services Platform

A complete NestJS backend system for managing professional services, subscriptions, and payments with Stripe integration.

## Features

- 🔐 JWT Authentication & Authorization with role-based permissions
- 💳 Stripe Payment Integration (Checkout, Subscriptions, Webhooks)
- 📄 Automated Invoice Generation with PDF
- 📧 Email Notifications (Welcome, Payment Confirmations, Invoices)
- 📅 Appointment Management
- 📋 Service Request Processing
- 👥 User & Family Member Management
- 📊 Admin Dashboard & Reports
- 🔍 Audit Logging
- 🎓 Course Management
- 📝 CMS for Pages, News, FAQs

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Stripe Account (Test mode)

### Installation

```bash
# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
npm run migration:run

# Seed initial data
npm run seed

# Start development server
npm run start:dev
```

### Environment Variables

```env
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=your_password
DATABASE_NAME=pk_servizi

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRATION=1d

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_BASIC_MONTHLY=price_...
STRIPE_PRICE_BASIC_ANNUAL=price_...
STRIPE_PRICE_PROFESSIONAL_MONTHLY=price_...
STRIPE_PRICE_PROFESSIONAL_ANNUAL=price_...
STRIPE_PRICE_PREMIUM_MONTHLY=price_...
STRIPE_PRICE_PREMIUM_ANNUAL=price_...

# Email (Gmail SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@pkservizi.com

# Frontend
FRONTEND_URL=http://localhost:3001
```

## API Documentation

Once running, visit: `http://localhost:3000/api/docs`

## Project Structure

```
src/
├── common/          # Shared utilities, guards, decorators
├── config/          # Configuration files
├── modules/         # Feature modules
│   ├── auth/        # Authentication & authorization
│   ├── users/       # User management
│   ├── subscriptions/ # Subscription plans & management
│   ├── payments/    # Payment processing & invoices
│   ├── webhooks/    # Stripe webhook handlers
│   ├── service-requests/ # Service request workflow
│   ├── appointments/ # Appointment scheduling
│   ├── documents/   # Document management
│   ├── notifications/ # Email & in-app notifications
│   ├── courses/     # Course management
│   ├── cms/         # Content management
│   ├── reports/     # Analytics & reporting
│   ├── admin/       # Admin operations
│   └── audit/       # Audit logging
└── main.ts          # Application entry point
```

## Available Scripts

```bash
# Development
npm run start:dev          # Start with hot-reload
npm run build              # Build for production
npm run start:prod         # Run production build

# Database
npm run migration:generate # Generate new migration
npm run migration:run      # Run pending migrations
npm run migration:revert   # Revert last migration
npm run seed               # Seed database with initial data

# Testing
npm run test               # Run unit tests
npm run test:e2e           # Run end-to-end tests
npm run test:cov           # Generate coverage report

# Code Quality
npm run lint               # Lint code
npm run format             # Format code with Prettier
```

## Stripe Setup

1. Create products and prices in Stripe Dashboard
2. Copy price IDs to `.env`
3. Set up webhook endpoint: `https://your-domain.com/api/v1/webhooks/stripe`
4. Add webhook secret to `.env`
5. Select events: `checkout.session.completed`, `customer.subscription.*`, `invoice.*`

## Production Deployment

### Using Docker

```bash
# Build image
docker build -t pk-servizi .

# Run container
docker-compose up -d
```

### Manual Deployment

```bash
# Build application
npm run build

# Run migrations
npm run migration:run

# Start production server
npm run start:prod
```

## Support

For issues or questions, contact: support@pkservizi.com

## License

Proprietary - All rights reserved
