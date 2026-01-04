import {
  Controller,
  Get,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';

@ApiTags('Reports & Analytics')
@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  // General Reports
  @Get('reports/dashboard')
  @Permissions('reports:read')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get dashboard stats' })
  getDashboard() {
    return this.reportsService.getDashboard();
  }

  @Get('reports/service-requests')
  @Permissions('reports:read')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Service request analytics' })
  getServiceRequestMetrics() {
    return this.reportsService.getServiceRequestMetrics();
  }

  @Get('reports/subscriptions')
  @Permissions('reports:read')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Subscription metrics' })
  getSubscriptionMetrics() {
    return this.reportsService.getSubscriptionMetrics();
  }

  @Get('reports/revenue')
  @Permissions('reports:read')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Revenue analytics' })
  getRevenueReports() {
    return this.reportsService.getRevenueReports();
  }

  @Get('reports/users')
  @Permissions('reports:read')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'User statistics' })
  getUserStatistics() {
    return this.reportsService.getUserStatistics();
  }

  @Get('reports/user-activity')
  @Permissions('reports:read')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'User engagement metrics' })
  getUserActivityMetrics() {
    return this.reportsService.getUserActivityMetrics();
  }

  @Get('reports/appointments')
  @Permissions('reports:read')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Appointment analytics' })
  getAppointmentAnalytics() {
    return this.reportsService.getAppointmentAnalytics();
  }

  @Get('reports/export')
  @Permissions('reports:export')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Export report data' })
  exportReportData() {
    return this.reportsService.exportReportData();
  }

  // Admin Dashboard Routes
  @Get('admin/dashboard/stats')
  @Permissions('reports:read')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get overview stats' })
  getAdminDashboardStats() {
    return this.reportsService.getAdminDashboardStats();
  }

  @Get('admin/dashboard/pending-count')
  @Permissions('reports:read')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Pending requests count' })
  getPendingRequestsCount() {
    return this.reportsService.getPendingRequestsCount();
  }

  @Get('admin/dashboard/workload')
  @Permissions('reports:read')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Operator workload distribution' })
  getOperatorWorkload() {
    return this.reportsService.getOperatorWorkload();
  }
}