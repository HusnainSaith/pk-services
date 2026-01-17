import { Controller, Get, Param, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';

@ApiTags('Audit Logs')
@Controller('audit-logs')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Permissions('audit_logs:read')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[Admin] List audit logs' })
  findAll() {
    return this.auditService.findAll();
  }

  @Get('user/:userId')
  @Permissions('audit_logs:read')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[Admin] Get user audit logs' })
  findByUser(@Param('userId') userId: string) {
    return this.auditService.findByUser(userId);
  }

  @Get('resource/:type/:id')
  @Permissions('audit_logs:read')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[Admin] Get resource audit logs' })
  findByResource(@Param('type') type: string, @Param('id') id: string) {
    return this.auditService.findByResource(type, id);
  }

  // Extended Operations - Advanced Filtering
  @Get('search')
  @Permissions('audit_logs:read')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[Admin] Advanced search with multiple filters' })
  searchAuditLogs(
    @Query('userId') userId?: string,
    @Query('action') action?: string,
    @Query('resource') resource?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.auditService.searchAuditLogs({
      userId,
      action,
      resource,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  @Get('export')
  @Permissions('audit_logs:export')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[Admin] Export audit logs (CSV)' })
  exportAuditLogs(
    @Query('format') format: string = 'csv',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.auditService.exportAuditLogs({
      format,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }
}
