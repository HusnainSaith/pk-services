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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { FamilyMembersService } from './family-members.service';
import { CreateFamilyMemberDto } from './dto/create-family-member.dto';
import { UpdateFamilyMemberDto } from './dto/update-family-member.dto';
import { UploadDocumentDto } from '../documents/dto/upload-document.dto';
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
  @Permissions('family_members:read_own')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'List own family members' })
  findMy(@CurrentUser() user: any) {
    return this.familyMembersService.findByUser(user.id);
  }

  @Post()
  @Permissions('family_members:write_own')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Add family member' })
  create(@Body() dto: CreateFamilyMemberDto, @CurrentUser() user: any) {
    return this.familyMembersService.create(dto, user.id);
  }

  @Get(':id')
  @Permissions('family_members:read_own')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get family member' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.familyMembersService.findOne(user.id, id);
  }

  @Put(':id')
  @Permissions('family_members:write_own')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update family member' })
  update(@Param('id') id: string, @Body() dto: UpdateFamilyMemberDto, @CurrentUser() user: any) {
    return this.familyMembersService.update(id, dto, user.id);
  }

  @Delete(':id')
  @Permissions('family_members:delete_own')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete family member' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.familyMembersService.remove(id, user.id);
  }

  // Extended Operations - Document Management
  @Get(':id/documents')
  @Permissions('family_members:read_own')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get documents for family member' })
  getFamilyMemberDocuments(@Param('id') id: string, @CurrentUser() user: any) {
    return this.familyMembersService.getFamilyMemberDocuments(id, user.id);
  }

  @Post(':id/documents')
  @Permissions('family_members:write_own')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Upload document for family member' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  uploadFamilyMemberDocument(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadDocumentDto,
    @CurrentUser() user: any,
  ) {
    return this.familyMembersService.uploadFamilyMemberDocument(id, file, dto, user.id);
  }

  // Admin Routes
  @Get('user/:userId')
  @Permissions('family_members:read')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'List user\'s family members' })
  findByUser(@Param('userId') userId: string) {
    return this.familyMembersService.findByUser(userId);
  }
}