import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
} from '@nestjs/common';
import {
  FileInterceptor,
  FileFieldsInterceptor,
} from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { FamilyMembersService } from './family-members.service';
import { UserRequest } from '../../common/interfaces/user-request.interface';
import { CreateFamilyMemberDto } from './dto/create-family-member.dto';
import { UpdateFamilyMemberDto } from './dto/update-family-member.dto';
import { UploadDocumentDto } from '../documents/dto/upload-document.dto';
import { UploadFamilyMemberDocumentsDto } from './dto/upload-family-member-documents.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Family Members')
@Controller('family-members')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class FamilyMembersController {
  constructor(private readonly familyMembersService: FamilyMembersService) {}

  // Customer Routes
  @Get()
  @Permissions('family-members:read')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[Customer] List own family members' })
  findMy(@CurrentUser() user: UserRequest) {
    return this.familyMembersService.findByUser(user.id);
  }

  @Post()
  @Permissions('family-members:create')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[Customer] Add family member' })
  create(@Body() dto: CreateFamilyMemberDto, @CurrentUser() user: UserRequest) {
    return this.familyMembersService.create(dto, user.id);
  }

  @Get(':id')
  @Permissions('family-members:read')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[Customer] Get family member details' })
  findOne(@Param('id') id: string, @CurrentUser() user: UserRequest) {
    return this.familyMembersService.findOne(user.id, id);
  }

  @Put(':id')
  @Permissions('family-members:update')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[Customer] Update family member' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateFamilyMemberDto,
    @CurrentUser() user: UserRequest,
  ) {
    return this.familyMembersService.update(id, dto, user.id);
  }

  @Delete(':id')
  @Permissions('family-members:delete')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[Customer] Delete family member' })
  remove(@Param('id') id: string, @CurrentUser() user: UserRequest) {
    return this.familyMembersService.remove(id, user.id);
  }

  // Extended Operations - Document Management
  @Get(':id/documents')
  @Permissions('family-members:read')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[Customer] Get documents for family member' })
  getFamilyMemberDocuments(
    @Param('id') id: string,
    @CurrentUser() user: UserRequest,
  ) {
    return this.familyMembersService.getFamilyMemberDocuments(id, user.id);
  }

  @Post(':id/documents')
  @Permissions('family-members:update')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[Customer] Upload document for family member' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'identityDocument', maxCount: 1 },
      { name: 'fiscalCode', maxCount: 1 },
      { name: 'birthCertificate', maxCount: 1 },
      { name: 'marriageCertificate', maxCount: 1 },
      { name: 'dependencyDocuments', maxCount: 1 },
      { name: 'disabilityCertificates', maxCount: 1 },
      { name: 'studentEnrollment', maxCount: 1 },
      { name: 'incomeDocuments', maxCount: 1 },
    ]),
  )
  uploadFamilyMemberDocument(
    @Param('id') id: string,
    @UploadedFiles() files: { [key: string]: Express.Multer.File[] },
    @Body() dto: UploadFamilyMemberDocumentsDto,
    @CurrentUser() user: UserRequest,
  ) {
    return this.familyMembersService.uploadFamilyMemberDocuments(
      id,
      files,
      dto,
      user.id,
    );
  }

  // Admin Routes
  @Get('user/:userId')
  @Permissions('family_members:read')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: "[Admin] List user's family members" })
  findByUser(@Param('userId') userId: string) {
    return this.familyMembersService.findByUser(userId);
  }
}
