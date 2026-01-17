import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1767510562799 implements MigrationInterface {
  name = 'Migration1767510562799';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_profiles" DROP CONSTRAINT "FK_user_profiles_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "family_members" DROP CONSTRAINT "FK_family_members_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" DROP CONSTRAINT "FK_3ddc983c5f7bcf132fd8732c3f4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_permissions" DROP CONSTRAINT "FK_8145f5fadacd311693c15e41f10"`,
    );
    await queryRunner.query(
      `ALTER TABLE "documents" DROP CONSTRAINT "FK_5094ed28e14387543ae8fb61a6a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "request_status_history" DROP CONSTRAINT "FK_6fafd4a5c36658baf5ccf4d9555"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" DROP CONSTRAINT "FK_9a8a82462cab47c73d25f49261f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "course_enrollments" DROP CONSTRAINT "FK_ac52967707330a4fedfc361f72e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_logs" DROP CONSTRAINT "FK_bd2726fd31b35443f2245b93ba0"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_user_profiles_user_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_family_members_user_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_refresh_tokens_user_id"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_refresh_tokens_expires_at"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_payments_subscription_id"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_payments_status"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_payments_user_id"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_user_subscriptions_user_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_user_subscriptions_status"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_user_subscriptions_end_date"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_documents_service_request_id"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_documents_status"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_service_requests_user_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_service_requests_status"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_service_requests_service_type_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_service_requests_assigned_operator"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_service_requests_submitted_at"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_appointments_user_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_appointments_date"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_appointments_operator_id"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_appointments_status"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_notifications_user_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_notifications_is_read"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_notifications_created_at"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_course_enrollments_user_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_course_enrollments_status"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_audit_logs_user_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_audit_logs_resource"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_audit_logs_created_at"`);
    await queryRunner.query(
      `CREATE TABLE "blacklisted_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "token" text NOT NULL, "expires_at" TIMESTAMP NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_8fb1bc7333c3b9f249f9feaa55d" PRIMARY KEY ("id"))`,
    );
    // Skip preferred_language and preferred_communication - removed from user_profiles
    await queryRunner.query(
      `ALTER TABLE "family_members" DROP COLUMN "full_name"`,
    );
    await queryRunner.query(
      `ALTER TABLE "family_members" ADD "full_name" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "family_members" DROP CONSTRAINT "UQ_family_members_fiscal_code"`,
    );
    await queryRunner.query(
      `ALTER TABLE "family_members" DROP COLUMN "fiscal_code"`,
    );
    await queryRunner.query(
      `ALTER TABLE "family_members" ADD "fiscal_code" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "family_members" ADD CONSTRAINT "UQ_d5b8282539c64e67e870db19fce" UNIQUE ("fiscal_code")`,
    );
    await queryRunner.query(
      `ALTER TABLE "family_members" DROP COLUMN "relationship"`,
    );
    await queryRunner.query(
      `ALTER TABLE "family_members" ADD "relationship" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "family_members" DROP COLUMN "disability_type"`,
    );
    await queryRunner.query(
      `ALTER TABLE "family_members" ADD "disability_type" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_permissions" DROP COLUMN "permission_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_permissions" ADD "permission_id" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_logs" DROP COLUMN "resource_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_logs" ADD "resource_id" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_profiles" ADD CONSTRAINT "FK_6ca9503d77ae39b4b5a6cc3ba88" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "family_members" ADD CONSTRAINT "FK_081fe336d41be74c68b81e8b6d7" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" ADD CONSTRAINT "FK_3ddc983c5f7bcf132fd8732c3f4" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "documents" ADD CONSTRAINT "FK_5094ed28e14387543ae8fb61a6a" FOREIGN KEY ("service_request_id") REFERENCES "service_requests"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "request_status_history" ADD CONSTRAINT "FK_6fafd4a5c36658baf5ccf4d9555" FOREIGN KEY ("service_request_id") REFERENCES "service_requests"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" ADD CONSTRAINT "FK_9a8a82462cab47c73d25f49261f" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "course_enrollments" ADD CONSTRAINT "FK_ac52967707330a4fedfc361f72e" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_logs" ADD CONSTRAINT "FK_bd2726fd31b35443f2245b93ba0" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "audit_logs" DROP CONSTRAINT "FK_bd2726fd31b35443f2245b93ba0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "course_enrollments" DROP CONSTRAINT "FK_ac52967707330a4fedfc361f72e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" DROP CONSTRAINT "FK_9a8a82462cab47c73d25f49261f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "request_status_history" DROP CONSTRAINT "FK_6fafd4a5c36658baf5ccf4d9555"`,
    );
    await queryRunner.query(
      `ALTER TABLE "documents" DROP CONSTRAINT "FK_5094ed28e14387543ae8fb61a6a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" DROP CONSTRAINT "FK_3ddc983c5f7bcf132fd8732c3f4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "family_members" DROP CONSTRAINT "FK_081fe336d41be74c68b81e8b6d7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_profiles" DROP CONSTRAINT "FK_6ca9503d77ae39b4b5a6cc3ba88"`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_logs" DROP COLUMN "resource_id"`,
    );
    await queryRunner.query(`ALTER TABLE "audit_logs" ADD "resource_id" uuid`);
    await queryRunner.query(
      `ALTER TABLE "user_permissions" DROP COLUMN "permission_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_permissions" ADD "permission_id" uuid NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "family_members" DROP COLUMN "disability_type"`,
    );
    await queryRunner.query(
      `ALTER TABLE "family_members" ADD "disability_type" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "family_members" DROP COLUMN "relationship"`,
    );
    await queryRunner.query(
      `ALTER TABLE "family_members" ADD "relationship" character varying(50) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "family_members" DROP CONSTRAINT "UQ_d5b8282539c64e67e870db19fce"`,
    );
    await queryRunner.query(
      `ALTER TABLE "family_members" DROP COLUMN "fiscal_code"`,
    );
    await queryRunner.query(
      `ALTER TABLE "family_members" ADD "fiscal_code" character varying(16) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "family_members" ADD CONSTRAINT "UQ_family_members_fiscal_code" UNIQUE ("fiscal_code")`,
    );
    await queryRunner.query(
      `ALTER TABLE "family_members" DROP COLUMN "full_name"`,
    );
    await queryRunner.query(
      `ALTER TABLE "family_members" ADD "full_name" character varying(255) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_profiles" ALTER COLUMN "preferred_communication" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_profiles" ALTER COLUMN "preferred_language" DROP NOT NULL`,
    );
    await queryRunner.query(`DROP TABLE "blacklisted_tokens"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_audit_logs_created_at" ON "audit_logs" ("created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_audit_logs_resource" ON "audit_logs" ("resource_id", "resource_type") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_audit_logs_user_id" ON "audit_logs" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_course_enrollments_status" ON "course_enrollments" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_course_enrollments_user_id" ON "course_enrollments" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_notifications_created_at" ON "notifications" ("created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_notifications_is_read" ON "notifications" ("is_read") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_notifications_user_id" ON "notifications" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_appointments_status" ON "appointments" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_appointments_operator_id" ON "appointments" ("operator_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_appointments_date" ON "appointments" ("appointment_date") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_appointments_user_id" ON "appointments" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_service_requests_submitted_at" ON "service_requests" ("submitted_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_service_requests_assigned_operator" ON "service_requests" ("assigned_operator_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_service_requests_service_type_id" ON "service_requests" ("service_type_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_service_requests_status" ON "service_requests" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_service_requests_user_id" ON "service_requests" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_documents_status" ON "documents" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_documents_service_request_id" ON "documents" ("service_request_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_user_subscriptions_end_date" ON "user_subscriptions" ("end_date") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_user_subscriptions_status" ON "user_subscriptions" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_user_subscriptions_user_id" ON "user_subscriptions" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_payments_user_id" ON "payments" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_payments_status" ON "payments" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_payments_subscription_id" ON "payments" ("subscription_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_refresh_tokens_expires_at" ON "refresh_tokens" ("expires_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_refresh_tokens_user_id" ON "refresh_tokens" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_family_members_user_id" ON "family_members" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_user_profiles_user_id" ON "user_profiles" ("user_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_logs" ADD CONSTRAINT "FK_bd2726fd31b35443f2245b93ba0" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "course_enrollments" ADD CONSTRAINT "FK_ac52967707330a4fedfc361f72e" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" ADD CONSTRAINT "FK_9a8a82462cab47c73d25f49261f" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "request_status_history" ADD CONSTRAINT "FK_6fafd4a5c36658baf5ccf4d9555" FOREIGN KEY ("service_request_id") REFERENCES "service_requests"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "documents" ADD CONSTRAINT "FK_5094ed28e14387543ae8fb61a6a" FOREIGN KEY ("service_request_id") REFERENCES "service_requests"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_permissions" ADD CONSTRAINT "FK_8145f5fadacd311693c15e41f10" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" ADD CONSTRAINT "FK_3ddc983c5f7bcf132fd8732c3f4" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "family_members" ADD CONSTRAINT "FK_family_members_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_profiles" ADD CONSTRAINT "FK_user_profiles_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
