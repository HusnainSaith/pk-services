import { DataSource } from 'typeorm';
import { Role } from '../src/modules/roles/entities/role.entity';
import { Permission } from '../src/modules/roles/entities/permission.entity';
import { RolePermission } from '../src/modules/roles/entities/role-permission.entity';
import { RoleEnum } from '../src/modules/roles/role.enum';

interface PermissionDefinition {
  resource: string;
  action: string;
  description: string;
}

interface RolePermissionMapping {
  role: RoleEnum;
  permissions: PermissionDefinition[];
}

export async function seedRolePermissions(dataSource: DataSource) {
  const roleRepository = dataSource.getRepository(Role);
  const permissionRepository = dataSource.getRepository(Permission);
  const rolePermissionRepository = dataSource.getRepository(RolePermission);

  console.log('\n🔐 Starting Role-Permission Seed...\n');

  // Define all permissions for each role based on client requirements
  const rolePermissionMappings: RolePermissionMapping[] = [
    {
      role: RoleEnum.ADMIN,
      permissions: [
        // User Management - Full Access
        {
          resource: 'users',
          action: 'create',
          description: 'Create new users',
        },
        { resource: 'users', action: 'read', description: 'View all users' },
        { resource: 'users', action: 'update', description: 'Update any user' },
        { resource: 'users', action: 'delete', description: 'Delete users' },
        { resource: 'users', action: 'list', description: 'List all users' },
        {
          resource: 'users',
          action: 'activate',
          description: 'Activate/deactivate users',
        },

        // Profiles
        {
          resource: 'profiles',
          action: 'read',
          description: 'View all profiles',
        },
        {
          resource: 'profiles',
          action: 'update',
          description: 'Update any profile',
        },
        {
          resource: 'profiles',
          action: 'delete',
          description: 'Delete profiles',
        },

        // Service Requests - Full Management
        {
          resource: 'service-requests',
          action: 'create',
          description: 'Create service requests',
        },
        {
          resource: 'service-requests',
          action: 'read',
          description: 'View all service requests',
        },
        {
          resource: 'service-requests',
          action: 'update',
          description: 'Update any service request',
        },
        {
          resource: 'service-requests',
          action: 'delete',
          description: 'Delete service requests',
        },
        {
          resource: 'service-requests',
          action: 'list',
          description: 'List all service requests',
        },
        {
          resource: 'service-requests',
          action: 'assign',
          description: 'Assign to operators',
        },
        {
          resource: 'service-requests',
          action: 'status-change',
          description: 'Change request status',
        },
        {
          resource: 'service-requests',
          action: 'priority-change',
          description: 'Change priority',
        },

        // Service Types - Full Management
        {
          resource: 'service-types',
          action: 'create',
          description: 'Create service types',
        },
        {
          resource: 'service-types',
          action: 'read',
          description: 'View service types',
        },
        {
          resource: 'service-types',
          action: 'update',
          description: 'Update service types',
        },
        {
          resource: 'service-types',
          action: 'delete',
          description: 'Delete service types',
        },
        {
          resource: 'service-types',
          action: 'list',
          description: 'List all service types',
        },

        // Documents - Full Management
        {
          resource: 'documents',
          action: 'create',
          description: 'Upload documents',
        },
        {
          resource: 'documents',
          action: 'read',
          description: 'View all documents',
        },
        {
          resource: 'documents',
          action: 'update',
          description: 'Update documents',
        },
        {
          resource: 'documents',
          action: 'delete',
          description: 'Delete documents',
        },
        {
          resource: 'documents',
          action: 'download',
          description: 'Download documents',
        },
        {
          resource: 'documents',
          action: 'approve',
          description: 'Approve documents',
        },
        {
          resource: 'documents',
          action: 'reject',
          description: 'Reject documents',
        },

        // Appointments - Full Management
        {
          resource: 'appointments',
          action: 'create',
          description: 'Create appointments',
        },
        {
          resource: 'appointments',
          action: 'read',
          description: 'View all appointments',
        },
        {
          resource: 'appointments',
          action: 'update',
          description: 'Update any appointment',
        },
        {
          resource: 'appointments',
          action: 'delete',
          description: 'Delete appointments',
        },
        {
          resource: 'appointments',
          action: 'list',
          description: 'List all appointments',
        },
        {
          resource: 'appointments',
          action: 'assign',
          description: 'Assign appointments',
        },
        {
          resource: 'appointments',
          action: 'reschedule',
          description: 'Reschedule appointments',
        },

        // Appointment Slots
        {
          resource: 'appointment-slots',
          action: 'create',
          description: 'Create appointment slots',
        },
        {
          resource: 'appointment-slots',
          action: 'read',
          description: 'View appointment slots',
        },
        {
          resource: 'appointment-slots',
          action: 'update',
          description: 'Update appointment slots',
        },
        {
          resource: 'appointment-slots',
          action: 'delete',
          description: 'Delete appointment slots',
        },
        {
          resource: 'appointment-slots',
          action: 'manage',
          description: 'Manage all slots',
        },

        // Subscriptions - Full Management
        {
          resource: 'subscriptions',
          action: 'read',
          description: 'View all subscriptions',
        },
        {
          resource: 'subscriptions',
          action: 'update',
          description: 'Update subscriptions',
        },
        {
          resource: 'subscriptions',
          action: 'delete',
          description: 'Cancel subscriptions',
        },
        {
          resource: 'subscriptions',
          action: 'list',
          description: 'List all subscriptions',
        },
        {
          resource: 'subscriptions',
          action: 'override',
          description: 'Override subscription limits',
        },
        {
          resource: 'subscriptions',
          action: 'assign',
          description: 'Manually assign subscriptions',
        },

        // Subscription Plans
        {
          resource: 'subscription-plans',
          action: 'create',
          description: 'Create subscription plans',
        },
        {
          resource: 'subscription-plans',
          action: 'read',
          description: 'View subscription plans',
        },
        {
          resource: 'subscription-plans',
          action: 'update',
          description: 'Update subscription plans',
        },
        {
          resource: 'subscription-plans',
          action: 'delete',
          description: 'Delete subscription plans',
        },
        {
          resource: 'subscription-plans',
          action: 'activate',
          description: 'Activate/deactivate plans',
        },

        // Payments
        {
          resource: 'payments',
          action: 'read',
          description: 'View all payments',
        },
        {
          resource: 'payments',
          action: 'list',
          description: 'List all payments',
        },
        {
          resource: 'payments',
          action: 'refund',
          description: 'Process refunds',
        },
        {
          resource: 'payments',
          action: 'export',
          description: 'Export payment data',
        },

        // Courses
        {
          resource: 'courses',
          action: 'create',
          description: 'Create courses',
        },
        {
          resource: 'courses',
          action: 'read',
          description: 'View all courses',
        },
        {
          resource: 'courses',
          action: 'update',
          description: 'Update courses',
        },
        {
          resource: 'courses',
          action: 'delete',
          description: 'Delete courses',
        },
        {
          resource: 'courses',
          action: 'list',
          description: 'List all courses',
        },

        // Course Enrollments
        {
          resource: 'course-enrollments',
          action: 'read',
          description: 'View enrollments',
        },
        {
          resource: 'course-enrollments',
          action: 'update',
          description: 'Update enrollments',
        },
        {
          resource: 'course-enrollments',
          action: 'delete',
          description: 'Cancel enrollments',
        },
        {
          resource: 'course-enrollments',
          action: 'list',
          description: 'List all enrollments',
        },

        // Notifications
        {
          resource: 'notifications',
          action: 'create',
          description: 'Create notifications',
        },
        {
          resource: 'notifications',
          action: 'read',
          description: 'View all notifications',
        },
        {
          resource: 'notifications',
          action: 'send',
          description: 'Send notifications',
        },
        {
          resource: 'notifications',
          action: 'list',
          description: 'List all notifications',
        },

        // CMS
        {
          resource: 'cms',
          action: 'create',
          description: 'Create CMS content',
        },
        { resource: 'cms', action: 'read', description: 'View CMS content' },
        {
          resource: 'cms',
          action: 'update',
          description: 'Update CMS content',
        },
        {
          resource: 'cms',
          action: 'delete',
          description: 'Delete CMS content',
        },

        // FAQs
        { resource: 'faqs', action: 'create', description: 'Create FAQs' },
        { resource: 'faqs', action: 'read', description: 'View FAQs' },
        { resource: 'faqs', action: 'update', description: 'Update FAQs' },
        { resource: 'faqs', action: 'delete', description: 'Delete FAQs' },

        // Reports & Analytics
        { resource: 'reports', action: 'read', description: 'View reports' },
        {
          resource: 'reports',
          action: 'generate',
          description: 'Generate reports',
        },
        {
          resource: 'reports',
          action: 'export',
          description: 'Export reports',
        },
        {
          resource: 'analytics',
          action: 'read',
          description: 'View analytics',
        },
        {
          resource: 'analytics',
          action: 'dashboard',
          description: 'Access admin dashboard',
        },

        // Invoices - Full Management
        {
          resource: 'invoices',
          action: 'create',
          description: 'Create invoices',
        },
        {
          resource: 'invoices',
          action: 'read',
          description: 'View all invoices',
        },
        {
          resource: 'invoices',
          action: 'update',
          description: 'Update invoices',
        },
        {
          resource: 'invoices',
          action: 'delete',
          description: 'Delete invoices',
        },
        {
          resource: 'invoices',
          action: 'list',
          description: 'List all invoices',
        },
        {
          resource: 'invoices',
          action: 'download',
          description: 'Download any invoice',
        },

        // Audit Logs
        {
          resource: 'audit-logs',
          action: 'read',
          description: 'View audit logs',
        },
        {
          resource: 'audit-logs',
          action: 'list',
          description: 'List audit logs',
        },
        {
          resource: 'audit-logs',
          action: 'export',
          description: 'Export audit logs',
        },

        // Webhooks
        {
          resource: 'webhooks',
          action: 'read',
          description: 'View webhook configs',
        },
        {
          resource: 'webhooks',
          action: 'create',
          description: 'Create webhooks',
        },
        {
          resource: 'webhooks',
          action: 'update',
          description: 'Update webhooks',
        },
        {
          resource: 'webhooks',
          action: 'delete',
          description: 'Delete webhooks',
        },
        {
          resource: 'webhooks',
          action: 'test',
          description: 'Test webhook endpoints',
        },

        // AWS S3
        { resource: 'aws-s3', action: 'read', description: 'View S3 objects' },
        { resource: 'aws-s3', action: 'upload', description: 'Upload to S3' },
        { resource: 'aws-s3', action: 'delete', description: 'Delete from S3' },
        {
          resource: 'aws-s3',
          action: 'manage',
          description: 'Manage S3 buckets',
        },
        {
          resource: 'audit-logs',
          action: 'list',
          description: 'List audit logs',
        },

        // Roles & Permissions
        { resource: 'roles', action: 'create', description: 'Create roles' },
        { resource: 'roles', action: 'read', description: 'View roles' },
        { resource: 'roles', action: 'update', description: 'Update roles' },
        { resource: 'roles', action: 'delete', description: 'Delete roles' },
        {
          resource: 'permissions',
          action: 'read',
          description: 'View permissions',
        },
        {
          resource: 'permissions',
          action: 'assign',
          description: 'Assign permissions',
        },

        // System Settings
        {
          resource: 'system-settings',
          action: 'read',
          description: 'View system settings',
        },
        {
          resource: 'system-settings',
          action: 'update',
          description: 'Update system settings',
        },
      ],
    },
    {
      role: RoleEnum.CUSTOMER,
      permissions: [
        // Profile - Own Only
        {
          resource: 'profiles',
          action: 'read',
          description: 'View own profile',
        },
        {
          resource: 'profiles',
          action: 'update',
          description: 'Update own profile',
        },

        // Family Members - Own Only
        {
          resource: 'family-members',
          action: 'create',
          description: 'Add family members',
        },
        {
          resource: 'family-members',
          action: 'read',
          description: 'View own family members',
        },
        {
          resource: 'family-members',
          action: 'update',
          description: 'Update family members',
        },
        {
          resource: 'family-members',
          action: 'delete',
          description: 'Remove family members',
        },

        // Service Requests - Own Only
        {
          resource: 'service-requests',
          action: 'create',
          description: 'Create own service requests',
        },
        {
          resource: 'service-requests',
          action: 'read',
          description: 'View own service requests',
        },
        {
          resource: 'service-requests',
          action: 'update',
          description: 'Update own draft requests',
        },
        {
          resource: 'service-requests',
          action: 'submit',
          description: 'Submit service requests',
        },
        {
          resource: 'service-requests',
          action: 'cancel',
          description: 'Cancel own requests',
        },

        // Service Types - Public View
        {
          resource: 'service-types',
          action: 'read',
          description: 'View service types',
        },
        {
          resource: 'service-types',
          action: 'list',
          description: 'List available services',
        },

        // Documents - Own Only
        {
          resource: 'documents',
          action: 'create',
          description: 'Upload own documents',
        },
        {
          resource: 'documents',
          action: 'write_own',
          description: 'Upload/write own documents',
        },
        {
          resource: 'documents',
          action: 'read',
          description: 'View own documents',
        },
        {
          resource: 'documents',
          action: 'update',
          description: 'Update own documents',
        },
        {
          resource: 'documents',
          action: 'delete',
          description: 'Delete own documents',
        },
        {
          resource: 'documents',
          action: 'download',
          description: 'Download own documents',
        },

        // Invoices - Own Only
        {
          resource: 'invoices',
          action: 'read',
          description: 'View own invoices',
        },
        {
          resource: 'invoices',
          action: 'download',
          description: 'Download own invoices',
        },

        // Payments - Own Only
        {
          resource: 'appointments',
          action: 'create',
          description: 'Book appointments',
        },
        {
          resource: 'appointments',
          action: 'read',
          description: 'View own appointments',
        },
        {
          resource: 'appointments',
          action: 'update',
          description: 'Update own appointments',
        },
        {
          resource: 'appointments',
          action: 'cancel',
          description: 'Cancel own appointments',
        },
        {
          resource: 'appointments',
          action: 'reschedule',
          description: 'Reschedule appointments',
        },

        // Appointment Slots - View Only
        {
          resource: 'appointment-slots',
          action: 'read',
          description: 'View available slots',
        },

        // Subscriptions - Own Only
        {
          resource: 'subscriptions',
          action: 'read',
          description: 'View own subscription',
        },
        {
          resource: 'subscriptions',
          action: 'update',
          description: 'Update own subscription',
        },
        {
          resource: 'subscriptions',
          action: 'cancel',
          description: 'Cancel own subscription',
        },

        // Subscription Plans - Public View
        {
          resource: 'subscription-plans',
          action: 'read',
          description: 'View subscription plans',
        },
        {
          resource: 'subscription-plans',
          action: 'list',
          description: 'List available plans',
        },

        // Payments - Own Only
        {
          resource: 'payments',
          action: 'create',
          description: 'Make payments',
        },
        {
          resource: 'payments',
          action: 'read',
          description: 'View own payment history',
        },

        // Courses - View & Enroll
        {
          resource: 'courses',
          action: 'read',
          description: 'View available courses',
        },
        { resource: 'courses', action: 'list', description: 'List courses' },
        {
          resource: 'course-enrollments',
          action: 'create',
          description: 'Enroll in courses',
        },
        {
          resource: 'course-enrollments',
          action: 'read',
          description: 'View own enrollments',
        },

        // Notifications - Own Only
        {
          resource: 'notifications',
          action: 'read',
          description: 'View own notifications',
        },
        {
          resource: 'notifications',
          action: 'update',
          description: 'Mark notifications as read',
        },

        // Content - Public View
        { resource: 'faqs', action: 'read', description: 'View FAQs' },
        { resource: 'cms', action: 'read', description: 'View public content' },
      ],
    },
    {
      role: RoleEnum.OPERATOR,
      permissions: [
        // Profile - Own
        {
          resource: 'profiles',
          action: 'read',
          description: 'View own profile',
        },
        {
          resource: 'profiles',
          action: 'update',
          description: 'Update own profile',
        },

        // Service Requests - Assigned Only
        {
          resource: 'service-requests',
          action: 'read',
          description: 'View assigned requests',
        },
        {
          resource: 'service-requests',
          action: 'update',
          description: 'Update assigned requests',
        },
        {
          resource: 'service-requests',
          action: 'list',
          description: 'List assigned requests',
        },
        {
          resource: 'service-requests',
          action: 'status-change',
          description: 'Update request status',
        },
        {
          resource: 'service-requests',
          action: 'add-note',
          description: 'Add internal notes',
        },

        // Service Types - View
        {
          resource: 'service-types',
          action: 'read',
          description: 'View service types',
        },
        {
          resource: 'service-types',
          action: 'list',
          description: 'List service types',
        },

        // Documents - Assigned Requests
        {
          resource: 'documents',
          action: 'read',
          description: 'View documents of assigned requests',
        },
        {
          resource: 'documents',
          action: 'download',
          description: 'Download documents',
        },
        {
          resource: 'documents',
          action: 'approve',
          description: 'Approve documents',
        },
        {
          resource: 'documents',
          action: 'reject',
          description: 'Reject documents',
        },
        {
          resource: 'documents',
          action: 'request-reupload',
          description: 'Request document re-upload',
        },

        // Appointments - Assigned
        {
          resource: 'appointments',
          action: 'read',
          description: 'View assigned appointments',
        },
        {
          resource: 'appointments',
          action: 'update',
          description: 'Update assigned appointments',
        },
        {
          resource: 'appointments',
          action: 'list',
          description: 'List assigned appointments',
        },
        {
          resource: 'appointments',
          action: 'complete',
          description: 'Mark appointments complete',
        },

        // Appointment Slots - View        { resource: 'users', action: 'list', description: 'List customers' },

        // Invoices - View Only
        { resource: 'invoices', action: 'read', description: 'View invoices' },
        {
          resource: 'appointment-slots',
          action: 'read',
          description: 'View appointment slots',
        },

        // Customers - Limited View
        {
          resource: 'users',
          action: 'read',
          description: 'View customer details',
        },

        // Notifications - Own
        {
          resource: 'notifications',
          action: 'read',
          description: 'View own notifications',
        },
        {
          resource: 'notifications',
          action: 'update',
          description: 'Mark as read',
        },

        // Content - View
        { resource: 'faqs', action: 'read', description: 'View FAQs' },
        { resource: 'cms', action: 'read', description: 'View content' },
      ],
    },
    {
      role: RoleEnum.FINANCE,
      permissions: [
        // Profile - Own
        {
          resource: 'profiles',
          action: 'read',
          description: 'View own profile',
        },
        {
          resource: 'profiles',
          action: 'update',
          description: 'Update own profile',
        },

        // Payments - Full Access
        {
          resource: 'payments',
          action: 'read',
          description: 'View all payments',
        },
        {
          resource: 'payments',
          action: 'list',
          description: 'List all payments',
        },
        {
          resource: 'payments',
          action: 'refund',
          description: 'Process refunds',
        },
        {
          resource: 'payments',
          action: 'export',
          description: 'Export payment data',
        },

        // Subscriptions - View & Manage
        {
          resource: 'subscriptions',
          action: 'read',
          description: 'View all subscriptions',
        },
        {
          resource: 'subscriptions',
          action: 'list',
          description: 'List all subscriptions',
        },
        {
          resource: 'subscriptions',
          action: 'update',
          description: 'Update subscriptions',
        },
        {
          resource: 'subscriptions',
          action: 'cancel',
          description: 'Cancel subscriptions',
        },

        // Subscription Plans - View
        {
          resource: 'subscription-plans',
          action: 'read',
          description: 'View plans',
        },
        {
          resource: 'subscription-plans',
          action: 'list',
          description: 'List plans',
        },

        // Invoices - Full Access
        {
          resource: 'invoices',
          action: 'read',
          description: 'View all invoices',
        },
        {
          resource: 'invoices',
          action: 'list',
          description: 'List all invoices',
        },
        {
          resource: 'invoices',
          action: 'create',
          description: 'Create invoices',
        },
        {
          resource: 'invoices',
          action: 'update',
          description: 'Update invoices',
        },
        {
          resource: 'invoices',
          action: 'download',
          description: 'Download invoices',
        },

        // Users - Limited View
        {
          resource: 'users',
          action: 'read',
          description: 'View user billing info',
        },
        { resource: 'users', action: 'list', description: 'List users' },

        // Reports - Financial
        {
          resource: 'reports',
          action: 'read',
          description: 'View financial reports',
        },
        {
          resource: 'reports',
          action: 'generate',
          description: 'Generate reports',
        },
        {
          resource: 'reports',
          action: 'export',
          description: 'Export reports',
        },

        // Notifications - Own
        {
          resource: 'notifications',
          action: 'read',
          description: 'View own notifications',
        },
        {
          resource: 'notifications',
          action: 'update',
          description: 'Mark as read',
        },
      ],
    },
  ];

  // Track statistics
  let totalPermissionsCreated = 0;
  let totalAssignments = 0;

  // Process each role
  for (const mapping of rolePermissionMappings) {
    const role = await roleRepository.findOne({
      where: { name: mapping.role },
    });

    if (!role) {
      console.log(`⚠️  Role '${mapping.role}' not found. Skipping...`);
      continue;
    }

    console.log(`\n📋 Processing role: ${mapping.role.toUpperCase()}`);
    console.log(`   Permissions to assign: ${mapping.permissions.length}`);

    let roleAssignments = 0;

    for (const permDef of mapping.permissions) {
      // Create unique permission name
      const permissionName = `${permDef.resource}:${permDef.action}`;

      // Check if permission already exists
      let permission = await permissionRepository.findOne({
        where: { name: permissionName },
      });

      if (!permission) {
        // Create new permission
        permission = permissionRepository.create({
          name: permissionName,
          resource: permDef.resource,
          action: permDef.action,
          description: permDef.description,
        });
        await permissionRepository.save(permission);
        totalPermissionsCreated++;
      }

      // Create role-permission relationship in join table
      const existingRolePermission = await rolePermissionRepository.findOne({
        where: {
          roleId: role.id,
          permissionId: permission.id,
        },
      });

      if (!existingRolePermission) {
        const rolePermission = rolePermissionRepository.create({
          roleId: role.id,
          permissionId: permission.id,
        });
        await rolePermissionRepository.save(rolePermission);
      }

      roleAssignments++;
    }

    // Store permissions as JSON in role (for backward compatibility)
    const permissionsJson = mapping.permissions.map((p) => ({
      resource: p.resource,
      actions: [p.action], // Wrap in array to match expected structure
      description: p.description,
    }));

    role.permissions = JSON.stringify(permissionsJson);
    await roleRepository.save(role);

    totalAssignments += roleAssignments;
    console.log(
      `   ✅ Assigned ${roleAssignments} permissions to ${mapping.role}`,
    );
  }

  console.log('\n' + '='.repeat(60));
  console.log('🎉 Role-Permission Seeding Completed!');
  console.log('='.repeat(60));
  console.log(`📊 Total permissions created: ${totalPermissionsCreated}`);
  console.log(`🔗 Total permission assignments: ${totalAssignments}`);
  console.log(`👥 Roles configured: ${rolePermissionMappings.length}`);
  console.log('='.repeat(60) + '\n');
}

// Run if called directly
if (require.main === module) {
  import('../src/config/data-source').then(async ({ AppDataSource }) => {
    try {
      await AppDataSource.initialize();
      await seedRolePermissions(AppDataSource);
      await AppDataSource.destroy();
      console.log('✅ Process completed successfully');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during seeding:', error);
      process.exit(1);
    }
  });
}
