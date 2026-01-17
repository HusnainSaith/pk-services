import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { UploadMultipleDocumentsDto } from './dto/upload-multiple-documents.dto';
import { ApproveDocumentDto } from './dto/approve-document.dto';
import { RejectDocumentDto } from './dto/reject-document.dto';
import { AddNotesDto } from './dto/add-notes.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Documents')
@Controller('documents')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get('service-type/:serviceTypeId/required')
  @Permissions('documents:read_own')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: '[Customer] Get required documents for service type',
  })
  getRequiredDocuments(@Param('serviceTypeId') serviceTypeId: string) {
    return this.documentsService.getRequiredDocuments(serviceTypeId);
  }

  @Post('upload-multiple')
  @Permissions('documents:write_own')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[Customer] Upload multiple documents by type' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'identityDocument', maxCount: 1 },
      { name: 'fiscalCode', maxCount: 1 },
      { name: 'incomeCertificate', maxCount: 1 },
      { name: 'bankStatement', maxCount: 1 },
      { name: 'propertyDocument', maxCount: 1 },
      { name: 'visuraCatastale', maxCount: 1 },
      { name: 'propertyDeed', maxCount: 1 },
      { name: 'cuCertificate', maxCount: 1 },
      { name: 'medicalReceipts', maxCount: 1 },
      { name: 'expenseReceipts', maxCount: 1 },
      { name: 'otherDocument', maxCount: 1 },
    ]),
  )
  uploadMultiple(
    @UploadedFiles() files: { [key: string]: Express.Multer.File[] },
    @Body() dto: UploadMultipleDocumentsDto,
    @CurrentUser() user: any,
  ) {
    return this.documentsService.uploadMultiple(files, dto, user.id);
  }

  // Customer Routes
  // @Post('upload')
  // @Permissions('documents:write_own')
  // @ApiBearerAuth('JWT-auth')
  // @ApiOperation({ summary: 'Upload document' })
  // @ApiConsumes('multipart/form-data')
  // @UseInterceptors(FileInterceptor('file'))
  // uploadDocument(
  //   @UploadedFile() file: Express.Multer.File,
  //   @Body() dto: UploadDocumentDto,
  //   @CurrentUser() user: any,
  // ) {
  //   return this.documentsService.upload(file, dto, user.id);
  // }

  @Get('request/:requestId')
  @Permissions('documents:read_own')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[Customer] List request documents' })
  findByRequest(
    @Param('requestId') requestId: string,
    @CurrentUser() user: any,
  ) {
    return this.documentsService.findByRequest(requestId, user.id);
  }

  @Get(':id')
  @Permissions('documents:read_own')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[Customer] Get document details' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.documentsService.findOne(id);
  }

  @Get(':id/download')
  @Permissions('documents:read_own')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[Customer] Download document' })
  download(@Param('id') id: string, @CurrentUser() user: any) {
    return this.documentsService.download(id, user.id);
  }

  @Patch(':id')
  @Permissions('documents:write_own')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[Customer] Replace document' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'identityDocument', maxCount: 1 },
      { name: 'fiscalCode', maxCount: 1 },
      { name: 'incomeCertificate', maxCount: 1 },
      { name: 'bankStatement', maxCount: 1 },
      { name: 'propertyDocument', maxCount: 1 },
      { name: 'visuraCatastale', maxCount: 1 },
      { name: 'propertyDeed', maxCount: 1 },
      { name: 'cuCertificate', maxCount: 1 },
      { name: 'medicalReceipts', maxCount: 1 },
      { name: 'expenseReceipts', maxCount: 1 },
      { name: 'otherDocument', maxCount: 1 },
    ]),
  )
  replace(
    @Param('id') id: string,
    @UploadedFiles() files: { [key: string]: Express.Multer.File[] },
    @Body() dto: UploadMultipleDocumentsDto,
    @CurrentUser() user: any,
  ) {
    return this.documentsService.replaceMultiple(id, files, dto, user.id);
  }

  @Delete(':id')
  @Permissions('documents:delete_own')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[Customer] Delete document' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.documentsService.remove(id);
  }

  // Admin/Operator Routes
  @Get('request/:requestId/all')
  @Permissions('documents:read')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[Admin] List all request documents' })
  findAllByRequest(@Param('requestId') requestId: string) {
    return this.documentsService.findAllByRequest(requestId);
  }

  @Patch(':id/approve')
  @Permissions('documents:approve')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[Admin] Approve document' })
  approve(@Param('id') id: string, @Body() dto: ApproveDocumentDto) {
    return this.documentsService.approve(id, dto);
  }

  @Patch(':id/reject')
  @Permissions('documents:approve')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[Admin] Reject document' })
  reject(@Param('id') id: string, @Body() dto: RejectDocumentDto) {
    return this.documentsService.reject(id, dto);
  }

  @Post(':id/notes')
  @Permissions('documents:write')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[Admin] Add admin notes' })
  addNotes(@Param('id') id: string, @Body() dto: AddNotesDto) {
    return this.documentsService.addNotes(id, dto);
  }

  @Get(':id/preview')
  @Permissions('documents:read')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[Admin] Preview document' })
  preview(@Param('id') id: string) {
    return this.documentsService.preview(id);
  }
}
