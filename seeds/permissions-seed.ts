import { DataSource } from 'typeorm';
import { Role } from '../src/modules/roles/entities/role.entity';
import { RoleEnum } from '../src/modules/roles/role.enum';

interface Permission {
  resource: string;
  actions: string[];
  description: string;
}

interface RolePermissions {
  role: RoleEnum;
  permissions: Permission[];
}

export async function seedPermissions(dataSource: DataSource) {
  const roleRepository = dataSource.getRepository(Role);

  // Define comprehensive permissions based on milestone requirements
  const rolePermissions: RolePermissions[] = [
    {
      role: RoleEnum.ADMIN,
      permissions: [
        // User Management
        {
          resource: 'users',
          actions: ['create', 'read', 'update', 'delete', 'list'],
          description: 'Full user management',
        },
        {
          resource: 'profiles',
          actions: ['read', 'update', 'delete'],
          description: 'Manage user profiles',
        },

        // Service Requests Management
        {
          resource: 'service-requests',
          actions: [
            'create',
            'read',
            'update',
            'delete',
            'list',
            'assign',
            'status-change',
          ],
          description: 'Full service request management',
        },
        {
          resource: 'isee-requests',
          actions: ['create', 'read', 'update', 'delete', 'list', 'process'],
          description: 'ISEE service management',
        },
        {
          resource: '730-requests',
          actions: ['create', 'read', 'update', 'delete', 'list', 'process'],
          description: 'Modello 730/PF management',
        },
        {
          resource: 'imu-requests',
          actions: ['create', 'read', 'update', 'delete', 'list', 'process'],
          description: 'IMU service management',
        },

        // Document Management
        {
          resource: 'documents',
          actions: [
            'create',
            'read',
            'update',
            'delete',
            'approve',
            'reject',
            'download',
          ],
          description: 'Full document management',
        },
        {
          resource: 'document-verification',
          actions: ['approve', 'reject', 'request-reupload'],
          description: 'Document verification workflow',
        },

        // Appointments Management
        {
          resource: 'appointments',
          actions: [
            'create',
            'read',
            'update',
            'delete',
            'list',
            'assign',
            'reschedule',
          ],
          description: 'Full appointment management',
        },
        {
          resource: 'appointment-slots',
          actions: ['create', 'read', 'update', 'delete', 'manage'],
          description: 'Appointment slot management',
        },

        // Courses Management
        {
          resource: 'courses',
          actions: ['create', 'read', 'update', 'delete', 'list'],
          description: 'Course management',
        },
        {
          resource: 'course-enrollments',
          actions: ['read', 'update', 'delete', 'list'],
          description: 'Enrollment management',
        },

        // Payments & Subscriptions
        {
          resource: 'subscriptions',
          actions: ['read', 'update', 'delete', 'list', 'override'],
          description: 'Subscription management',
        },
        {
          resource: 'payments',
          actions: ['read', 'list', 'refund'],
          description: 'Payment management',
        },
        {
          resource: 'billing',
          actions: ['read', 'list', 'generate-invoice'],
          description: 'Billing operations',
        },

        // CMS & Content
        {
          resource: 'cms',
          actions: ['create', 'read', 'update', 'delete'],
          description: 'Content management',
        },
        {
          resource: 'faqs',
          actions: ['create', 'read', 'update', 'delete'],
          description: 'FAQ management',
        },
        {
          resource: 'news',
          actions: ['create', 'read', 'update', 'delete'],
          description: 'News management',
        },

        // Notifications
        {
          resource: 'notifications',
          actions: ['create', 'read', 'send', 'list'],
          description: 'Notification management',
        },

        // Reports & Analytics
        {
          resource: 'reports',
          actions: ['read', 'generate', 'export'],
          description: 'Reporting and analytics',
        },
        {
          resource: 'analytics',
          actions: ['read', 'dashboard'],
          description: 'Analytics dashboard',
        },

        // Audit & Logs
        {
          resource: 'audit-logs',
          actions: ['read', 'list'],
          description: 'Audit log access',
        },

        // System Administration
        {
          resource: 'roles',
          actions: ['create', 'read', 'update', 'delete'],
          description: 'Role management',
        },
        {
          resource: 'permissions',
          actions: ['read', 'assign'],
          description: 'Permission management',
        },
        {
          resource: 'system-settings',
          actions: ['read', 'update'],
          description: 'System configuration',
        },
      ],
    },
    {
      role: RoleEnum.CUSTOMER,
      permissions: [
        // Profile Management
        {
          resource: 'profiles',
          actions: ['read', 'update'],
          description: 'Own profile management',
        },
        {
          resource: 'family-members',
          actions: ['create', 'read', 'update', 'delete'],
          description: 'Family member management',
        },

        // Service Requests (Own Only)
        {
          resource: 'service-requests',
          actions: ['create', 'read', 'update', 'submit', 'cancel'],
          description: 'Own service requests',
        },
        {
          resource: 'isee-requests',
          actions: ['create', 'read', 'update', 'submit'],
          description: 'Own ISEE requests',
        },
        {
          resource: '730-requests',
          actions: ['create', 'read', 'update', 'submit'],
          description: 'Own 730/PF requests',
        },
        {
          resource: 'imu-requests',
          actions: ['create', 'read', 'update', 'submit'],
          description: 'Own IMU requests',
        },

        // Document Management (Own Only)
        {
          resource: 'documents',
          actions: ['create', 'read', 'update', 'delete'],
          description: 'Own document management',
        },
        {
          resource: 'document-upload',
          actions: ['create', 'replace'],
          description: 'Document upload capabilities',
        },

        // Appointments (Own Only)
        {
          resource: 'appointments',
          actions: ['create', 'read', 'update', 'cancel', 'reschedule'],
          description: 'Own appointment management',
        },
        {
          resource: 'appointment-booking',
          actions: ['create', 'reschedule'],
          description: 'Appointment booking',
        },
        {
          resource: 'available-slots',
          actions: ['read'],
          description: 'View available appointment slots',
        },

        // Courses
        {
          resource: 'courses',
          actions: ['read', 'list'],
          description: 'View available courses',
        },
        {
          resource: 'course-enrollments',
          actions: ['create', 'read'],
          description: 'Course enrollment',
        },

        // Subscriptions & Payments (Own Only)
        {
          resource: 'subscriptions',
          actions: ['read', 'update', 'cancel'],
          description: 'Own subscription management',
        },
        {
          resource: 'subscription-plans',
          actions: ['read', 'list'],
          description: 'View subscription plans',
        },
        {
          resource: 'payments',
          actions: ['create', 'read'],
          description: 'Own payment management',
        },
        {
          resource: 'payment-history',
          actions: ['read'],
          description: 'View payment history',
        },

        // Notifications (Own Only)
        {
          resource: 'notifications',
          actions: ['read', 'mark-read'],
          description: 'Own notifications',
        },

        // Content Access
        { resource: 'faqs', actions: ['read'], description: 'View FAQs' },
        { resource: 'news', actions: ['read'], description: 'View news' },

        // GDPR & Privacy
        {
          resource: 'gdpr-consent',
          actions: ['create', 'read', 'update'],
          description: 'GDPR consent management',
        },
        {
          resource: 'privacy-settings',
          actions: ['read', 'update'],
          description: 'Privacy settings',
        },
      ],
    },
  ];

  // Update roles with permissions (stored as JSON for now)
  for (const rolePermission of rolePermissions) {
    const role = await roleRepository.findOne({
      where: { name: rolePermission.role },
    });

    if (role) {
      try {
        // Store permissions as JSON metadata (can be expanded to separate Permission entity later)
        role.permissions = JSON.stringify(rolePermission.permissions);
        await roleRepository.save(role);
        console.log(
          `✅ Updated permissions for role: ${rolePermission.role} (${rolePermission.permissions.length} permissions)`,
        );
      } catch (error) {
        console.log(
          `⚠️  Permissions column not found for role ${rolePermission.role}. Run migration first: npm run migration:run`,
        );
      }
    } else {
      console.log(
        `⚠️  Role ${rolePermission.role} not found, skipping permissions assignment`,
      );
    }
  }

  console.log('🔐 Permissions seeding completed successfully');
}

// Run if called directly
if (require.main === module) {
  import('../src/config/data-source').then(async ({ AppDataSource }) => {
    await AppDataSource.initialize();
    await seedPermissions(AppDataSource);
    await AppDataSource.destroy();
    console.log('Permissions seeding completed');
  });
}
