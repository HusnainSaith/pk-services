import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddPermissionsToRole1767510562800 implements MigrationInterface {
  name = 'AddPermissionsToRole1767510562800';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'roles',
      new TableColumn({
        name: 'permissions',
        type: 'text',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('roles', 'permissions');
  }
}
