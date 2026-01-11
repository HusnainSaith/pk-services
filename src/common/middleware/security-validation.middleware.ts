import {
  Injectable,
  NestMiddleware,
  BadRequestException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ValidationUtil } from '../utils/validation.util';

@Injectable()
export class SecurityValidationMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    try {
      if (req.params) {
        for (const [key, value] of Object.entries(req.params)) {
          if (key === 'id' || key.endsWith('Id')) {
            ValidationUtil.validateId(value as string);
          }
        }
      }
      if (req.body && typeof req.body === 'object') {
        ValidationUtil.validateObject(req.body);
      }
      if (req.query && typeof req.query === 'object') {
        ValidationUtil.validateObject(req.query);
      }

      next();
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
