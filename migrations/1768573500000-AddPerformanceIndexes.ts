import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPerformanceIndexes1768573500000 implements MigrationInterface {
  name = 'AddPerformanceIndexes1768573500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Users table indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_users_email" ON "users" ("email");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_users_role_id" ON "users" ("role_id");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_users_is_active" ON "users" ("is_active");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_users_created_at" ON "users" ("created_at");
    `);

    // Service requests indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_service_requests_user_id" ON "service_requests" ("user_id");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_service_requests_status" ON "service_requests" ("status");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_service_requests_priority" ON "service_requests" ("priority");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_service_requests_created_at" ON "service_requests" ("created_at");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_service_requests_assigned_operator_id" ON "service_requests" ("assigned_operator_id");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_service_requests_service_type_id" ON "service_requests" ("service_type_id");
    `);

    // User subscriptions indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_user_subscriptions_user_id" ON "user_subscriptions" ("user_id");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_user_subscriptions_status" ON "user_subscriptions" ("status");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_user_subscriptions_plan_id" ON "user_subscriptions" ("plan_id");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_user_subscriptions_start_date" ON "user_subscriptions" ("start_date");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_user_subscriptions_end_date" ON "user_subscriptions" ("end_date");
    `);

    // Payments indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_payments_user_id" ON "payments" ("user_id");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_payments_status" ON "payments" ("status");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_payments_created_at" ON "payments" ("created_at");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_payments_stripe_payment_intent_id" ON "payments" ("stripe_payment_intent_id");
    `);

    // Appointments indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_appointments_user_id" ON "appointments" ("user_id");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_appointments_status" ON "appointments" ("status");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_appointments_appointment_date" ON "appointments" ("appointment_date");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_appointments_operator_id" ON "appointments" ("operator_id");
    `);

    // Documents indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_documents_service_request_id" ON "documents" ("service_request_id");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_documents_status" ON "documents" ("status");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_documents_category" ON "documents" ("category");
    `);

    // Notifications indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_notifications_user_id" ON "notifications" ("user_id");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_notifications_is_read" ON "notifications" ("is_read");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_notifications_created_at" ON "notifications" ("created_at");
    `);

    // Refresh tokens indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_refresh_tokens_user_id" ON "refresh_tokens" ("user_id");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_refresh_tokens_token" ON "refresh_tokens" ("token");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_refresh_tokens_is_revoked" ON "refresh_tokens" ("is_revoked");
    `);

    // Composite indexes for common queries
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_service_requests_user_status" 
      ON "service_requests" ("user_id", "status");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_user_subscriptions_user_status" 
      ON "user_subscriptions" ("user_id", "status");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_notifications_user_read" 
      ON "notifications" ("user_id", "is_read");
    `);

    console.log('✅ Performance indexes created successfully');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop all indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_email"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_role_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_is_active"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_created_at"`);
    
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_service_requests_user_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_service_requests_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_service_requests_priority"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_service_requests_created_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_service_requests_assigned_operator_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_service_requests_service_type_id"`);
    
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_user_subscriptions_user_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_user_subscriptions_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_user_subscriptions_plan_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_user_subscriptions_start_date"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_user_subscriptions_end_date"`);
    
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_payments_user_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_payments_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_payments_created_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_payments_stripe_payment_intent_id"`);
    
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_appointments_user_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_appointments_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_appointments_appointment_date"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_appointments_operator_id"`);
    
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_documents_service_request_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_documents_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_documents_category"`);
    
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_notifications_user_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_notifications_is_read"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_notifications_created_at"`);
    
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_refresh_tokens_user_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_refresh_tokens_token"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_refresh_tokens_is_revoked"`);
    
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_service_requests_user_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_user_subscriptions_user_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_notifications_user_read"`);

    console.log('✅ Performance indexes dropped successfully');
  }
}
