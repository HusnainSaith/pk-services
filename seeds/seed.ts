import 'reflect-metadata';
import { AppDataSource } from '../src/config/data-source';
import { Role } from '../src/modules/roles/entities/role.entity';
import { User } from '../src/modules/users/entities/user.entity';
import * as bcrypt from 'bcryptjs';
import { RoleEnum } from '../src/modules/roles/role.enum';

// Import the seeding functions
import { seedPermissions } from './permissions-seed';
import { seedServiceTypes } from './service-types-seed';
import { seedRolePermissions } from './role-permission-seed';

async function seed() {
  await AppDataSource.initialize(); // Initialize connection once

  try {
    const roleRepo = AppDataSource.getRepository(Role);
    const userRepo = AppDataSource.getRepository(User);

    // Clean up existing data
    console.log('🧹 Cleaning up database...');
    await userRepo.query('TRUNCATE TABLE users CASCADE;');
    await roleRepo.query('TRUNCATE TABLE roles CASCADE;');

    // Seed roles...
    const rolesToSeed = [
      {
        name: RoleEnum.ADMIN,
        description: 'Administrator with full system access',
      },
      {
        name: RoleEnum.CUSTOMER,
        description: 'End user/Customer of the platform',
      },
      {
        name: RoleEnum.OPERATOR,
        description: 'CAF Consultant/Operator handling requests',
      },
      {
        name: RoleEnum.FINANCE,
        description: 'Finance manager handling payments and subscriptions',
      },
    ];
    for (const roleData of rolesToSeed) {
      let role = await roleRepo.findOne({ where: { name: roleData.name } });
      if (!role) {
        role = roleRepo.create(roleData);
        await roleRepo.save(role);
        console.log(`Role "${roleData.name}" created.`);
      } else {
        console.log(`Role "${roleData.name}" already exists.`);
      }
    }

    // Seed admin user...
    const adminEmail = 'admin@pkservizi.com';
    let adminUser = await userRepo.findOne({ where: { email: adminEmail } });
    if (!adminUser) {
      const adminRole = await roleRepo.findOne({
        where: { name: RoleEnum.ADMIN },
      });
      const password = await bcrypt.hash('Admin@123', 10);
      adminUser = userRepo.create({
        email: adminEmail,
        password,
        fullName: 'Super Admin',
        roleId: adminRole.id,
      });
      await userRepo.save(adminUser);
      console.log(
        `Admin user "${adminEmail}" created with password: Admin@123`,
      );
    } else {
      console.log(`Admin user "${adminEmail}" already exists.`);
    }

    // Now, run the role-permission seed (comprehensive RBAC setup)
    await seedRolePermissions(AppDataSource);

    // Run service types seed
    await seedServiceTypes();

    console.log('✅ All seeding tasks completed successfully!');
  } catch (e) {
    console.error('Seeding error:', e);
    process.exit(1);
  } finally {
    await AppDataSource.destroy(); // Close the connection at the very end
    console.log('🆑 Database connection closed.');
  }

  process.exit(0);
}

seed();
