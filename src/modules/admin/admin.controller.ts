import {
  Controller,
  Get,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { AdminService } from './admin.service';

@ApiTags('Admin Dashboard')
@Controller('admin')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard/stats')
  @Permissions('admin:read')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get overview stats' })
  getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('dashboard/pending-count')
  @Permissions('admin:read')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Pending requests count' })
  getPendingCount() {
    return this.adminService.getPendingCount();
  }

  @Get('dashboard/workload')
  @Permissions('admin:read')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Operator workload distribution' })
  getWorkloadDistribution() {
    return this.adminService.getWorkloadDistribution();
  }
}