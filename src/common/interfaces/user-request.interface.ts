/**
 * User Request Interface
 * Represents the authenticated user attached to HTTP requests
 * Used throughout controllers to replace `any` type for @CurrentUser() decorator
 */

export interface UserRequest {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  phoneNumber?: string;
  isActive: boolean;
  permissions?: string[];
  iat?: number; // JWT issued at
  exp?: number; // JWT expiration
}

/**
 * JWT Payload Interface
 * Represents the decoded JWT token payload
 */
export interface JwtPayload {
  sub: string; // user ID
  email: string;
  role: string;
  permissions?: string[];
  iat?: number;
  exp?: number;
}

/**
 * Request with User
 * Express Request extended with authenticated user
 */
export interface RequestWithUser extends Request {
  user: UserRequest;
  rawBody?: Buffer;
}
