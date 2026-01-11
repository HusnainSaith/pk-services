import { BadRequestException } from '@nestjs/common';

/**
 * Consolidated Validation & Sanitization Utility
 * Single source of truth - removes all redundancy
 */
export class Validators {
  // ==========================================================================
  // SANITIZATION
  // ==========================================================================

  static sanitize(value: string): string {
    return value?.replace(/[<>\"'%;()&+]/g, '').trim() || '';
  }

  static sanitizeEmail(email: string): string {
    return email?.trim().toLowerCase() || '';
  }

  static sanitizePhone(phone: string): string {
    return phone?.replace(/[^\d+\-()]/g, '') || '';
  }

  static sanitizeLog(message: string): string {
    return message?.replace(/password|token|secret|key/gi, '***').replace(/[\r\n\t]/g, ' ') || '';
  }

  static sanitizeParams(params: Record<string, any>): Record<string, any> {
    if (!params || typeof params !== 'object') return {};
    
    const result = {};
    for (const [key, value] of Object.entries(params)) {
      result[key] = typeof value === 'string' ? this.sanitize(value) : value;
    }
    return result;
  }

  // ==========================================================================
  // VALIDATION (returns boolean)
  // ==========================================================================

  static isEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email?.trim() || '');
  }

  static isUUID(id: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id || '');
  }

  static isPassword(password: string): boolean {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password || '');
  }

  static isPhone(phone: string): boolean {
    return /^\+?[0-9\s\-()]{10,}$/.test(phone?.trim() || '');
  }

  static isUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  // ==========================================================================
  // ASSERTION (throws on invalid)
  // ==========================================================================

  static required(value: any, field: string): void {
    if (value === undefined || value === null || value === '') {
      throw new BadRequestException(`${field} is required`);
    }
  }

  static string(value: any, field: string, min = 1, max = 255): void {
    this.required(value, field);
    if (typeof value !== 'string') {
      throw new BadRequestException(`${field} must be a string`);
    }
    const len = value.trim().length;
    if (len < min || len > max) {
      throw new BadRequestException(`${field} must be ${min}-${max} characters`);
    }
  }

  static email(value: string, field = 'email'): void {
    this.required(value, field);
    if (!this.isEmail(value)) {
      throw new BadRequestException(`${field} must be a valid email`);
    }
  }

  static uuid(value: string, field = 'id'): void {
    this.required(value, field);
    if (!this.isUUID(value)) {
      throw new BadRequestException(`${field} must be a valid UUID`);
    }
  }

  static password(value: string): void {
    this.string(value, 'password', 8, 128);
    if (!this.isPassword(value)) {
      throw new BadRequestException('Password must contain uppercase, lowercase, and number');
    }
  }

  static number(value: any, field: string, min?: number, max?: number): void {
    this.required(value, field);
    if (typeof value !== 'number' || isNaN(value)) {
      throw new BadRequestException(`${field} must be a number`);
    }
    if (min !== undefined && value < min) {
      throw new BadRequestException(`${field} must be at least ${min}`);
    }
    if (max !== undefined && value > max) {
      throw new BadRequestException(`${field} must not exceed ${max}`);
    }
  }

  static boolean(value: any, field: string): void {
    this.required(value, field);
    if (typeof value !== 'boolean') {
      throw new BadRequestException(`${field} must be a boolean`);
    }
  }

  static date(value: any, field: string): void {
    this.required(value, field);
    if (isNaN(new Date(value).getTime())) {
      throw new BadRequestException(`${field} must be a valid date`);
    }
  }

  static enum(value: any, enumObj: any, field: string): void {
    this.required(value, field);
    if (!Object.values(enumObj).includes(value)) {
      throw new BadRequestException(`${field} must be: ${Object.values(enumObj).join(', ')}`);
    }
  }

  static array(value: any, field: string, minLength = 0): void {
    this.required(value, field);
    if (!Array.isArray(value) || value.length < minLength) {
      throw new BadRequestException(`${field} must be an array with at least ${minLength} items`);
    }
  }

  // ==========================================================================
  // SECURITY
  // ==========================================================================

  static checkSqlInjection(obj: any): void {
    if (!obj || typeof obj !== 'object') return;

    const dangerous = ['$where', '$regex', '$ne', '$gt', '$lt', '$in', '$nin', '$exists', '$or', '$and'];
    
    for (const [key, value] of Object.entries(obj)) {
      if (dangerous.includes(key)) {
        throw new BadRequestException(`Dangerous operator: ${key}`);
      }
      if (value && typeof value === 'object') {
        this.checkSqlInjection(value);
      }
    }
  }

  // ==========================================================================
  // UTILITIES
  // ==========================================================================

  static toBoolean(value: any): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') return value.toLowerCase() === 'true';
    return Boolean(value);
  }

  static toNumber(value: any, defaultValue = 0): number {
    const num = Number(value);
    return isNaN(num) ? defaultValue : num;
  }

  static batch<T>(items: T[], size: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += size) {
      batches.push(items.slice(i, i + size));
    }
    return batches;
  }

  static unique<T>(items: T[]): T[] {
    return [...new Set(items)];
  }
}
