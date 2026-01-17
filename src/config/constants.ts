/**
 * Application-wide constants
 * Centralized configuration for magic strings, numbers, and enums
 */

// ============================================================================
// VALIDATION CONSTRAINTS
// ============================================================================

export const VALIDATION = {
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    PATTERN: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    MESSAGE:
      'Password must contain at least one uppercase, lowercase, and number',
  },
  EMAIL: {
    MAX_LENGTH: 255,
  },
  NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 100,
  },
  FIRST_NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 50,
  },
  ADDRESS: {
    MAX_LENGTH: 255,
  },
  CITY: {
    MAX_LENGTH: 100,
  },
  POSTAL_CODE: {
    LENGTH: 5,
    PATTERN: /^\d{5}$/,
  },
  PROVINCE: {
    LENGTH: 2,
    PATTERN: /^[A-Z]{2}$/,
  },
  PHONE: {
    MIN_LENGTH: 10,
  },
  FISCAL_CODE: {
    LENGTH: 16,
  },
} as const;

// ============================================================================
// ENTITY STATUSES
// ============================================================================

export const REQUEST_STATUS = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  IN_REVIEW: 'in_review',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  COMPLETED: 'completed',
} as const;

export const SUBSCRIPTION_STATUS = {
  ACTIVE: 'active',
  PAUSED: 'paused',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
} as const;

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
} as const;

export const APPOINTMENT_STATUS = {
  SCHEDULED: 'scheduled',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show',
} as const;

export const DOCUMENT_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

export const BILLING_CYCLE = {
  MONTHLY: 'monthly',
  QUARTERLY: 'quarterly',
  YEARLY: 'yearly',
} as const;

// ============================================================================
// FILE OPERATIONS
// ============================================================================

export const FILE_CONSTRAINTS = {
  AVATAR: {
    MAX_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
    ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.webp'],
  },
  DOCUMENT: {
    MAX_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_TYPES: ['application/pdf', 'image/jpeg', 'image/png'],
  },
  S3: {
    BUCKET_NAME: process.env.AWS_S3_BUCKET || 'pkservizi-media',
    REGION: process.env.AWS_REGION || 'eu-north-1',
    AVATAR_PREFIX: 'avatars/',
    DOCUMENT_PREFIX: 'documents/',
  },
} as const;

// ============================================================================
// PAGINATION & LIMITS
// ============================================================================

export const PAGINATION = {
  DEFAULT_SKIP: 0,
  DEFAULT_TAKE: 20,
  MAX_TAKE: 100,
  MIN_TAKE: 1,
} as const;

export const RATE_LIMITS = {
  GLOBAL_LIMIT: 1000,
  GLOBAL_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
} as const;

// ============================================================================
// GDPR & PRIVACY
// ============================================================================

export const GDPR = {
  DATA_EXPORT_TIMEOUT_DAYS: 30,
  ACCOUNT_DELETION_DELAY_DAYS: 30,
  CONSENT_TYPES: ['gdpr', 'privacy', 'marketing', 'analytics'],
} as const;

// ============================================================================
// ERROR MESSAGES
// ============================================================================

export const ERROR_MESSAGES = {
  NOT_FOUND: '{resource} not found',
  INVALID_ID: 'ID is not a valid UUID',
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Forbidden',
  CONFLICT: 'Resource already exists',
  VALIDATION_ERROR: 'Validation failed',
  INTERNAL_ERROR: 'Internal server error',
  S3_UPLOAD_ERROR: 'Failed to upload file',
  DATABASE_ERROR: 'Database operation failed',
} as const;

// ============================================================================
// SUCCESS MESSAGES
// ============================================================================

export const SUCCESS_MESSAGES = {
  CREATED: '{resource} created successfully',
  UPDATED: '{resource} updated successfully',
  DELETED: '{resource} deleted successfully',
  RETRIEVED: '{resource} retrieved successfully',
  UPLOADED: 'File uploaded successfully',
} as const;

// ============================================================================
// DATABASE
// ============================================================================

export const DATABASE = {
  POOL_SIZE: 10,
  CONNECTION_TIMEOUT_MS: 5000,
} as const;

// ============================================================================
// JWT & AUTH
// ============================================================================

export const JWT = {
  ACCESS_TOKEN_EXPIRY: '7h',
  REFRESH_TOKEN_EXPIRY: '7d',
  ALGORITHM: 'HS256',
} as const;

// ============================================================================
// BUSINESS LOGIC
// ============================================================================

export const BUSINESS_RULES = {
  MIN_SUBSCRIPTION_DURATION_DAYS: 1,
  MAX_CONCURRENT_APPOINTMENTS: 3,
  APPOINTMENT_REMINDER_HOURS: 24,
  SERVICE_REQUEST_TIMEOUT_DAYS: 30,
} as const;

// ============================================================================
// TYPE UNIONS FOR TYPESAFETY
// ============================================================================

export type RequestStatus =
  (typeof REQUEST_STATUS)[keyof typeof REQUEST_STATUS];
export type SubscriptionStatus =
  (typeof SUBSCRIPTION_STATUS)[keyof typeof SUBSCRIPTION_STATUS];
export type PaymentStatus =
  (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];
export type AppointmentStatus =
  (typeof APPOINTMENT_STATUS)[keyof typeof APPOINTMENT_STATUS];
export type DocumentStatus =
  (typeof DOCUMENT_STATUS)[keyof typeof DOCUMENT_STATUS];
export type BillingCycle = (typeof BILLING_CYCLE)[keyof typeof BILLING_CYCLE];
