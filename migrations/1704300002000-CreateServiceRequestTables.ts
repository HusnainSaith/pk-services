import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateServiceRequestEntities1704300001000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ISEE Requests Table
    await queryRunner.createTable(
      new Table({
        name: 'isee_requests',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'service_request_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'family_members',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'residence_address',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'municipality',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'postal_code',
            type: 'varchar',
            length: '10',
            isNullable: true,
          },
          {
            name: 'property_type',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'income_year_1',
            type: 'decimal',
            precision: 15,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'income_year_2',
            type: 'decimal',
            precision: 15,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'income_sources',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'bank_accounts',
            type: 'decimal',
            precision: 15,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'investments',
            type: 'decimal',
            precision: 15,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'other_movable_assets',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'vehicles',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'has_disability',
            type: 'boolean',
            isNullable: true,
          },
          {
            name: 'disability_type',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'disability_percentage',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'university_students',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'minors',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'documents_checklist',
            type: 'jsonb',
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
        foreignKeys: [
          {
            columnNames: ['service_request_id'],
            referencedTableName: 'service_requests',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    // Modello 730 Requests Table
    await queryRunner.createTable(
      new Table({
        name: 'modello_730_requests',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'service_request_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'first_name',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'last_name',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'fiscal_code',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'birth_date',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'birth_place',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'cu_data',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'inps_income',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'other_income',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'properties',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'medical_expenses',
            type: 'decimal',
            precision: 15,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'medical_details',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'education_expenses',
            type: 'decimal',
            precision: 15,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'education_details',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'mortgages',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'home_bonus',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'dependents',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'family_members_count',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'life_insurance',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'pension_contributions',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'documents_checklist',
            type: 'jsonb',
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
        foreignKeys: [
          {
            columnNames: ['service_request_id'],
            referencedTableName: 'service_requests',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    // IMU Requests Table
    await queryRunner.createTable(
      new Table({
        name: 'imu_requests',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'service_request_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'first_name',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'last_name',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'fiscal_code',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'taxpayer_type',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'address',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'municipality',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'postal_code',
            type: 'varchar',
            length: '10',
            isNullable: true,
          },
          {
            name: 'properties',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'property_usage',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'exemptions',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'variations',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'imu_payments',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'has_inheritance',
            type: 'boolean',
            isNullable: true,
          },
          {
            name: 'inheritance_data',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'tax_year',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'documents_checklist',
            type: 'jsonb',
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
        foreignKeys: [
          {
            columnNames: ['service_request_id'],
            referencedTableName: 'service_requests',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('imu_requests');
    await queryRunner.dropTable('modello_730_requests');
    await queryRunner.dropTable('isee_requests');
  }
}
