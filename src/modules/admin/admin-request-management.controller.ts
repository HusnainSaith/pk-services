import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AdminRequestManagementService } from './admin-request-management.service';
import { UpdateStatusDto } from '../service-requests/dto/update-status.dto';
import { AssignOperatorDto } from '../service-requests/dto/assign-operator.dto';

class AddInternalNoteDto {
  note: string;
}

class RequestDocumentsDto {
  categories: string[];
  reason: string;
}

class BulkUpdateStatusDto {
  requestIds: string[];
  status: string;
}

@ApiTags('Admin - Request Management (M7)')
@Controller('admin/requests')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('JWT-auth')
export class AdminRequestManagementController {
  constructor(
    private readonly adminRequestService: AdminRequestManagementService,
  ) {}

  /**
   * Get all service requests with comprehensive filtering
   * Supports pagination, filtering by status, service type, operator, priority
   */
  @Get()
  @Permissions('service_requests:read')
  @ApiOperation({
    summary: 'Get all service requests',
    description:
      'Fetch all service requests with filtering and pagination. Supports filtering by status, service type, operator, priority, and search.',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Comma-separated status filter',
  })
  @ApiQuery({ name: 'serviceTypeId', required: false })
  @ApiQuery({ name: 'assignedOperatorId', required: false })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'priority', required: false })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search by email, name, or ID',
  })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
  getAllRequests(@Query() query: any) {
    return this.adminRequestService.getAllRequests(query);
  }

  /**
   * Get detailed information about a specific request
   * Including documents, status history, and notes
   */
  @Get(':id')
  @Permissions('service_requests:read')
  @ApiOperation({
    summary: 'Get request detail',
    description: 'Fetch detailed information about a specific service request',
  })
  @ApiParam({ name: 'id', description: 'Request ID' })
  getRequestDetail(@Param('id') id: string) {
    return this.adminRequestService.getRequestDetail(id);
  }

  /**
   * Get requests assigned to a specific operator
   */
  @Get('operator/:operatorId')
  @Permissions('service_requests:read')
  @ApiOperation({
    summary: 'Get operator requests',
    description: 'Fetch all requests assigned to a specific operator',
  })
  @ApiParam({ name: 'operatorId' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'priority', required: false })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  getOperatorRequests(
    @Param('operatorId') operatorId: string,
    @Query() filters: any,
  ) {
    return this.adminRequestService.getOperatorRequests(operatorId, filters);
  }

  /**
   * Assign a request to an operator
   */
  @Post(':id/assign')
  @Permissions('service_requests:assign')
  @ApiOperation({
    summary: 'Assign request to operator',
    description: 'Assign a service request to an operator',
  })
  @ApiParam({ name: 'id' })
  assignToOperator(
    @Param('id') id: string,
    @Body() dto: AssignOperatorDto,
    @CurrentUser() user: any,
  ) {
    return this.adminRequestService.assignToOperator(
      id,
      dto.operatorId,
      user.id,
    );
  }

  /**
   * Update request status with validation of state transitions
   */
  @Patch(':id/status')
  @Permissions('service_requests:write')
  @ApiOperation({
    summary: 'Update request status',
    description:
      'Update service request status. Validates proper state transitions (draft → submitted → in_review, etc.)',
  })
  @ApiParam({ name: 'id' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
    @CurrentUser() user: any,
  ) {
    if (!dto.status) {
      throw new BadRequestException('Status is required');
    }
    return this.adminRequestService.updateRequestStatus(
      id,
      dto.status,
      user.id,
      dto.reason,
    );
  }

  /**
   * Add internal note to request (visible only to admin/operator)
   */
  @Post(':id/internal-notes')
  @Permissions('service_requests:write')
  @ApiOperation({
    summary: 'Add internal note',
    description: 'Add internal note to request (not visible to user)',
  })
  @ApiParam({ name: 'id' })
  addInternalNote(
    @Param('id') id: string,
    @Body() dto: AddInternalNoteDto,
    @CurrentUser() user: any,
  ) {
    if (!dto.note) {
      throw new BadRequestException('Note is required');
    }
    return this.adminRequestService.addInternalNote(id, dto.note, user.id);
  }

  /**
   * Request additional documents from user
   */
  @Post(':id/request-documents')
  @Permissions('service_requests:write')
  @ApiOperation({
    summary: 'Request additional documents',
    description:
      'Send document request to user and update status to missing_documents',
  })
  @ApiParam({ name: 'id' })
  requestDocuments(
    @Param('id') id: string,
    @Body() dto: RequestDocumentsDto,
    @CurrentUser() user: any,
  ) {
    if (!dto.categories || dto.categories.length === 0) {
      throw new BadRequestException('Document categories are required');
    }
    return this.adminRequestService.requestAdditionalDocuments(
      id,
      dto.categories,
      dto.reason || 'Additional documents required',
      user.id,
    );
  }

  /**
   * Get request statistics for a date range
   */
  @Get('stats/overview')
  @Permissions('service_requests:read')
  @ApiOperation({
    summary: 'Get request statistics',
    description:
      'Fetch statistics about service requests (completion rate, by service type, etc.)',
  })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  getStatistics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.adminRequestService.getRequestStatistics({
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  /**
   * Bulk update status for multiple requests
   */
  @Patch('bulk/update-status')
  @Permissions('service_requests:write')
  @ApiOperation({
    summary: 'Bulk update status',
    description: 'Update status for multiple requests at once',
  })
  bulkUpdateStatus(
    @Body() dto: BulkUpdateStatusDto,
    @CurrentUser() user: any,
  ) {
    if (!dto.requestIds || dto.requestIds.length === 0) {
      throw new BadRequestException('Request IDs are required');
    }
    if (!dto.status) {
      throw new BadRequestException('Status is required');
    }
    return this.adminRequestService.bulkUpdateStatus(
      dto.requestIds,
      dto.status,
      user.id,
    );
  }

  /**
   * Export requests in specified format
   */
  @Get('export/:format')
  @Permissions('service_requests:read')
  @ApiOperation({
    summary: 'Export requests',
    description: 'Export requests in CSV or PDF format',
  })
  @ApiParam({ name: 'format', enum: ['csv', 'pdf'] })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'serviceTypeId', required: false })
  exportRequests(
    @Param('format') format: 'csv' | 'pdf',
    @Query() filters: any,
  ) {
    if (!['csv', 'pdf'].includes(format)) {
      throw new BadRequestException('Invalid format. Use csv or pdf');
    }
    return this.adminRequestService.exportRequests(format, filters);
  }
}
