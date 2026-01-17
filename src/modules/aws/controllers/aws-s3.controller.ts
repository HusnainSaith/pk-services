import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { AwsS3FolderService } from '../services/aws-s3-folder.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { Permissions } from '../../../common/decorators/permissions.decorator';

/**
 * AWS S3 Controller
 * Manages S3 folder structure operations
 */
@ApiTags('AWS - S3 Management')
@Controller('aws/s3')
export class AwsS3Controller {
  constructor(private readonly awsS3FolderService: AwsS3FolderService) {}

  /**
   * Get folder structure information for a user
   * Admin only endpoint to view user's S3 folder organization
   */
  @Get('user-folders/:userId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('admin:read')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[Admin] Get user folder structure' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  getUserFolderStructure(@Param('userId') userId: string) {
    const folderPaths = this.awsS3FolderService.getUserFolderPaths(userId);
    return {
      userId,
      folderStructure: folderPaths,
      description:
        'User S3 folder structure with paths for profile and service documents',
    };
  }

  /**
   * Get available service types
   * Public endpoint to retrieve service types for upload organization
   */
  @Get('service-types')
  @ApiOperation({ summary: '[Public] Get available service types' })
  getServiceTypes() {
    const serviceTypes = this.awsS3FolderService.getAvailableServiceTypes();
    return {
      serviceTypes,
      description: 'Available service types for document organization in S3',
    };
  }

  /**
   * Manually create folder structure for user (admin/debug only)
   * In normal flow, this is called automatically on user registration
   */
  @Post('user-folders/:userId/create')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('admin:write')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Manually create user folder structure',
    description:
      'Creates S3 folder structure for user. Normally called automatically on registration.',
  })
  @ApiParam({ name: 'userId', description: 'User ID' })
  async createUserFolders(@Param('userId') userId: string) {
    await this.awsS3FolderService.createUserFolderStructure(userId);
    return {
      success: true,
      message: 'User S3 folder structure created successfully',
      userId,
      folderStructure: this.awsS3FolderService.getUserFolderPaths(userId),
    };
  }
}
