import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Patch,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { FamilyMembersService } from './family-members.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { CreateFamilyMemberDto } from './dto/create-family-member.dto';
import { UpdateFamilyMemberDto } from './dto/update-family-member.dto';
import { UpdateGdprConsentDto } from './dto/update-gdpr-consent.dto';
import { AccountDeletionRequestDto } from './dto/account-deletion-request.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Customer Routes
  @Get('profile')
  @Permissions('users:read_own')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get own profile' })
  getProfile(@CurrentUser() user: any) {
    return this.usersService.getProfile(user.id);
  }

  @Put('profile')
  @Permissions('users:write_own')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update own profile' })
  updateProfile(@CurrentUser() user: any, @Body() dto: UpdateUserDto) {
    return this.usersService.updateProfile(user.id, dto);
  }

  @Get('profile/extended')
  @Permissions('users:read_own')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get extended profile' })
  getExtendedProfile(@CurrentUser() user: any) {
    return this.usersService.getExtendedProfile(user.id);
  }

  @Put('profile/extended')
  @Permissions('users:write_own')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update extended profile' })
  updateExtendedProfile(
    @CurrentUser() user: any,
    @Body() dto: UpdateUserProfileDto,
  ) {
    return this.usersService.updateExtendedProfile(user.id, dto);
  }

  @Post('avatar')
  @Permissions('users:write_own')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Upload avatar' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Avatar image file (JPEG, PNG, WebP)',
        },
      },
      required: ['file'],
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  uploadAvatar(
    @CurrentUser() user: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.usersService.uploadAvatar(user.id, file);
  }

  @Delete('avatar')
  @Permissions('users:write_own')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete avatar' })
  deleteAvatar(@CurrentUser() user: any) {
    return this.usersService.deleteAvatar(user.id);
  }

  // GDPR Compliance Routes
  @Post('gdpr/consent')
  @Permissions('users:write_own')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update consent preferences' })
  updateGdprConsent(@CurrentUser() user: any, @Body() dto: UpdateGdprConsentDto) {
    return this.usersService.updateGdprConsent(user.id, dto);
  }

  @Get('gdpr/data-export')
  @Permissions('users:read_own')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Request user data export' })
  requestDataExport(@CurrentUser() user: any) {
    return this.usersService.requestDataExport(user.id);
  }

  @Post('gdpr/deletion-request')
  @Permissions('users:write_own')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Request account deletion' })
  requestAccountDeletion(@CurrentUser() user: any, @Body() dto: AccountDeletionRequestDto) {
    return this.usersService.requestAccountDeletion(user.id, dto);
  }

  @Get('gdpr/consent-history')
  @Permissions('users:read_own')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'View consent history' })
  getConsentHistory(@CurrentUser() user: any) {
    return this.usersService.getConsentHistory(user.id);
  }

  // Admin Routes
  @Get()
  @Permissions('users:read')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'List all users' })
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @Permissions('users:read')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get user by ID' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Put(':id')
  @Permissions('users:write')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update user' })
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @Permissions('users:delete')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete user' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Patch(':id/activate')
  @Permissions('users:write')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Activate user' })
  activate(@Param('id') id: string) {
    return this.usersService.activate(id);
  }

  @Patch(':id/deactivate')
  @Permissions('users:write')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Deactivate user' })
  deactivate(@Param('id') id: string) {
    return this.usersService.deactivate(id);
  }

  @Get(':id/activity')
  @Permissions('users:read')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get user activity' })
  getUserActivity(@Param('id') id: string) {
    return this.usersService.getUserActivity(id);
  }

  @Get(':id/subscriptions')
  @Permissions('subscriptions:read')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get user subscriptions' })
  getUserSubscriptions(@Param('id') id: string) {
    return this.usersService.getUserSubscriptions(id);
  }
}