import { BadRequestException, Injectable } from '@nestjs/common';

/**
 * Consolidated utility class for common operations
 * Merges security, validation, and sanitization utilities
 * Removes duplicates and provides single source of truth
 */
@Injectable()
export class CommonUtil {
  /**
   * Sanitization Methods
   */

  static sanitizeString(input: string): string {
    if (!input) return '';
    return input.trim().replace(/[<>\"']/g, '');
  }

  static sanitizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  static sanitizePhone(phone: string): string {
    return phone.replace(/\s+/g, '').replace(/[^\d+\-()]/g, '');
  }

  static sanitizeInput(input: string): string {
    return this.sanitizeString(input);
  }

  static sanitizeQueryParams(params: any): any {
    if (!params) return {};
    const sanitized = {};
    for (const key in params) {
      if (typeof params[key] === 'string') {
        sanitized[key] = this.sanitizeString(params[key]);
      } else {
        sanitized[key] = params[key];
      }
    }
    return sanitized;
  }

  static sanitizeLogMessage(message: string): string {
    return message.replace(/password|token|secret|key/gi, '***REDACTED***');
  }

  /**
   * Validation Methods
   */

  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }

  static validateUUID(id: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  }

  static validatePassword(password: string): boolean {
    // At least 8 chars, 1 uppercase, 1 lowercase, 1 number
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);
  }

  static validatePhone(phone: string): boolean {
    const phoneRegex = /^\+?[0-9\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone.trim());
  }

  static validatePostalCode(code: string): boolean {
    return /^\d{5}$/.test(code.trim());
  }

  static validateProvinceCode(code: string): boolean {
    return /^[A-Z]{2}$/.test(code.trim());
  }

  static validateUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  static validateDecimal(value: any, precision = 2): boolean {
    const decimalRegex = new RegExp(`^\\d+(\\.\\d{1,${precision}})?$`);
    return decimalRegex.test(String(value));
  }

  /**
   * ID/Object Validation
   */

  static validateId(id: any): string {
    if (typeof id !== 'string') {
      throw new BadRequestException('ID must be a string');
    }
    if (!this.validateUUID(id)) {
      throw new BadRequestException('ID must be a valid UUID');
    }
    return id;
  }

  static validateIdArray(ids: string[]): string[] {
    if (!Array.isArray(ids)) {
      throw new BadRequestException('IDs must be an array');
    }
    return ids.map((id) => this.validateId(id));
  }

  static validateObject(obj: any): void {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
      throw new BadRequestException('Expected a valid object');
    }
  }

  /**
   * Response Formatting Methods
   */

  static createSuccessResponse(message: string, data?: any) {
    return {
      success: true,
      message,
      data: data || null,
      timestamp: new Date().toISOString(),
    };
  }

  static createErrorResponse(message: string, details?: any) {
    return {
      success: false,
      message,
      error: details || null,
      timestamp: new Date().toISOString(),
    };
  }

  static createPaginatedResponse(
    message: string,
    data: any[],
    total: number,
    skip: number,
    take: number,
  ) {
    const page = Math.floor(skip / take) + 1;
    const pages = Math.ceil(total / take);
    return {
      success: true,
      message,
      data,
      pagination: {
        total,
        page,
        pages,
        skip,
        take,
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Format conversion methods
   */

  static toBoolean(value: any): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') return value.toLowerCase() === 'true';
    return Boolean(value);
  }

  static toNumber(value: any, defaultValue = 0): number {
    const num = Number(value);
    return isNaN(num) ? defaultValue : num;
  }

  /**
   * Batch operation helpers
   */

  static batchArray<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  static deduplicateArray<T>(items: T[]): T[] {
    return [...new Set(items)];
  }
}
