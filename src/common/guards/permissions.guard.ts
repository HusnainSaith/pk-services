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
          userPermissions = rolePermissions.flatMap((perm: any) => {
            if (!perm || !perm.actions || !Array.isArray(perm.actions)) {
              return [];
            }
            return perm.actions.map(
              (action: string) => `${perm.resource}:${action}`,
            );
          });
        } catch (e) {
          console.error('Error parsing role permissions:', e);
        }
      }

      // Add hardcoded customer permissions for backward compatibility
      if (userWithRole.role.name === 'customer') {
        const customerPermissions = [
          // Auth permissions
          'auth:logout',
          'auth:change-password',
          'auth:read-profile',

          // User profile permissions
          'users:read',
          'users:read_own',
          'users:write_own',
          'users:update',
          'users:update_own',
          'profiles:read',
          'profiles:read_own',
          'profiles:update',
          'profiles:update_own',

          // Family members
          'family-members:create',
          'family-members:read',
          'family-members:read_own',
          'family-members:create_own',
          'family-members:update',
          'family-members:update_own',
          'family-members:delete',
          'family-members:delete_own',

          // Service requests
          'service-requests:create',
          'service-requests:read',
          'service-requests:read_own',
          'service-requests:update',
          'service-requests:update_own',
          'service-requests:delete',
          'service-requests:delete_own',

          // Documents
          'documents:create',
          'documents:read',
          'documents:read_own',
          'documents:create_own',
          'documents:upload',
          'documents:upload_own',
          'documents:delete',
          'documents:delete_own',

          // Appointments
          'appointments:create',
          'appointments:read',
          'appointments:read_own',
          'appointments:update',
          'appointments:update_own',
          'appointments:cancel',
          'appointments:cancel_own',

          // Notifications
          'notifications:read',
          'notifications:read_own',
          'notifications:update',
          'notifications:update_own',
          'notifications:delete',
          'notifications:delete_own',

          // Courses
          'courses:read',
          'courses:read_own',
          'courses:enroll',

          // Subscriptions
          'subscriptions:read',
          'subscriptions:read_own',
          'subscriptions:create',
          'subscriptions:update',
          'subscriptions:update_own',
          'subscriptions:cancel',
          'subscriptions:cancel_own',

          // Payments & Invoices
          'payments:read',
          'payments:read_own',
          'payments:create',
          'payments:create_own',
          'invoices:read',
          'invoices:read_own',
          'invoices:download',
          'invoices:download_own',

          // GDPR
          'gdpr:request_export',
          'gdpr:request_deletion',
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
