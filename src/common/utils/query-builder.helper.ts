import { SelectQueryBuilder } from 'typeorm';

export interface PaginationOptions {
  page?: number;
  limit?: number;
  skip?: number;
  take?: number;
}

export interface SortOptions {
  field: string;
  direction: 'ASC' | 'DESC';
}

export interface FilterOptions {
  [key: string]: any;
}

export class QueryBuilderHelper {
  /**
   * Apply pagination to query builder
   */
  static applyPagination<T>(
    qb: SelectQueryBuilder<T>,
    options: PaginationOptions,
  ): SelectQueryBuilder<T> {
    const { page, limit, skip, take } = options;

    if (skip !== undefined && take !== undefined) {
      return qb.skip(skip).take(take);
    }

    if (page && limit) {
      const offset = (page - 1) * limit;
      return qb.skip(offset).take(limit);
    }

    return qb;
  }

  /**
   * Apply sorting to query builder
   */
  static applySorting<T>(
    qb: SelectQueryBuilder<T>,
    sorts: SortOptions[],
    alias: string,
  ): SelectQueryBuilder<T> {
    sorts.forEach((sort, index) => {
      const field = `${alias}.${sort.field}`;
      if (index === 0) {
        qb.orderBy(field, sort.direction);
      } else {
        qb.addOrderBy(field, sort.direction);
      }
    });

    return qb;
  }

  /**
   * Apply filters to query builder
   */
  static applyFilters<T>(
    qb: SelectQueryBuilder<T>,
    filters: FilterOptions,
    alias: string,
  ): SelectQueryBuilder<T> {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          qb.andWhere(`${alias}.${key} IN (:...${key})`, { [key]: value });
        } else if (typeof value === 'string' && value.includes('%')) {
          qb.andWhere(`${alias}.${key} ILIKE :${key}`, { [key]: value });
        } else {
          qb.andWhere(`${alias}.${key} = :${key}`, { [key]: value });
        }
      }
    });

    return qb;
  }

  /**
   * Apply date range filter
   */
  static applyDateRange<T>(
    qb: SelectQueryBuilder<T>,
    field: string,
    startDate?: Date,
    endDate?: Date,
    alias?: string,
  ): SelectQueryBuilder<T> {
    const fieldName = alias ? `${alias}.${field}` : field;

    if (startDate) {
      qb.andWhere(`${fieldName} >= :startDate`, { startDate });
    }

    if (endDate) {
      qb.andWhere(`${fieldName} <= :endDate`, { endDate });
    }

    return qb;
  }

  /**
   * Apply search across multiple fields
   */
  static applySearch<T>(
    qb: SelectQueryBuilder<T>,
    searchTerm: string,
    fields: string[],
    alias: string,
  ): SelectQueryBuilder<T> {
    if (!searchTerm || fields.length === 0) {
      return qb;
    }

    const searchConditions = fields
      .map((field) => `${alias}.${field} ILIKE :searchTerm`)
      .join(' OR ');

    qb.andWhere(`(${searchConditions})`, {
      searchTerm: `%${searchTerm}%`,
    });

    return qb;
  }

  /**
   * Get paginated results with metadata
   */
  static async getPaginatedResults<T>(
    qb: SelectQueryBuilder<T>,
    options: PaginationOptions,
  ): Promise<{
    data: T[];
    total: number;
    page: number;
    pages: number;
    limit: number;
  }> {
    const { page = 1, limit = 20 } = options;

    const [data, total] = await qb.getManyAndCount();
    const pages = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      pages,
      limit,
    };
  }

  /**
   * Build complex query with all options
   */
  static buildQuery<T>(
    qb: SelectQueryBuilder<T>,
    options: {
      pagination?: PaginationOptions;
      sorting?: SortOptions[];
      filters?: FilterOptions;
      search?: { term: string; fields: string[] };
      dateRange?: { field: string; start?: Date; end?: Date };
    },
    alias: string,
  ): SelectQueryBuilder<T> {
    const { pagination, sorting, filters, search, dateRange } = options;

    // Apply filters
    if (filters) {
      this.applyFilters(qb, filters, alias);
    }

    // Apply search
    if (search?.term && search?.fields) {
      this.applySearch(qb, search.term, search.fields, alias);
    }

    // Apply date range
    if (dateRange) {
      this.applyDateRange(
        qb,
        dateRange.field,
        dateRange.start,
        dateRange.end,
        alias,
      );
    }

    // Apply sorting
    if (sorting && sorting.length > 0) {
      this.applySorting(qb, sorting, alias);
    }

    // Apply pagination
    if (pagination) {
      this.applyPagination(qb, pagination);
    }

    return qb;
  }
}
