import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../modules/users/entities/user.entity';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.id) {
      throw new UnauthorizedException('User not authenticated');
    }

    try {
      // Get user with role
      const userWithRole = await this.userRepository.findOne({
        where: { id: user.id },
        relations: ['role'],
      });

      if (!userWithRole || !userWithRole.role) {
        throw new ForbiddenException('User role not found');
      }

      // Give admin full access to everything
      if (userWithRole.role.name === 'admin') {
        return true;
      }

      // Parse permissions from role JSON
      let userPermissions: string[] = [];
      if (userWithRole.role.permissions) {
        try {
          const rolePermissions = JSON.parse(userWithRole.role.permissions);
          userPermissions = rolePermissions.flatMap((perm: any) => 
            perm.actions.map((action: string) => `${perm.resource}:${action}`)
          );
        } catch (e) {
          console.error('Error parsing role permissions:', e);
        }
      }

      // Add hardcoded customer permissions for backward compatibility
      if (userWithRole.role.name === 'customer') {
        const customerPermissions = [
          'users:read_own',
          'users:write_own', 
          'family_members:read_own',
          'family_members:write_own',
          'family_members:delete_own',
          'service_requests:read_own',
          'service_requests:write_own',
          'documents:read_own',
          'documents:write_own',
          'appointments:read_own',
          'appointments:write_own',
          'notifications:read_own',
          'courses:read_own',
          'courses:write_own'
        ];
        userPermissions = [...userPermissions, ...customerPermissions];
      }

      const permissionNames = new Set(userPermissions);
      const hasPermission = requiredPermissions.some((permission) => {
        return permissionNames.has(permission);
      });

      if (!hasPermission) {
        throw new ForbiddenException(
          `Access denied. Required permissions: ${requiredPermissions.join(', ')}`,
        );
      }

      request.userPermissions = Array.from(permissionNames);

      return true;
    } catch (error) {
      if (
        error instanceof ForbiddenException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      throw new ForbiddenException('Permission validation failed');
    }
  }
}
