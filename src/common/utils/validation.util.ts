import { BadRequestException } from '@nestjs/common';

/**
 * @deprecated Use Validators from './validators' instead
 * This file maintained for backward compatibility
 * Will be removed in next major version
 */
export class ValidationUtil {
  // Basic validation
  static validateRequired(value: any, fieldName = 'field'): void {
    if (value === undefined || value === null || value === '') {
      throw new BadRequestException(`${fieldName} is required`);
    }
  }

  static validateString(
    value: any,
    fieldName: string,
    minLength?: number,
    maxLength?: number,
  ): void {
    this.validateRequired(value, fieldName);
    if (typeof value !== 'string') {
      throw new BadRequestException(`${fieldName} must be a string`);
    }
    if (minLength !== undefined && value.length < minLength) {
      throw new BadRequestException(
        `${fieldName} must be at least ${minLength} characters`,
      );
    }
    if (maxLength !== undefined && value.length > maxLength) {
      throw new BadRequestException(
        `${fieldName} must not exceed ${maxLength} characters`,
      );
    }
  }

  static sanitizeString(value: any): any {
    if (!value || typeof value !== 'string') return value;
    return value.replace(/[<>\"'%;()&+]/g, '').trim();
  }

  static validateEmail(email: any): void {
    this.validateRequired(email, 'email');
    if (typeof email !== 'string') {
      throw new BadRequestException('Email must be a string');
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      throw new BadRequestException('Invalid email format');
    }
  }

  static validateUUID(id: any, fieldName = 'id'): void {
    this.validateRequired(id, fieldName);
    if (typeof id !== 'string') {
      throw new BadRequestException(`${fieldName} must be a string`);
    }
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      throw new BadRequestException(`Invalid ${fieldName} format`);
    }
  }

  static validatePassword(password: any): void {
    this.validateString(password, 'password', 8, 128);
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      throw new BadRequestException(
        'Password must contain at least one uppercase letter, one lowercase letter, and one number',
      );
    }
  }

  static validateNumber(
    value: any,
    fieldName: string,
    min?: number,
    max?: number,
  ): void {
    this.validateRequired(value, fieldName);
    if (typeof value !== 'number' || isNaN(value)) {
      throw new BadRequestException(`${fieldName} must be a valid number`);
    }
    if (min !== undefined && value < min) {
      throw new BadRequestException(`${fieldName} must be at least ${min}`);
    }
    if (max !== undefined && value > max) {
      throw new BadRequestException(`${fieldName} must not exceed ${max}`);
    }
  }

  static validateBoolean(value: any, fieldName: string): void {
    this.validateRequired(value, fieldName);
    if (typeof value !== 'boolean') {
      throw new BadRequestException(`${fieldName} must be a boolean`);
    }
  }

  static validateDate(value: any, fieldName: string): void {
    this.validateRequired(value, fieldName);
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      throw new BadRequestException(`${fieldName} must be a valid date`);
    }
  }

  static validateEnum(value: any, enumObject: any, fieldName: string): void {
    this.validateRequired(value, fieldName);
    if (!Object.values(enumObject).includes(value)) {
      throw new BadRequestException(
        `${fieldName} must be one of: ${Object.values(enumObject).join(', ')}`,
      );
    }
  }

  static validateArray(value: any, fieldName: string, minLength = 0): void {
    this.validateRequired(value, fieldName);
    if (!Array.isArray(value)) {
      throw new BadRequestException(`${fieldName} must be an array`);
    }
    if (value.length < minLength) {
      throw new BadRequestException(
        `${fieldName} must contain at least ${minLength} items`,
      );
    }
  }

  static validateObject(obj: any): void {
    if (!obj || typeof obj !== 'object') return;

    const dangerousKeys = [
      '$where',
      '$regex',
      '$ne',
      '$gt',
      '$gte',
      '$lt',
      '$lte',
      '$in',
      '$nin',
      '$exists',
      '$type',
      '$or',
      '$and',
      '$not',
      '$nor',
    ];

    for (const key of Object.keys(obj)) {
      if (dangerousKeys.includes(key)) {
        throw new BadRequestException(`Dangerous operator: ${key}`);
      }
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        this.validateObject(obj[key]);
      }
    }
  }

  static validateId(id: any): string {
    this.validateUUID(id, 'id');
    return id;
  }

  static sanitizeLogMessage(message: string): string {
    return message?.replace(/password|token|secret|key/gi, '***').replace(/[\r\n\t]/g, ' ') || '';
  }

  static createPaginatedResponse(
    message: string,
    data: any[],
    total: number,
    page: number,
    limit: number,
  ) {
    return {
      success: true,
      message,
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
