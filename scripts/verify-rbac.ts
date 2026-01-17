import { AppDataSource } from '../src/config/data-source';

async function verifyPermissions() {
  await AppDataSource.initialize();

  try {
    console.log('\n🔍 Verifying RBAC Implementation...\n');

    // Check roles
    const roles = await AppDataSource.query(`
      SELECT name, description, 
             CASE 
               WHEN permissions IS NULL THEN 0
               ELSE json_array_length(permissions::json)
             END as permission_count
      FROM roles 
      ORDER BY name
    `);

    console.log('📋 Roles in System:');
    console.log('='.repeat(60));
    roles.forEach((role: any) => {
      console.log(`   ${role.name.toUpperCase()}`);
      console.log(`   - Description: ${role.description}`);
      console.log(`   - Permissions: ${role.permission_count}`);
      console.log('');
    });

    // Check permissions table
    const permissionCount = await AppDataSource.query(`
      SELECT COUNT(*) as total FROM permissions
    `);

    console.log('\n📊 Permission Statistics:');
    console.log('='.repeat(60));
    console.log(`   Total Permissions: ${permissionCount[0].total}`);

    // Check permissions by resource
    const byResource = await AppDataSource.query(`
      SELECT resource, COUNT(*) as count
      FROM permissions
      GROUP BY resource
      ORDER BY count DESC
      LIMIT 10
    `);

    console.log('\n🔝 Top Resources by Permission Count:');
    console.log('='.repeat(60));
    byResource.forEach((item: any, index: number) => {
      console.log(`   ${index + 1}. ${item.resource}: ${item.count} permissions`);
    });

    // Sample permissions
    const samplePermissions = await AppDataSource.query(`
      SELECT name, resource, action, description
      FROM permissions
      ORDER BY resource, action
      LIMIT 20
    `);

    console.log('\n📝 Sample Permissions (first 20):');
    console.log('='.repeat(60));
    samplePermissions.forEach((perm: any) => {
      console.log(`   ${perm.name}`);
      console.log(`      Resource: ${perm.resource}, Action: ${perm.action}`);
    });

    console.log('\n' + '='.repeat(60));
    console.log('✅ RBAC Verification Complete!');
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

verifyPermissions();
