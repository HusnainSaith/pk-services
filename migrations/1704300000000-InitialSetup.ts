import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSetup1704300000000 implements MigrationInterface {
  name = 'InitialSetup1704300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable UUID extension
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // ========================================
    // CORE AUTHENTICATION & AUTHORIZATION
    // ========================================

    // Roles table
    await queryRunner.query(`
            CREATE TABLE "roles" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying NOT NULL,
                "description" character varying,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_648e3f5447f725579d7d4ffdfb7" UNIQUE ("name"),
                CONSTRAINT "PK_c1433d71a4838793a49dcad46ab" PRIMARY KEY ("id")
            )
        `);

    // Permissions table
    await queryRunner.query(`
            CREATE TABLE "permissions" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying NOT NULL,
                "description" character varying,
                "resource" character varying NOT NULL,
                "action" character varying NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_48ce552495d14eae9b187bb6716" UNIQUE ("name"),
                CONSTRAINT "PK_920331560282b8bd21bb02290df" PRIMARY KEY ("id")
            )
        `);

    // Role Permissions (junction table)
    await queryRunner.query(`
            CREATE TABLE "role_permissions" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "role_id" uuid NOT NULL,
                "permission_id" uuid NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_84059017c90bfcb701b8fa42297" PRIMARY KEY ("id")
            )
        `);

    // ========================================
    // USERS & PROFILES
    // ========================================

    // Users table (Core authentication fields only)
    await queryRunner.query(`
            CREATE TABLE "users" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "email" character varying NOT NULL,
                "password" character varying NOT NULL,
                "full_name" character varying NOT NULL,
                "phone" character varying(20),
                "is_active" boolean NOT NULL DEFAULT true,
                "role_id" uuid,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"),
                CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
            )
        `);

    // User Permissions (direct permissions to users)
    await queryRunner.query(`
            CREATE TABLE "user_permissions" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "user_id" uuid NOT NULL,
                "permission_id" uuid NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_01f4295968ba33d73926684264f" PRIMARY KEY ("id")
            )
        `);

    // User Profiles (Extended user information - Italian-focused)
    await queryRunner.query(`
            CREATE TABLE "user_profiles" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "user_id" uuid NOT NULL,
                "avatar_url" character varying(500),
                "bio" text,
                "fiscal_code" character varying(16),
                "address" text,
                "city" character varying(100),
                "postal_code" character varying(10),
                "province" character varying(2),
                "birth_date" date,
                "birth_place" character varying(100),
                "gdpr_consent" boolean NOT NULL DEFAULT false,
                "gdpr_consent_date" TIMESTAMP,
                "privacy_consent" boolean NOT NULL DEFAULT false,
                "privacy_consent_date" TIMESTAMP,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_user_profiles_user_id" UNIQUE ("user_id"),
                CONSTRAINT "PK_user_profiles" PRIMARY KEY ("id")
            )
        `);

    // Family Members table
    await queryRunner.query(`
            CREATE TABLE "family_members" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "user_id" uuid NOT NULL,
                "full_name" character varying(255) NOT NULL,
                "fiscal_code" character varying(16) NOT NULL,
                "relationship" character varying(50) NOT NULL,
                "birth_date" date NOT NULL,
                "is_dependent" boolean NOT NULL DEFAULT false,
                "disability" boolean NOT NULL DEFAULT false,
                "disability_type" character varying(255),
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_family_members_fiscal_code" UNIQUE ("fiscal_code"),
                CONSTRAINT "PK_family_members" PRIMARY KEY ("id")
            )
        `);

    // Refresh Tokens
    await queryRunner.query(`
            CREATE TABLE "refresh_tokens" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "token" character varying(500) NOT NULL,
                "user_id" uuid NOT NULL,
                "expires_at" TIMESTAMP NOT NULL,
                "is_revoked" boolean NOT NULL DEFAULT false,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_4542dd2f38a61354a040ba9fd57" UNIQUE ("token"),
                CONSTRAINT "PK_7d8bee0204106019488c4c50ffa" PRIMARY KEY ("id")
            )
        `);

    // ========================================
    // SUBSCRIPTION & PAYMENTS
    // ========================================

    // Subscription Plans
    await queryRunner.query(`
            CREATE TABLE "subscription_plans" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(100) NOT NULL,
                "description" text,
                "price_monthly" numeric(10,2),
                "price_annual" numeric(10,2),
                "features" jsonb,
                "service_limits" jsonb,
                "is_active" boolean NOT NULL DEFAULT true,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_9ab8fe6918451ab3d0a4fb6bb0c" PRIMARY KEY ("id")
            )
        `);

    // User Subscriptions
    await queryRunner.query(`
            CREATE TABLE "user_subscriptions" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "user_id" uuid NOT NULL,
                "plan_id" uuid NOT NULL,
                "status" character varying(20) NOT NULL DEFAULT 'active',
                "billing_cycle" character varying(10) NOT NULL DEFAULT 'monthly',
                "start_date" TIMESTAMP NOT NULL,
                "end_date" TIMESTAMP,
                "auto_renew" boolean NOT NULL DEFAULT true,
                "stripe_subscription_id" character varying(255),
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_9e928b0954e51705ab44988812c" PRIMARY KEY ("id")
            )
        `);

    // Payments
    await queryRunner.query(`
            CREATE TABLE "payments" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "user_id" uuid NOT NULL,
                "subscription_id" uuid,
                "amount" numeric(10,2) NOT NULL,
                "currency" character varying(3) NOT NULL DEFAULT 'EUR',
                "status" character varying(20) NOT NULL DEFAULT 'pending',
                "payment_method" character varying(50),
                "stripe_payment_intent_id" character varying(255),
                "stripe_charge_id" character varying(255),
                "description" text,
                "metadata" jsonb,
                "paid_at" TIMESTAMP,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_197ab7af18c93fbb0c9b28b4a59" PRIMARY KEY ("id")
            )
        `);

    // ========================================
    // SERVICE MANAGEMENT
    // ========================================

    // Service Types (ISEE, 730/PF, IMU)
    await queryRunner.query(`
            CREATE TABLE "service_types" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(100) NOT NULL,
                "code" character varying(20) NOT NULL,
                "description" text,
                "category" character varying(50),
                "base_price" numeric(10,2),
                "required_documents" jsonb,
                "form_schema" jsonb,
                "is_active" boolean NOT NULL DEFAULT true,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_46911ede58bb042f55a83c9349d" UNIQUE ("code"),
                CONSTRAINT "PK_1dc93417a097cdee3491f39d7cc" PRIMARY KEY ("id")
            )
        `);

    // Service Requests
    await queryRunner.query(`
            CREATE TABLE "service_requests" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "user_id" uuid NOT NULL,
                "service_type_id" uuid NOT NULL,
                "status" character varying(20) NOT NULL DEFAULT 'draft',
                "form_data" jsonb,
                "internal_notes" text,
                "user_notes" text,
                "assigned_operator_id" uuid,
                "priority" character varying(10) NOT NULL DEFAULT 'normal',
                "submitted_at" TIMESTAMP,
                "completed_at" TIMESTAMP,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_ee60bcd826b7e130bfbd97daf66" PRIMARY KEY ("id")
            )
        `);

    // Request Status History
    await queryRunner.query(`
            CREATE TABLE "request_status_history" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "service_request_id" uuid NOT NULL,
                "from_status" character varying(20),
                "to_status" character varying(20) NOT NULL,
                "changed_by_id" uuid NOT NULL,
                "notes" text,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_3b927b710932269a39be5054997" PRIMARY KEY ("id")
            )
        `);

    // Documents
    await queryRunner.query(`
            CREATE TABLE "documents" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "service_request_id" uuid NOT NULL,
                "category" character varying(100) NOT NULL,
                "filename" character varying(255) NOT NULL,
                "original_filename" character varying(255) NOT NULL,
                "file_path" character varying(500) NOT NULL,
                "file_size" integer NOT NULL,
                "mime_type" character varying(100) NOT NULL,
                "status" character varying(20) NOT NULL DEFAULT 'pending',
                "is_required" boolean NOT NULL DEFAULT false,
                "admin_notes" text,
                "version" integer NOT NULL DEFAULT '1',
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_ac51aa5181ee2036f5ca482857c" PRIMARY KEY ("id")
            )
        `);

    // ========================================
    // APPOINTMENTS
    // ========================================

    await queryRunner.query(`
            CREATE TABLE "appointments" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "user_id" uuid NOT NULL,
                "service_type_id" uuid,
                "operator_id" uuid,
                "title" character varying(255) NOT NULL,
                "description" text,
                "appointment_date" TIMESTAMP NOT NULL,
                "duration_minutes" integer NOT NULL DEFAULT '60',
                "status" character varying(20) NOT NULL DEFAULT 'scheduled',
                "location" character varying(255),
                "notes" text,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_4a437a9a27e948726b8bb3e36ad" PRIMARY KEY ("id")
            )
        `);

    // ========================================
    // COURSES & TRAINING
    // ========================================

    // Courses
    await queryRunner.query(`
            CREATE TABLE "courses" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "title" character varying(255) NOT NULL,
                "description" text,
                "content" text,
                "instructor_id" uuid,
                "max_participants" integer,
                "start_date" TIMESTAMP,
                "end_date" TIMESTAMP,
                "location" character varying(255),
                "price" numeric(10,2),
                "status" character varying(20) NOT NULL DEFAULT 'draft',
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_3f70a487cc718ad8eda4e6d58c9" PRIMARY KEY ("id")
            )
        `);

    // Course Enrollments
    await queryRunner.query(`
            CREATE TABLE "course_enrollments" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "course_id" uuid NOT NULL,
                "user_id" uuid NOT NULL,
                "enrollment_date" TIMESTAMP NOT NULL DEFAULT now(),
                "status" character varying(20) NOT NULL DEFAULT 'enrolled',
                "completion_date" TIMESTAMP,
                "certificate_issued" boolean NOT NULL DEFAULT false,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_1a912a74aa76087c9f9a0cdf97a" UNIQUE ("course_id", "user_id"),
                CONSTRAINT "PK_609f6e4f0fc9a6149a35211b380" PRIMARY KEY ("id")
            )
        `);

    // ========================================
    // NOTIFICATIONS
    // ========================================

    await queryRunner.query(`
            CREATE TABLE "notifications" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "user_id" uuid NOT NULL,
                "title" character varying(255) NOT NULL,
                "message" text NOT NULL,
                "type" character varying(50) NOT NULL DEFAULT 'info',
                "is_read" boolean NOT NULL DEFAULT false,
                "action_url" character varying(500),
                "metadata" jsonb,
                "read_at" TIMESTAMP,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id")
            )
        `);

    // ========================================
    // CMS & CONTENT
    // ========================================

    await queryRunner.query(`
            CREATE TABLE "cms_content" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "type" character varying(50) NOT NULL,
                "title" character varying(255) NOT NULL,
                "content" text,
                "slug" character varying(255),
                "status" character varying(20) NOT NULL DEFAULT 'draft',
                "author_id" uuid,
                "published_at" TIMESTAMP,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_49c29012968a931036b293b82de" UNIQUE ("slug"),
                CONSTRAINT "PK_5371e1da8d92f9ce09bb2ace9a9" PRIMARY KEY ("id")
            )
        `);

    // ========================================
    // AUDIT & SECURITY
    // ========================================

    await queryRunner.query(`
            CREATE TABLE "audit_logs" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "user_id" uuid,
                "action" character varying(100) NOT NULL,
                "resource_type" character varying(50) NOT NULL,
                "resource_id" uuid,
                "old_values" jsonb,
                "new_values" jsonb,
                "ip_address" character varying(45),
                "user_agent" text,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_1bb179d048bbc581caa3b013439" PRIMARY KEY ("id")
            )
        `);

    // ========================================
    // FOREIGN KEY CONSTRAINTS
    // ========================================

    // Role Permissions
    await queryRunner.query(
      `ALTER TABLE "role_permissions" ADD CONSTRAINT "FK_178199805b901ccd220ab7740ec" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permissions" ADD CONSTRAINT "FK_17022daf3f885f7d35423e9971e" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    // Users
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_a2cecd1a3531c0b041e29ba46e1" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    // User Permissions
    await queryRunner.query(
      `ALTER TABLE "user_permissions" ADD CONSTRAINT "FK_3495bd31f1862d02931e8e8d2e8" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_permissions" ADD CONSTRAINT "FK_8145f5fadacd311693c15e41f10" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    // User Profiles
    await queryRunner.query(
      `ALTER TABLE "user_profiles" ADD CONSTRAINT "FK_user_profiles_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    // Family Members
    await queryRunner.query(
      `ALTER TABLE "family_members" ADD CONSTRAINT "FK_family_members_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    // Refresh Tokens
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" ADD CONSTRAINT "FK_3ddc983c5f7bcf132fd8732c3f4" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    // Subscriptions & Payments
    await queryRunner.query(
      `ALTER TABLE "user_subscriptions" ADD CONSTRAINT "FK_0641da02314913e28f6131310eb" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_subscriptions" ADD CONSTRAINT "FK_fe0520c7b2c1c5792446086491f" FOREIGN KEY ("plan_id") REFERENCES "subscription_plans"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD CONSTRAINT "FK_427785468fb7d2733f59e7d7d39" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD CONSTRAINT "FK_75848dfef07fd19027e08ca81d2" FOREIGN KEY ("subscription_id") REFERENCES "user_subscriptions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    // Service Requests
    await queryRunner.query(
      `ALTER TABLE "service_requests" ADD CONSTRAINT "FK_c38549a33af09d8cf92e9878a17" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "service_requests" ADD CONSTRAINT "FK_e0b22dfd82074364f7cf39de64d" FOREIGN KEY ("service_type_id") REFERENCES "service_types"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "service_requests" ADD CONSTRAINT "FK_13e1874e5be036b97b7bd6cad16" FOREIGN KEY ("assigned_operator_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    // Request Status History
    await queryRunner.query(
      `ALTER TABLE "request_status_history" ADD CONSTRAINT "FK_6fafd4a5c36658baf5ccf4d9555" FOREIGN KEY ("service_request_id") REFERENCES "service_requests"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "request_status_history" ADD CONSTRAINT "FK_5b870adf4f95347df7359d25340" FOREIGN KEY ("changed_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    // Documents
    await queryRunner.query(
      `ALTER TABLE "documents" ADD CONSTRAINT "FK_5094ed28e14387543ae8fb61a6a" FOREIGN KEY ("service_request_id") REFERENCES "service_requests"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    // Appointments
    await queryRunner.query(
      `ALTER TABLE "appointments" ADD CONSTRAINT "FK_66dee3bea82328659a4db8e54b7" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" ADD CONSTRAINT "FK_4d1c82a8e9ff041dd271f7c3654" FOREIGN KEY ("service_type_id") REFERENCES "service_types"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" ADD CONSTRAINT "FK_3b079985d417c4b6731625c305b" FOREIGN KEY ("operator_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    // Courses
    await queryRunner.query(
      `ALTER TABLE "courses" ADD CONSTRAINT "FK_4fdc83dd6b261101401ec259342" FOREIGN KEY ("instructor_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    // Course Enrollments
    await queryRunner.query(
      `ALTER TABLE "course_enrollments" ADD CONSTRAINT "FK_ac52967707330a4fedfc361f72e" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "course_enrollments" ADD CONSTRAINT "FK_9d12f69999cde26f955139a5fd6" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    // Notifications
    await queryRunner.query(
      `ALTER TABLE "notifications" ADD CONSTRAINT "FK_9a8a82462cab47c73d25f49261f" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    // CMS Content
    await queryRunner.query(
      `ALTER TABLE "cms_content" ADD CONSTRAINT "FK_119dcfb8107feda84e21244b99a" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    // Audit Logs
    await queryRunner.query(
      `ALTER TABLE "audit_logs" ADD CONSTRAINT "FK_bd2726fd31b35443f2245b93ba0" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );

    // ========================================
    // INDEXES FOR PERFORMANCE
    // ========================================

    // Service Requests Indexes
    await queryRunner.query(
      `CREATE INDEX "IDX_service_requests_user_id" ON "service_requests" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_service_requests_status" ON "service_requests" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_service_requests_service_type_id" ON "service_requests" ("service_type_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_service_requests_assigned_operator" ON "service_requests" ("assigned_operator_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_service_requests_submitted_at" ON "service_requests" ("submitted_at")`,
    );

    // Documents Indexes
    await queryRunner.query(
      `CREATE INDEX "IDX_documents_service_request_id" ON "documents" ("service_request_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_documents_status" ON "documents" ("status")`,
    );

    // Appointments Indexes
    await queryRunner.query(
      `CREATE INDEX "IDX_appointments_user_id" ON "appointments" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_appointments_date" ON "appointments" ("appointment_date")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_appointments_operator_id" ON "appointments" ("operator_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_appointments_status" ON "appointments" ("status")`,
    );

    // Notifications Indexes
    await queryRunner.query(
      `CREATE INDEX "IDX_notifications_user_id" ON "notifications" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_notifications_is_read" ON "notifications" ("is_read")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_notifications_created_at" ON "notifications" ("created_at")`,
    );

    // Family Members Indexes
    await queryRunner.query(
      `CREATE INDEX "IDX_family_members_user_id" ON "family_members" ("user_id")`,
    );

    // User Profiles Indexes
    await queryRunner.query(
      `CREATE INDEX "IDX_user_profiles_user_id" ON "user_profiles" ("user_id")`,
    );

    // Payments Indexes
    await queryRunner.query(
      `CREATE INDEX "IDX_payments_user_id" ON "payments" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_payments_subscription_id" ON "payments" ("subscription_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_payments_status" ON "payments" ("status")`,
    );

    // User Subscriptions Indexes
    await queryRunner.query(
      `CREATE INDEX "IDX_user_subscriptions_user_id" ON "user_subscriptions" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_user_subscriptions_status" ON "user_subscriptions" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_user_subscriptions_end_date" ON "user_subscriptions" ("end_date")`,
    );

    // Audit Logs Indexes
    await queryRunner.query(
      `CREATE INDEX "IDX_audit_logs_user_id" ON "audit_logs" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_audit_logs_resource" ON "audit_logs" ("resource_type", "resource_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_audit_logs_created_at" ON "audit_logs" ("created_at")`,
    );

    // Course Enrollments Indexes
    await queryRunner.query(
      `CREATE INDEX "IDX_course_enrollments_user_id" ON "course_enrollments" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_course_enrollments_status" ON "course_enrollments" ("status")`,
    );

    // Refresh Tokens Indexes
    await queryRunner.query(
      `CREATE INDEX "IDX_refresh_tokens_user_id" ON "refresh_tokens" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_refresh_tokens_expires_at" ON "refresh_tokens" ("expires_at")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop all indexes
    await queryRunner.query(`DROP INDEX "IDX_refresh_tokens_expires_at"`);
    await queryRunner.query(`DROP INDEX "IDX_refresh_tokens_user_id"`);
    await queryRunner.query(`DROP INDEX "IDX_course_enrollments_status"`);
    await queryRunner.query(`DROP INDEX "IDX_course_enrollments_user_id"`);
    await queryRunner.query(`DROP INDEX "IDX_audit_logs_created_at"`);
    await queryRunner.query(`DROP INDEX "IDX_audit_logs_resource"`);
    await queryRunner.query(`DROP INDEX "IDX_audit_logs_user_id"`);
    await queryRunner.query(`DROP INDEX "IDX_user_subscriptions_end_date"`);
    await queryRunner.query(`DROP INDEX "IDX_user_subscriptions_status"`);
    await queryRunner.query(`DROP INDEX "IDX_user_subscriptions_user_id"`);
    await queryRunner.query(`DROP INDEX "IDX_payments_status"`);
    await queryRunner.query(`DROP INDEX "IDX_payments_subscription_id"`);
    await queryRunner.query(`DROP INDEX "IDX_payments_user_id"`);
    await queryRunner.query(`DROP INDEX "IDX_user_profiles_user_id"`);
    await queryRunner.query(`DROP INDEX "IDX_family_members_user_id"`);
    await queryRunner.query(`DROP INDEX "IDX_notifications_created_at"`);
    await queryRunner.query(`DROP INDEX "IDX_notifications_is_read"`);
    await queryRunner.query(`DROP INDEX "IDX_notifications_user_id"`);
    await queryRunner.query(`DROP INDEX "IDX_appointments_status"`);
    await queryRunner.query(`DROP INDEX "IDX_appointments_operator_id"`);
    await queryRunner.query(`DROP INDEX "IDX_appointments_date"`);
    await queryRunner.query(`DROP INDEX "IDX_appointments_user_id"`);
    await queryRunner.query(`DROP INDEX "IDX_documents_status"`);
    await queryRunner.query(`DROP INDEX "IDX_documents_service_request_id"`);
    await queryRunner.query(`DROP INDEX "IDX_service_requests_submitted_at"`);
    await queryRunner.query(
      `DROP INDEX "IDX_service_requests_assigned_operator"`,
    );
    await queryRunner.query(
      `DROP INDEX "IDX_service_requests_service_type_id"`,
    );
    await queryRunner.query(`DROP INDEX "IDX_service_requests_status"`);
    await queryRunner.query(`DROP INDEX "IDX_service_requests_user_id"`);

    // Drop all foreign key constraints
    await queryRunner.query(
      `ALTER TABLE "audit_logs" DROP CONSTRAINT "FK_bd2726fd31b35443f2245b93ba0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cms_content" DROP CONSTRAINT "FK_119dcfb8107feda84e21244b99a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" DROP CONSTRAINT "FK_9a8a82462cab47c73d25f49261f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "course_enrollments" DROP CONSTRAINT "FK_9d12f69999cde26f955139a5fd6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "course_enrollments" DROP CONSTRAINT "FK_ac52967707330a4fedfc361f72e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "courses" DROP CONSTRAINT "FK_4fdc83dd6b261101401ec259342"`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" DROP CONSTRAINT "FK_3b079985d417c4b6731625c305b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" DROP CONSTRAINT "FK_4d1c82a8e9ff041dd271f7c3654"`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" DROP CONSTRAINT "FK_66dee3bea82328659a4db8e54b7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "documents" DROP CONSTRAINT "FK_5094ed28e14387543ae8fb61a6a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "request_status_history" DROP CONSTRAINT "FK_5b870adf4f95347df7359d25340"`,
    );
    await queryRunner.query(
      `ALTER TABLE "request_status_history" DROP CONSTRAINT "FK_6fafd4a5c36658baf5ccf4d9555"`,
    );
    await queryRunner.query(
      `ALTER TABLE "service_requests" DROP CONSTRAINT "FK_13e1874e5be036b97b7bd6cad16"`,
    );
    await queryRunner.query(
      `ALTER TABLE "service_requests" DROP CONSTRAINT "FK_e0b22dfd82074364f7cf39de64d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "service_requests" DROP CONSTRAINT "FK_c38549a33af09d8cf92e9878a17"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" DROP CONSTRAINT "FK_75848dfef07fd19027e08ca81d2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" DROP CONSTRAINT "FK_427785468fb7d2733f59e7d7d39"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_subscriptions" DROP CONSTRAINT "FK_fe0520c7b2c1c5792446086491f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_subscriptions" DROP CONSTRAINT "FK_0641da02314913e28f6131310eb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" DROP CONSTRAINT "FK_3ddc983c5f7bcf132fd8732c3f4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_profiles" DROP CONSTRAINT "FK_user_profiles_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "family_members" DROP CONSTRAINT "FK_family_members_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_permissions" DROP CONSTRAINT "FK_8145f5fadacd311693c15e41f10"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_permissions" DROP CONSTRAINT "FK_3495bd31f1862d02931e8e8d2e8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_a2cecd1a3531c0b041e29ba46e1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permissions" DROP CONSTRAINT "FK_17022daf3f885f7d35423e9971e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permissions" DROP CONSTRAINT "FK_178199805b901ccd220ab7740ec"`,
    );

    // Drop all tables
    await queryRunner.query(`DROP TABLE "audit_logs"`);
    await queryRunner.query(`DROP TABLE "cms_content"`);
    await queryRunner.query(`DROP TABLE "notifications"`);
    await queryRunner.query(`DROP TABLE "course_enrollments"`);
    await queryRunner.query(`DROP TABLE "courses"`);
    await queryRunner.query(`DROP TABLE "appointments"`);
    await queryRunner.query(`DROP TABLE "documents"`);
    await queryRunner.query(`DROP TABLE "request_status_history"`);
    await queryRunner.query(`DROP TABLE "service_requests"`);
    await queryRunner.query(`DROP TABLE "service_types"`);
    await queryRunner.query(`DROP TABLE "payments"`);
    await queryRunner.query(`DROP TABLE "user_subscriptions"`);
    await queryRunner.query(`DROP TABLE "subscription_plans"`);
    await queryRunner.query(`DROP TABLE "refresh_tokens"`);
    await queryRunner.query(`DROP TABLE "user_profiles"`);
    await queryRunner.query(`DROP TABLE "family_members"`);
    await queryRunner.query(`DROP TABLE "user_permissions"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TABLE "role_permissions"`);
    await queryRunner.query(`DROP TABLE "permissions"`);
    await queryRunner.query(`DROP TABLE "roles"`);
  }
}
