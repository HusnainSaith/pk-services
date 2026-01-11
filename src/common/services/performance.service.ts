import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: Date;
  metadata?: any;
}

interface MemoryUsage {
  rss: number;
  heapTotal: number;
  heapUsed: number;
  external: number;
  arrayBuffers: number;
}

@Injectable()
export class PerformanceService {
  private readonly logger = new Logger(PerformanceService.name);
  private readonly metrics: PerformanceMetric[] = [];
  private readonly maxMetrics: number;
  private readonly slowQueryThreshold: number;

  constructor(private readonly configService: ConfigService) {
    this.maxMetrics = this.configService.get<number>('PERF_MAX_METRICS', 1000);
    this.slowQueryThreshold = this.configService.get<number>('PERF_SLOW_QUERY_MS', 1000);
    
    // Log performance stats every 5 minutes
    setInterval(() => this.logPerformanceStats(), 300000);
  }

  /**
   * Start performance measurement
   */
  startMeasurement(name: string): (metadata?: any) => void {
    const startTime = process.hrtime.bigint();
    
    return (metadata?: any) => {
      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1000000;
      
      this.recordMetric({
        name,
        duration,
        timestamp: new Date(),
        metadata,
      });
      
      if (duration > this.slowQueryThreshold) {
        this.logger.warn(`Slow operation detected: ${name} took ${duration.toFixed(2)}ms`, {
          name,
          duration,
          metadata,
        });
      }
    };
  }

  /**
   * Measure async function execution
   */
  async measureAsync<T>(
    name: string,
    fn: () => Promise<T>,
    metadata?: any,
  ): Promise<T> {
    const endMeasurement = this.startMeasurement(name);
    
    try {
      const result = await fn();
      endMeasurement(metadata);
      return result;
    } catch (error) {
      endMeasurement({ ...metadata, error: error.message });
      throw error;
    }
  }

  /**
   * Measure sync function execution
   */
  measureSync<T>(name: string, fn: () => T, metadata?: any): T {
    const endMeasurement = this.startMeasurement(name);
    
    try {
      const result = fn();
      endMeasurement(metadata);
      return result;
    } catch (error) {
      endMeasurement({ ...metadata, error: error.message });
      throw error;
    }
  }

  /**
   * Get performance statistics
   */
  getStats(): {
    totalMetrics: number;
    averageDuration: number;
    slowQueries: number;
    topSlowest: PerformanceMetric[];
    memoryUsage: MemoryUsage;
  } {
    const totalMetrics = this.metrics.length;
    const averageDuration = totalMetrics > 0 
      ? this.metrics.reduce((sum, m) => sum + m.duration, 0) / totalMetrics 
      : 0;
    
    const slowQueries = this.metrics.filter(m => m.duration > this.slowQueryThreshold).length;
    
    const topSlowest = [...this.metrics]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);
    
    const memoryUsage = process.memoryUsage();
    
    return {
      totalMetrics,
      averageDuration,
      slowQueries,
      topSlowest,
      memoryUsage,
    };
  }

  /**
   * Get metrics by name
   */
  getMetricsByName(name: string): PerformanceMetric[] {
    return this.metrics.filter(m => m.name === name);
  }

  /**
   * Clear old metrics
   */
  clearMetrics(): void {
    this.metrics.length = 0;
  }

  /**
   * Record performance metric
   */
  private recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);
    
    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }
  }

  /**
   * Log performance statistics
   */
  private logPerformanceStats(): void {
    const stats = this.getStats();
    
    this.logger.log('Performance Statistics', {
      totalMetrics: stats.totalMetrics,
      averageDuration: `${stats.averageDuration.toFixed(2)}ms`,
      slowQueries: stats.slowQueries,
      memoryUsage: {
        heapUsed: `${(stats.memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`,
        heapTotal: `${(stats.memoryUsage.heapTotal / 1024 / 1024).toFixed(2)}MB`,
        rss: `${(stats.memoryUsage.rss / 1024 / 1024).toFixed(2)}MB`,
      },
    });
    
    // Log top slowest operations
    if (stats.topSlowest.length > 0) {
      this.logger.debug('Top slowest operations:', 
        stats.topSlowest.slice(0, 5).map(m => ({
          name: m.name,
          duration: `${m.duration.toFixed(2)}ms`,
        }))
      );
    }
  }
}

/**
 * Performance decorator for methods
 */
export function Measure(name?: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const measurementName = name || `${target.constructor.name}.${propertyKey}`;
    
    descriptor.value = async function (...args: any[]) {
      const performanceService = this.performanceService || 
        global['performanceService']; // Fallback to global instance
      
      if (performanceService) {
        return performanceService.measureAsync(
          measurementName,
          () => originalMethod.apply(this, args),
          { args: args.length }
        );
      }
      
      return originalMethod.apply(this, args);
    };
    
    return descriptor;
  };
}