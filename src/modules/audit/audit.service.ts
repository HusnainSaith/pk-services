import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditRepository: Repository<AuditLog>,
  ) {}

  async create(dto: CreateAuditLogDto): Promise<any> {
    const auditLog = this.auditRepository.create(dto);
    const saved = await this.auditRepository.save(auditLog);
    return { success: true, message: 'Audit log created', data: saved };
  }

  async findAll(): Promise<any> {
    const logs = await this.auditRepository.find({
      order: { createdAt: 'DESC' },
    });
    return { success: true, data: logs };
  }

  async findByUser(userId: string): Promise<any> {
    const logs = await this.auditRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    return { success: true, data: logs };
  }

  async findByResource(type: string, id: string): Promise<any> {
    const logs = await this.auditRepository.find({
      where: { resourceType: type, resourceId: id },
      order: { createdAt: 'DESC' },
    });
    return { success: true, data: logs };
  }

  // Extended Operations - Advanced Filtering
  async searchAuditLogs(filters: {
    userId?: string;
    action?: string;
    resource?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<any> {
    const queryBuilder = this.auditRepository.createQueryBuilder('audit');

    if (filters.userId) {
      queryBuilder.andWhere('audit.userId = :userId', {
        userId: filters.userId,
      });
    }

    if (filters.action) {
      queryBuilder.andWhere('audit.action = :action', {
        action: filters.action,
      });
    }

    if (filters.resource) {
      queryBuilder.andWhere('audit.resourceType = :resource', {
        resource: filters.resource,
      });
    }

    if (filters.startDate) {
      queryBuilder.andWhere('audit.createdAt >= :startDate', {
        startDate: filters.startDate,
      });
    }

    if (filters.endDate) {
      queryBuilder.andWhere('audit.createdAt <= :endDate', {
        endDate: filters.endDate,
      });
    }

    const [results, totalCount] = await queryBuilder
      .orderBy('audit.createdAt', 'DESC')
      .getManyAndCount();

    return {
      success: true,
      data: {
        filters,
        results,
        totalCount,
        searchedAt: new Date(),
      },
    };
  }

  async exportAuditLogs(options: {
    format: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<any> {
    const queryBuilder = this.auditRepository.createQueryBuilder('audit');

    if (options.startDate) {
      queryBuilder.andWhere('audit.createdAt >= :startDate', {
        startDate: options.startDate,
      });
    }

    if (options.endDate) {
      queryBuilder.andWhere('audit.createdAt <= :endDate', {
        endDate: options.endDate,
      });
    }

    const logs = await queryBuilder.getMany();

    return {
      success: true,
      message: 'Audit logs export prepared',
      data: {
        format: options.format,
        downloadUrl: `/api/v1/audit-logs/export.${options.format}`,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        recordCount: logs.length,
        logs: options.format === 'json' ? logs : undefined,
      },
    };
  }
}
