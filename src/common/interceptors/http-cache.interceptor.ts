import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

interface CacheEntry {
  data: any;
  timestamp: number;
}

@Injectable()
export class HttpCacheInterceptor implements NestInterceptor {
  private cache = new Map<string, CacheEntry>();
  private readonly TTL = 60000; // 1 minute cache

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;

    // Only cache GET requests
    if (method !== 'GET') {
      return next.handle();
    }

    const url = request.url;
    const key = `${method}:${url}`;
    const now = Date.now();

    // Check if we have a valid cached entry
    const cached = this.cache.get(key);
    if (cached && now - cached.timestamp < this.TTL) {
      return of(cached.data);
    }

    // Not in cache or expired, fetch new data
    return next.handle().pipe(
      tap((data) => {
        this.cache.set(key, {
          data,
          timestamp: now,
        });

        // Clean up old entries periodically
        if (this.cache.size > 100) {
          this.cleanupCache(now);
        }
      }),
    );
  }

  private cleanupCache(now: number) {
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.TTL) {
        this.cache.delete(key);
      }
    }
  }

  // Method to clear cache manually if needed
  clearCache() {
    this.cache.clear();
  }
}
