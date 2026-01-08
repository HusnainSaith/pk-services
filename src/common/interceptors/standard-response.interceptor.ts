import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpStatus,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Standardizes all API responses to consistent format
 * Eliminates need for manual response wrapping in controllers
 */
@Injectable()
export class StandardResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const response = context.switchToHttp().getResponse();
    const statusCode = response.statusCode || HttpStatus.OK;

    return next.handle().pipe(
      map((data) => {
        // If response already has our standard format, return as-is
        if (data?.success !== undefined) {
          return data;
        }

        // If response is paginated (has data, total, skip, take)
        if (
          data?.data &&
          Array.isArray(data.data) &&
          data.total !== undefined &&
          data.skip !== undefined &&
          data.take !== undefined
        ) {
          const page = Math.floor(data.skip / data.take) + 1;
          const pages = Math.ceil(data.total / data.take);
          return {
            success: true,
            message: data.message || 'Data retrieved successfully',
            data: data.data,
            pagination: {
              total: data.total,
              page,
              pages,
              skip: data.skip,
              take: data.take,
            },
            timestamp: new Date().toISOString(),
          };
        }

        // Standard response
        return {
          success: true,
          message: data?.message || 'Request successful',
          data: data?.data !== undefined ? data.data : data,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}

/**
 * Error response standardizer
 * Used by exception filters
 */
export const createErrorResponse = (
  statusCode: number,
  message: string,
  error?: any,
) => ({
  success: false,
  message,
  error: error?.message || error || null,
  statusCode,
  timestamp: new Date().toISOString(),
});
