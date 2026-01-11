import { Injectable, NotFoundException, Logger, Inject, Optional } from '@nestjs/common';
import { Repository } from 'typeorm';
import { CacheService } from './cache.service';
import { QueryBuilderHelper, PaginationOptions, SortOptions, FilterOptions } from '../utils/query-builder.helper';

/**
 * Enhanced base service with caching and optimized queries
 */
@Injectable()
export abstract class BaseService<T, CreateDto = any, UpdateDto = any> {
  protected readonly logger: Logger;
  protected readonly entityName: string;

  constructor(
    protected readonly repository: Repository<T>,
    @Optional() @Inject(CacheService) protected readonly cacheService?: CacheService,
  ) {
    this.logger = new Logger(this.constructor.name);
    this.entityName = this.repository.metadata.name;
  }

  /**
   * Find all with advanced filtering, sorting, and pagination
   */
  async findAll(options: {
    pagination?: PaginationOptions;
    sorting?: SortOptions[];
    filters?: FilterOptions;
    search?: { term: string; fields: string[] };
    relations?: string[];
    cache?: boolean;
  } = {}): Promise<{
    data: T[];
    total: number;
    page: number;
    pages: number;
    limit: number;
  }> {
    const { pagination = {}, sorting, filters, search, relations, cache = true } = options;
    const { page = 1, limit = 20 } = pagination;
    
    // Generate cache key
    const cacheKey = cache ? this.generateCacheKey('findAll', options) : null;
    
    // Try cache first
    if (cacheKey && this.cacheService) {
      const cached = this.cacheService.get<any>(cacheKey);
      if (cached) {
        return cached;
      }
    }
    
    const alias = this.entityName.toLowerCase();
    let qb = this.repository.createQueryBuilder(alias);
    
    // Add relations
    if (relations) {
      relations.forEach(relation => {
        qb = qb.leftJoinAndSelect(`${alias}.${relation}`, relation);
      });
    }
    
    // Apply query options
    qb = QueryBuilderHelper.buildQuery(qb, {
      pagination,
      sorting,
      filters,
      search,
    }, alias);
    
    const result = await QueryBuilderHelper.getPaginatedResults(qb, { page, limit });
    
    // Cache result
    if (cacheKey && this.cacheService) {
      this.cacheService.set(cacheKey, result, 300000); // 5 minutes
    }
    
    return result;
  }

  /**
   * Find by ID with caching
   */
  async findById(id: string, relations?: string[], useCache = true): Promise<T> {
    const cacheKey = useCache ? this.generateCacheKey('findById', { id, relations }) : null;
    
    // Try cache first
    if (cacheKey && this.cacheService) {
      const cached = this.cacheService.get<T>(cacheKey);
      if (cached) {
        return cached;
      }
    }
    
    const entity = await this.repository.findOne({
      where: { id } as any,
      relations: relations || [],
    });

    if (!entity) {
      throw new NotFoundException(`${this.entityName} not found`);
    }
    
    // Cache result
    if (cacheKey && this.cacheService) {
      this.cacheService.set(cacheKey, entity);
    }

    return entity;
  }

  /**
   * Find one with caching
   */
  async findOne(
    condition: any,
    relations?: string[],
    useCache = true,
  ): Promise<T | null> {
    const cacheKey = useCache ? this.generateCacheKey('findOne', { condition, relations }) : null;
    
    if (cacheKey && this.cacheService) {
      const cached = this.cacheService.get<T>(cacheKey);
      if (cached) {
        return cached;
      }
    }
    
    const entity = await this.repository.findOne({
      where: condition,
      relations: relations || [],
    });
    
    if (cacheKey && this.cacheService && entity) {
      this.cacheService.set(cacheKey, entity);
    }
    
    return entity;
  }

  /**
   * Create with cache invalidation
   */
  async create(dto: CreateDto): Promise<T> {
    const entity = this.repository.create(dto as any);
    const saved = await this.repository.save(entity as any);
    
    // Invalidate related caches
    this.invalidateCache(['findAll']);
    
    this.logger.debug(`Created ${this.entityName}: ${(saved as any).id}`);
    return saved as T;
  }

  /**
   * Bulk create with transaction
   */
  async createMany(dtos: CreateDto[]): Promise<T[]> {
    return this.repository.manager.transaction(async (manager) => {
      const entities = this.repository.create(dtos as any);
      const saved = await manager.save(entities as any);
      
      // Invalidate caches
      this.invalidateCache(['findAll']);
      
      return saved as T[];
    });
  }

  /**
   * Update with cache invalidation
   */
  async update(id: string, dto: UpdateDto): Promise<T> {
    await this.findById(id, [], false); // Verify exists without cache
    
    await this.repository.update({ id } as any, dto as any);
    
    // Invalidate caches
    this.invalidateCache(['findAll', 'findById', 'findOne'], id);
    
    const updated = await this.findById(id, [], false);
    this.logger.debug(`Updated ${this.entityName}: ${id}`);
    return updated;
  }

  /**
   * Delete with cache invalidation
   */
  async delete(id: string): Promise<void> {
    await this.findById(id, [], false); // Verify exists
    
    await this.repository.delete({ id } as any);
    
    // Invalidate caches
    this.invalidateCache(['findAll', 'findById', 'findOne'], id);
    
    this.logger.debug(`Deleted ${this.entityName}: ${id}`);
  }

  /**
   * Bulk delete with transaction
   */
  async deleteMany(ids: string[]): Promise<number> {
    const result = await this.repository.delete(ids.map(id => ({ id } as any)));
    
    // Invalidate caches
    this.invalidateCache(['findAll']);
    
    return result.affected || 0;
  }

  /**
   * Count with caching
   */
  async count(where?: any, useCache = true): Promise<number> {
    const cacheKey = useCache ? this.generateCacheKey('count', { where }) : null;
    
    if (cacheKey && this.cacheService) {
      const cached = this.cacheService.get<number>(cacheKey);
      if (cached !== null) {
        return cached;
      }
    }
    
    const count = await this.repository.count({ where: where || {} });
    
    if (cacheKey && this.cacheService) {
      this.cacheService.set(cacheKey, count, 60000); // 1 minute for counts
    }
    
    return count;
  }

  /**
   * Check if entity exists
   */
  async exists(id: string, useCache = true): Promise<boolean> {
    try {
      await this.findById(id, [], useCache);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Create query builder
   */
  protected createQueryBuilder(alias?: string) {
    return this.repository.createQueryBuilder(alias || this.entityName.toLowerCase());
  }

  /**
   * Generate cache key
   */
  private generateCacheKey(method: string, params: any): string {
    const paramsStr = JSON.stringify(params);
    return `${this.entityName}:${method}:${Buffer.from(paramsStr).toString('base64')}`;
  }

  /**
   * Invalidate cache patterns
   */
  private invalidateCache(methods: string[], id?: string): void {
    if (!this.cacheService) return;
    
    methods.forEach(method => {
      // This is a simplified cache invalidation
      // In production, you'd use a more sophisticated pattern matching
      if (id) {
        this.cacheService.delete(`${this.entityName}:${method}:${id}`);
      }
      // Clear method-specific caches (simplified)
      this.cacheService.delete(`${this.entityName}:${method}`);
    });
  }
}
