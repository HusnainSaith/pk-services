import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AssignPermissionsDto } from './dto/assign-permissions.dto';
import { AssignRoleDto } from './dto/assign-role.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';

@ApiTags('Roles & Permissions')
@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  // Roles Management
  @Get('roles')
  @Permissions('roles:read')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[Admin] List all roles' })
  findAllRoles() {
    return this.rolesService.findAll();
  }

  @Post('roles')
  @Permissions('roles:write')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[Admin] Create role' })
  createRole(@Body() dto: CreateRoleDto) {
    return this.rolesService.create(dto);
  }

  @Get('roles/:id')
  @Permissions('roles:read')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[Admin] Get role details' })
  findOneRole(@Param('id') id: string) {
    return this.rolesService.findOne(id);
  }

  @Put('roles/:id')
  @Permissions('roles:write')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[Admin] Update role' })
  updateRole(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.rolesService.update(id, dto);
  }

  @Delete('roles/:id')
  @Permissions('roles:delete')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[Admin] Delete role' })
  removeRole(@Param('id') id: string) {
    return this.rolesService.remove(id);
  }

  // Permissions Management
  @Get('permissions')
  @Permissions('permissions:read')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[Admin] List all permissions' })
  findAllPermissions() {
    return this.rolesService.findAllPermissions();
  }

  @Post('roles/:id/permissions')
  @Permissions('roles:write')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[Admin] Assign permissions to role' })
  assignPermissionsToRole(
    @Param('id') id: string,
    @Body() dto: AssignPermissionsDto,
  ) {
    return this.rolesService.assignPermissions(id, dto);
  }

  @Delete('roles/:roleId/permissions/:permissionId')
  @Permissions('roles:write')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[Admin] Remove permission from role' })
  removePermissionFromRole(
    @Param('roleId') roleId: string,
    @Param('permissionId') permissionId: string,
  ) {
    return this.rolesService.removePermission(roleId, permissionId);
  }

  // User Role Assignment
  @Post('users/:id/roles')
  @Permissions('users:write')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[Admin] Assign role to user' })
  assignRoleToUser(@Param('id') id: string, @Body() dto: AssignRoleDto) {
    return this.rolesService.assignRoleToUser(id, dto);
  }

  @Post('users/:id/permissions')
  @Permissions('users:write')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[Admin] Assign direct permission to user' })
  assignPermissionToUser(
    @Param('id') id: string,
    @Body() dto: AssignPermissionsDto,
  ) {
    return this.rolesService.assignPermissionToUser(id, dto);
  }
}
