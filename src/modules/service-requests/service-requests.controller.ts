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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

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
  @ApiOperation({ summary: 'Get form schema' })
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
  @ApiOperation({ summary: 'Create service type' })
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
  @ApiOperation({ summary: 'Activate service type' })
  activate(@Param('id') id: string) {
    return this.serviceTypesService.activate(id);
  }
}

@ApiTags('Service Requests')
@Controller('service-requests')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ServiceRequestsController {
  constructor(private readonly serviceRequestsService: ServiceRequestsService) {}

  // Customer Routes
  @Get('my')
  @Permissions('service_requests:read_own')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'List my service requests' })
  findMy(@CurrentUser() user: any) {
    return this.serviceRequestsService.findByUser(user.id);
  }

  @Post()
  @Permissions('service_requests:write_own')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create service request' })
  create(@Body() dto: CreateServiceRequestDto, @CurrentUser() user: any) {
    return this.serviceRequestsService.create(dto, user.id);
  }

  @Get(':id')
  @Permissions('service_requests:read_own')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get request details' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.serviceRequestsService.findOne(id, user.id);
  }

  @Put(':id')
  @Permissions('service_requests:write_own')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update draft request' })
  update(@Param('id') id: string, @Body() dto: UpdateServiceRequestDto, @CurrentUser() user: any) {
    return this.serviceRequestsService.update(id, dto, user.id);
  }

  @Post(':id/submit')
  @Permissions('service_requests:write_own')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Submit request' })
  submit(@Param('id') id: string, @CurrentUser() user: any) {
    return this.serviceRequestsService.submit(id, user.id);
  }

  @Delete(':id')
  @Permissions('service_requests:delete_own')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete draft request' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.serviceRequestsService.remove(id, user.id);
  }

  @Get(':id/status-history')
  @Permissions('service_requests:read_own')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get status history' })
  getStatusHistory(@Param('id') id: string, @CurrentUser() user: any) {
    return this.serviceRequestsService.getStatusHistory(id, user.id);
  }

  @Post(':id/notes')
  @Permissions('service_requests:write_own')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Add user note' })
  addNote(@Param('id') id: string, @Body() dto: any, @CurrentUser() user: any) {
    return this.serviceRequestsService.addNote(id, dto, user.id);
  }

  // Extended Document Workflow
  @Get(':id/missing-documents')
  @Permissions('service_requests:read_own')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'List all missing document requests' })
  getMissingDocuments(@Param('id') id: string, @CurrentUser() user: any) {
    return this.serviceRequestsService.getMissingDocuments(id, user.id);
  }

  @Post(':id/documents/:documentId/reupload')
  @Permissions('service_requests:write_own')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Track reupload against specific document request' })
  reuploadDocument(
    @Param('id') id: string, 
    @Param('documentId') documentId: string, 
    @Body() dto: ReuploadDocumentDto,
    @CurrentUser() user: any
  ) {
    return this.serviceRequestsService.reuploadDocument(id, documentId, dto, user.id);
  }

  // Admin/Operator Routes
  @Get()
  @Permissions('service_requests:read')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'List all requests (filtered)' })
  findAll() {
    return this.serviceRequestsService.findAll({});
  }

  @Get('assigned-to-me')
  @Permissions('service_requests:read_assigned')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'List assigned requests' })
  findAssignedToMe(@CurrentUser() user: any) {
    return this.serviceRequestsService.findAssignedTo(user.id);
  }

  @Patch(':id/status')
  @Permissions('service_requests:write')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update status' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto, @CurrentUser() user: any) {
    return this.serviceRequestsService.updateStatus(id, dto, user.id);
  }

  @Post(':id/assign')
  @Permissions('service_requests:assign')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Assign to operator' })
  assign(@Param('id') id: string, @Body() dto: AssignOperatorDto) {
    return this.serviceRequestsService.assign(id, dto);
  }

  @Put(':id/internal-notes')
  @Permissions('service_requests:write')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update internal notes' })
  updateInternalNotes(@Param('id') id: string, @Body() dto: any) {
    return this.serviceRequestsService.updateInternalNotes(id, dto);
  }

  @Patch(':id/priority')
  @Permissions('service_requests:write')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Change priority' })
  changePriority(@Param('id') id: string, @Body() dto: UpdatePriorityDto) {
    return this.serviceRequestsService.changePriority(id, dto);
  }

  @Post(':id/request-documents')
  @Permissions('service_requests:write')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Request additional documents' })
  requestDocuments(@Param('id') id: string, @Body() dto: any) {
    return this.serviceRequestsService.requestDocuments(id, dto);
  }
}