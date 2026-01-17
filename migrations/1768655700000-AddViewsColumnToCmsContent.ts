import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddViewsColumnToCmsContent1768655700000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add views column to cms_content table
    await queryRunner.query(`
      ALTER TABLE "cms_content" 
      ADD COLUMN IF NOT EXISTS "views" integer NOT NULL DEFAULT 0
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove views column from cms_content table
    await queryRunner.query(`
      ALTER TABLE "cms_content" 
      DROP COLUMN IF EXISTS "views"
    `);
  }
}
