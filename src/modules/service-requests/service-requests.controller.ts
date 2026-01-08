import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Param,
  Body,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ServiceRequestsService } from './service-requests.service';
import { ServiceTypesService } from './service-types.service';
import { CreateServiceRequestDto } from './dto/create-service-request.dto';
import { UpdateServiceRequestDto } from './dto/update-service-request.dto';
import { CreateServiceTypeDto } from './dto/create-service-type.dto';
import { UpdateServiceTypeDto } from './dto/update-service-type.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { AssignOperatorDto } from './dto/assign-operator.dto';
import { UpdatePriorityDto } from './dto/update-priority.dto';
import { ReuploadDocumentDto } from './dto/reupload-document.dto';
import { AddNoteDto, SubmitServiceRequestDto } from './dto/service-request.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

/**
 * Service Types Controller
 * Manages available service types (ISEE, Modello 730, IMU)
 */
@ApiTags('Service Types')
@Controller('service-types')
export class ServiceTypesController {
  constructor(private readonly serviceTypesService: ServiceTypesService) {}

  // Public Routes
  @Get()
  @ApiOperation({ summary: 'List active service types' })
  findActive() {
    return this.serviceTypesService.findActive();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get service type details' })
  findOne(@Param('id') id: string) {
    return this.serviceTypesService.findOne(id);
  }

  @Get(':id/schema')
  @ApiOperation({ summary: 'Get form schema for service type' })
  getSchema(@Param('id') id: string) {
    return this.serviceTypesService.getSchema(id);
  }

  @Get(':id/required-documents')
  @ApiOperation({ summary: 'Get required document list' })
  getRequiredDocuments(@Param('id') id: string) {
    return this.serviceTypesService.getRequiredDocuments(id);
  }

  // Admin Routes
  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('service_types:write')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create new service type (admin)' })
  create(@Body() dto: CreateServiceTypeDto) {
    return this.serviceTypesService.create(dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('service_types:write')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update service type' })
  update(@Param('id') id: string, @Body() dto: UpdateServiceTypeDto) {
    return this.serviceTypesService.update(id, dto);
  }

  @Put(':id/schema')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('service_types:write')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update form schema' })
  updateSchema(@Param('id') id: string, @Body() schema: any) {
    return this.serviceTypesService.updateSchema(id, schema);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('service_types:delete')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete service type' })
  remove(@Param('id') id: string) {
    return this.serviceTypesService.remove(id);
  }

  @Patch(':id/activate')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('service_types:write')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Activate/deactivate service type' })
  activate(@Param('id') id: string) {
    return this.serviceTypesService.activate(id);
  }
}

/**
 * Service Requests Controller - M3 Implementation
 * Handles creation and management of service requests for ISEE, 730/PF, and IMU
 */
@ApiTags('Service Requests - M3')
@Controller('service-requests')
@UseGuards(JwtAuthGuard)
export class ServiceRequestsController {
  constructor(private readonly serviceRequestsService: ServiceRequestsService) {}

  // ========== CUSTOMER ROUTES ==========

  /**
   * List user's own service requests
   */
  @Get('my')
  @UseGuards(PermissionsGuard)
  @Permissions('service_requests:read_own')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get my service requests' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiQuery({ name: 'serviceTypeId', required: false, description: 'Filter by service type' })
  findMy(
    @CurrentUser() user: any,
    @Query('status') status?: string,
    @Query('serviceTypeId') serviceTypeId?: string,
  ) {
    return this.serviceRequestsService.findByUser(user.id, { status, serviceTypeId });
  }

  /**
   * Create new service request (Draft)
   * Supports ISEE, MODELLO_730, and IMU service types
   */
  @Post()
  @UseGuards(PermissionsGuard)
  @Permissions('service_requests:write_own')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create new service request (draft)' })
  @ApiQuery({ name: 'serviceType', required: true, description: 'ISEE | MODELLO_730 | IMU' })
  create(
    @Body() dto: CreateServiceRequestDto,
    @CurrentUser() user: any,
    @Query('serviceType') serviceType: string = 'ISEE',
  ) {
    return this.serviceRequestsService.create(dto, user.id, serviceType);
  }

  /**
   * Get service request details
   */
  @Get(':id')
  @UseGuards(PermissionsGuard)
  @Permissions('service_requests:read_own')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get service request details' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.serviceRequestsService.findOne(id, user.id, user.role);
  }

  /**
   * Update draft service request
   */
  @Put(':id')
  @UseGuards(PermissionsGuard)
  @Permissions('service_requests:write_own')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update draft request' })
  @ApiQuery({ name: 'serviceType', required: false })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateServiceRequestDto,
    @CurrentUser() user: any,
    @Query('serviceType') serviceType?: string,
  ) {
    return this.serviceRequestsService.update(id, dto, user.id, serviceType);
  }

  /**
   * Submit service request for processing
   * Transitions from DRAFT → SUBMITTED
   */
  @Post(':id/submit')
  @UseGuards(PermissionsGuard)
  @Permissions('service_requests:write_own')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Submit request for processing' })
  submit(
    @Param('id') id: string,
    @Body() dto: SubmitServiceRequestDto,
    @CurrentUser() user: any,
  ) {
    return this.serviceRequestsService.submit(id, user.id, dto);
  }

  /**
   * Delete draft service request
   */
  @Delete(':id')
  @UseGuards(PermissionsGuard)
  @Permissions('service_requests:delete_own')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete draft request' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.serviceRequestsService.remove(id, user.id);
  }

  /**
   * Get status history for a request
   */
  @Get(':id/status-history')
  @UseGuards(PermissionsGuard)
  @Permissions('service_requests:read_own')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get status history' })
  getStatusHistory(@Param('id') id: string, @CurrentUser() user: any) {
    return this.serviceRequestsService.getStatusHistory(id, user.id);
  }

  /**
   * Add note to request
   * Can be internal (admin/operator) or user-visible
   */
  @Post(':id/notes')
  @UseGuards(PermissionsGuard)
  @Permissions('service_requests:write_own')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Add note (user-visible or internal)' })
  addNote(
    @Param('id') id: string,
    @Body() dto: AddNoteDto,
    @CurrentUser() user: any,
  ) {
    return this.serviceRequestsService.addNote(id, dto, user.id);
  }

  // ========== ADMIN/OPERATOR ROUTES ==========

  /**
   * List all service requests with filtering
   * Requires admin or operator role
   */
  @Get()
  @UseGuards(PermissionsGuard)
  @Permissions('service_requests:read')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'List all requests (admin/operator)' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'serviceType', required: false, description: 'Filter by service type ID or code' })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'assignedOperatorId', required: false })
  @ApiQuery({ name: 'priority', required: false })
  @ApiQuery({ name: 'search', required: false, description: 'Search by user email/name' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
  findAll(@Query() query: any) {
    // Map serviceType to serviceTypeId for backward compatibility
    if (query.serviceType) {
      query.serviceTypeId = query.serviceType;
    }
    return this.serviceRequestsService.findAll(query);
  }

  /**
   * Update request status
   * Enforces proper state transitions
   */
  @Patch(':id/status')
  @UseGuards(PermissionsGuard)
  @Permissions('service_requests:write')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update request status' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
    @CurrentUser() user: any,
  ) {
    return this.serviceRequestsService.updateStatus(id, dto.status, user.id, dto.reason);
  }

  /**
   * Assign request to operator
   */
  @Post(':id/assign')
  @UseGuards(PermissionsGuard)
  @Permissions('service_requests:assign')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Assign to operator' })
  assign(
    @Param('id') id: string,
    @Body() dto: AssignOperatorDto,
    @CurrentUser() user: any,
  ) {
    return this.serviceRequestsService.assignOperator(id, dto.operatorId, user.id);
  }

  /**
   * Add internal note (admin/operator only)
   */
  @Post(':id/internal-notes')
  @UseGuards(PermissionsGuard)
  @Permissions('service_requests:write')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Add internal note' })
  addInternalNote(
    @Param('id') id: string,
    @Body() dto: AddNoteDto,
    @CurrentUser() user: any,
  ) {
    return this.serviceRequestsService.addNote(id, { ...dto, type: 'internal' }, user.id);
  }

  /**
   * Change request priority
   */
  @Patch(':id/priority')
  @UseGuards(PermissionsGuard)
  @Permissions('service_requests:write')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Change priority' })
  changePriority(
    @Param('id') id: string,
    @Body() dto: UpdatePriorityDto,
  ) {
    // Implement priority update
    return { success: true, message: 'Priority updated' };
  }

  /**
   * Request additional documents from user
   */
  @Post(':id/request-documents')
  @UseGuards(PermissionsGuard)
  @Permissions('service_requests:write')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Request additional documents' })
  requestDocuments(
    @Param('id') id: string,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    // Implement document request
    return { success: true, message: 'Document request sent' };
  }
}
