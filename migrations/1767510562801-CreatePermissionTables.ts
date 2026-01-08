import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreatePermissionTables1767510562801 implements MigrationInterface {
  name = 'CreatePermissionTables1767510562801';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if permissions table already exists
    const permissionsTableExists = await queryRunner.hasTable('permissions');
    
    if (!permissionsTableExists) {
      // Create permissions table
      await queryRunner.createTable(
        new Table({
          name: 'permissions',
          columns: [
            {
              name: 'id',
              type: 'uuid',
              isPrimary: true,
              generationStrategy: 'uuid',
              default: 'gen_random_uuid()',
            },
            {
              name: 'name',
              type: 'varchar',
              isUnique: true,
            },
            {
              name: 'resource',
              type: 'varchar',
              isNullable: true,
            },
            {
              name: 'action',
              type: 'varchar',
              isNullable: true,
            },
            {
              name: 'description',
              type: 'varchar',
              isNullable: true,
            },
            {
              name: 'created_at',
              type: 'timestamp',
              default: 'CURRENT_TIMESTAMP',
            },
            {
              name: 'updated_at',
              type: 'timestamp',
              default: 'CURRENT_TIMESTAMP',
            },
          ],
        }),
      );
    }

    // Check if role_permissions table already exists
    const rolePermissionsTableExists = await queryRunner.hasTable('role_permissions');
    
    if (!rolePermissionsTableExists) {
      // Create role_permissions table
      await queryRunner.createTable(
        new Table({
          name: 'role_permissions',
          columns: [
            {
              name: 'id',
              type: 'uuid',
              isPrimary: true,
              generationStrategy: 'uuid',
              default: 'gen_random_uuid()',
            },
            {
              name: 'role_id',
              type: 'uuid',
            },
            {
              name: 'permission_id',
              type: 'uuid',
            },
            {
              name: 'created_at',
              type: 'timestamp',
              default: 'CURRENT_TIMESTAMP',
            },
          ],
          foreignKeys: [
            {
              columnNames: ['role_id'],
              referencedTableName: 'roles',
              referencedColumnNames: ['id'],
              onDelete: 'CASCADE',
            },
            {
              columnNames: ['permission_id'],
              referencedTableName: 'permissions',
              referencedColumnNames: ['id'],
              onDelete: 'CASCADE',
            },
          ],
        }),
      );

      // Create indexes
      await queryRunner.createIndex(
        'role_permissions',
        new TableIndex({
          name: 'IDX_role_permissions_role_id',
          columnNames: ['role_id'],
        }),
      );
      await queryRunner.createIndex(
        'role_permissions',
        new TableIndex({
          name: 'IDX_role_permissions_permission_id',
          columnNames: ['permission_id'],
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('role_permissions');
    await queryRunner.dropTable('permissions');
  }
}