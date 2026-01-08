import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';

/**
 * Abstract base service providing common CRUD operations
 * Eliminates duplicate find/create/update/delete logic across services
 */
@Injectable()
export abstract class BaseService<T, CreateDto = any, UpdateDto = any> {
  protected readonly logger: Logger;

  constructor(protected readonly repository: Repository<T>) {
    this.logger = new Logger(this.constructor.name);
  }

  /**
   * Find all records with pagination
   */
  async findAll(
    skip = 0,
    take = 20,
    where?: any,
    relations?: string[],
  ): Promise<{ data: T[]; total: number }> {
    const [data, total] = await this.repository.findAndCount({
      where: where || {},
      skip,
      take,
      relations: relations || [],
      order: { createdAt: 'DESC' } as any,
    });

    return { data, total };
  }

  /**
   * Find single record by ID
   */
  async findById(id: string, relations?: string[]): Promise<T> {
    const entity = await this.repository.findOne({
      where: { id } as any,
      relations: relations || [],
    });

    if (!entity) {
      throw new NotFoundException(
        `${this.repository.metadata.name} not found`,
      );
    }

    return entity;
  }

  /**
   * Find by custom condition
   */
  async findOne(
    condition: any,
    relations?: string[],
  ): Promise<T | null> {
    return this.repository.findOne({
      where: condition,
      relations: relations || [],
    });
  }

  /**
   * Check if entity exists
   */
  async exists(id: string): Promise<boolean> {
    const count = await this.repository.count({
      where: { id } as any,
    });
    return count > 0;
  }

  /**
   * Create new entity
   */
  async create(dto: CreateDto): Promise<T> {
    const entity = this.repository.create(dto as any);
    const saved = await this.repository.save(entity as any);
    this.logger.debug(
      `Created ${this.repository.metadata.name}: ${(saved as any).id}`,
    );
    return saved as T;
  }

  /**
   * Bulk create entities
   */
  async createMany(dtos: CreateDto[]): Promise<T[]> {
    const entities = this.repository.create(dtos as any);
    const saved = await this.repository.save(entities as any);
    return saved as T[];
  }

  /**
   * Update entity by ID
   */
  async update(id: string, dto: UpdateDto): Promise<T> {
    await this.findById(id); // Verify exists
    
    await this.repository.update({ id } as any, dto as any);
    
    const updated = await this.findById(id);
    this.logger.debug(
      `Updated ${this.repository.metadata.name}: ${id}`,
    );
    return updated;
  }

  /**
   * Delete entity by ID
   */
  async delete(id: string): Promise<void> {
    await this.findById(id); // Verify exists
    
    await this.repository.delete({ id } as any);
    
    this.logger.debug(
      `Deleted ${this.repository.metadata.name}: ${id}`,
    );
  }

  /**
   * Bulk delete by IDs
   */
  async deleteMany(ids: string[]): Promise<number> {
    const result = await this.repository.delete(
      ids.map((id) => ({ id } as any)),
    );
    return result.affected || 0;
  }

  /**
   * Count records
   */
  async count(where?: any): Promise<number> {
    return this.repository.count({
      where: where || {},
    });
  }

  /**
   * Find with advanced query builder (override for complex queries)
   */
  protected createQueryBuilder(alias: string) {
    return this.repository.createQueryBuilder(alias);
  }
}
