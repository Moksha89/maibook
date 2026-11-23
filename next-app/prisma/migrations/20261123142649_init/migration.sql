-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "CompanyStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "RecordStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "AccessLevel" AS ENUM ('READ', 'FULL');

-- CreateEnum
CREATE TYPE "PermissionEffect" AS ENUM ('GRANT', 'DENY');

-- CreateEnum
CREATE TYPE "OtpPurpose" AS ENUM ('LOGIN', 'PASSWORD_RESET', 'BACKUP_RESTORE', 'SENSITIVE_ACTION');

-- CreateEnum
CREATE TYPE "OtpStatus" AS ENUM ('PENDING', 'VERIFIED', 'EXPIRED', 'LOCKED');

-- CreateEnum
CREATE TYPE "IdentifierType" AS ENUM ('AGENT', 'SUB_AGENT');

-- CreateEnum
CREATE TYPE "LedgerAccountType" AS ENUM ('COMPANY', 'AGENT', 'UPLINE');

-- CreateEnum
CREATE TYPE "LedgerEntryType" AS ENUM ('OPENING_BALANCE', 'TRANSACTION', 'SETTLEMENT', 'MANUAL_AGENT', 'MANUAL_UPLINE', 'DISTRIBUTION', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "SettlementStatus" AS ENUM ('POSTED', 'REVERSED');

-- CreateEnum
CREATE TYPE "UplineEntrySource" AS ENUM ('SETTLEMENT', 'MANUAL');

-- CreateEnum
CREATE TYPE "ShareholderEntrySource" AS ENUM ('SETTLEMENT_PROFIT', 'MANUAL_ADJUSTMENT');

-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('COMPANY_LEDGER', 'AGENT_LEDGER', 'SETTLEMENT', 'PROFIT_DISTRIBUTION', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ReportFormat" AS ENUM ('PDF', 'PNG', 'CSV', 'TEXT', 'PRINT');

-- CreateEnum
CREATE TYPE "ReportDeliveryMode" AS ENUM ('TEXT', 'IMAGE', 'BOTH', 'EMAIL');

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('QUEUED', 'SENDING', 'SENT', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "WhatsAppConnectionStatus" AS ENUM ('DISCONNECTED', 'INITIALIZING', 'QR_READY', 'CONNECTED', 'FAILED');

-- CreateEnum
CREATE TYPE "BackupStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'VERIFIED', 'RESTORED');

-- CreateEnum
CREATE TYPE "JobType" AS ENUM ('GENERATE_REPORT', 'DELIVER_WHATSAPP', 'SEND_EMAIL', 'SEND_OTP', 'CREATE_BACKUP', 'VERIFY_BACKUP');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "legacy_id" TEXT,
    "username" TEXT NOT NULL,
    "normalized_username" TEXT NOT NULL,
    "email" TEXT,
    "normalized_email" TEXT,
    "phone" TEXT,
    "normalized_phone" TEXT,
    "password_hash" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "otp_enabled" BOOLEAN NOT NULL DEFAULT false,
    "max_devices" INTEGER NOT NULL DEFAULT 3,
    "expires_at" TIMESTAMPTZ(6),
    "password_changed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "failed_login_attempts" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMPTZ(6),
    "last_login_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "user_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "assigned_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("user_id","role_id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "role_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id","permission_id")
);

-- CreateTable
CREATE TABLE "user_permission_overrides" (
    "user_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,
    "effect" "PermissionEffect" NOT NULL,

    CONSTRAINT "user_permission_overrides_pkey" PRIMARY KEY ("user_id","permission_id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "device_id" UUID,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "last_seen_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "revoked_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_registrations" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "name" TEXT,
    "first_seen_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMPTZ(6),

    CONSTRAINT "device_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otp_challenges" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "purpose" "OtpPurpose" NOT NULL,
    "status" "OtpStatus" NOT NULL DEFAULT 'PENDING',
    "code_hash" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "verified_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "scopes" TEXT[],
    "last_used_at" TIMESTAMPTZ(6),
    "expires_at" TIMESTAMPTZ(6),
    "revoked_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" UUID NOT NULL,
    "legacy_id" TEXT,
    "name" TEXT NOT NULL,
    "normalized_name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "code" TEXT,
    "status" "CompanyStatus" NOT NULL DEFAULT 'ACTIVE',
    "currency" CHAR(3) NOT NULL DEFAULT 'INR',
    "default_rate" DECIMAL(20,8),
    "report_header" TEXT,
    "report_footer" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_access" (
    "user_id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "level" "AccessLevel" NOT NULL,

    CONSTRAINT "company_access_pkey" PRIMARY KEY ("user_id","company_id")
);

-- CreateTable
CREATE TABLE "agents" (
    "id" UUID NOT NULL,
    "legacy_id" TEXT,
    "name" TEXT NOT NULL,
    "normalized_name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "agents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_agents" (
    "company_id" UUID NOT NULL,
    "agent_id" UUID NOT NULL,
    "opening_balance" DECIMAL(30,8) NOT NULL DEFAULT 0,
    "current_balance" DECIMAL(30,8) NOT NULL DEFAULT 0,
    "assigned_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removed_at" TIMESTAMPTZ(6),

    CONSTRAINT "company_agents_pkey" PRIMARY KEY ("company_id","agent_id")
);

-- CreateTable
CREATE TABLE "ledger_entries" (
    "id" UUID NOT NULL,
    "legacy_id" TEXT,
    "company_id" UUID NOT NULL,
    "entry_type" "LedgerEntryType" NOT NULL,
    "entry_date" DATE NOT NULL,
    "reference" TEXT,
    "remarks" TEXT,
    "idempotency_key" TEXT,
    "source_entity" TEXT,
    "source_id" UUID,
    "created_by_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "ledger_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ledger_entry_lines" (
    "id" UUID NOT NULL,
    "entry_id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "account_type" "LedgerAccountType" NOT NULL,
    "agent_id" UUID,
    "upline_id" UUID,
    "coins" DECIMAL(30,8) NOT NULL,
    "rate" DECIMAL(20,8) NOT NULL,
    "cash_value" DECIMAL(30,8) NOT NULL,
    "credit" DECIMAL(30,8) NOT NULL DEFAULT 0,
    "debit" DECIMAL(30,8) NOT NULL DEFAULT 0,
    "opening_balance" DECIMAL(30,8) NOT NULL,
    "closing_balance" DECIMAL(30,8) NOT NULL,
    "sequence" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ledger_entry_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_ids" (
    "id" UUID NOT NULL,
    "legacy_id" TEXT,
    "company_id" UUID NOT NULL,
    "agent_id" UUID NOT NULL,
    "value" TEXT NOT NULL,
    "normalized_value" TEXT NOT NULL,
    "type" "IdentifierType" NOT NULL,
    "percentage_rate" DECIMAL(7,4) NOT NULL,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "current_balance" DECIMAL(30,8) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "agent_ids_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settlements" (
    "id" UUID NOT NULL,
    "legacy_id" TEXT,
    "company_id" UUID NOT NULL,
    "agent_id" UUID NOT NULL,
    "identifier_id" UUID NOT NULL,
    "settlement_date" DATE NOT NULL,
    "amount" DECIMAL(30,8) NOT NULL,
    "absolute_amount" DECIMAL(30,8) NOT NULL,
    "agent_percentage" DECIMAL(7,4) NOT NULL,
    "upline_percentage" DECIMAL(7,4) NOT NULL DEFAULT 0,
    "agent_share" DECIMAL(30,8) NOT NULL,
    "company_share" DECIMAL(30,8) NOT NULL,
    "upline_share" DECIMAL(30,8) NOT NULL DEFAULT 0,
    "status" "SettlementStatus" NOT NULL DEFAULT 'POSTED',
    "remarks" TEXT,
    "idempotency_key" TEXT NOT NULL,
    "created_by_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reversed_at" TIMESTAMPTZ(6),

    CONSTRAINT "settlements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "uplines" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "normalized_name" TEXT NOT NULL,
    "percentage_rate" DECIMAL(7,4) NOT NULL DEFAULT 0,
    "current_balance" DECIMAL(30,8) NOT NULL DEFAULT 0,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "uplines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "upline_groups" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "normalized_name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "upline_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "upline_group_members" (
    "group_id" UUID NOT NULL,
    "upline_id" UUID NOT NULL,
    "percentage_rate" DECIMAL(7,4) NOT NULL,

    CONSTRAINT "upline_group_members_pkey" PRIMARY KEY ("group_id","upline_id")
);

-- CreateTable
CREATE TABLE "upline_entries" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "upline_id" UUID NOT NULL,
    "settlement_id" UUID,
    "source" "UplineEntrySource" NOT NULL,
    "entry_date" DATE NOT NULL,
    "amount" DECIMAL(30,8) NOT NULL,
    "remarks" TEXT,
    "created_by_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "upline_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shareholders" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "normalized_name" TEXT NOT NULL,
    "percentage" DECIMAL(7,4) NOT NULL,
    "current_balance" DECIMAL(30,8) NOT NULL DEFAULT 0,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "phone" TEXT,
    "email" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "shareholders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shareholder_entries" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "shareholder_id" UUID NOT NULL,
    "settlement_id" UUID,
    "source" "ShareholderEntrySource" NOT NULL,
    "entry_date" DATE NOT NULL,
    "company_profit" DECIMAL(30,8) NOT NULL,
    "percentage" DECIMAL(7,4) NOT NULL,
    "amount" DECIMAL(30,8) NOT NULL,
    "remarks" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "shareholder_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "owners" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "normalized_name" TEXT NOT NULL,
    "email" TEXT,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "owners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "owner_phone_numbers" (
    "id" UUID NOT NULL,
    "owner_id" UUID NOT NULL,
    "phone" TEXT NOT NULL,
    "label" TEXT,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "owner_phone_numbers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "owner_agent_assignments" (
    "owner_id" UUID NOT NULL,
    "agent_id" UUID NOT NULL,
    "assigned_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "owner_agent_assignments_pkey" PRIMARY KEY ("owner_id","agent_id")
);

-- CreateTable
CREATE TABLE "report_templates" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ReportType" NOT NULL,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "report_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "generated_reports" (
    "id" UUID NOT NULL,
    "company_id" UUID,
    "template_id" UUID,
    "type" "ReportType" NOT NULL,
    "format" "ReportFormat" NOT NULL,
    "parameters" JSONB NOT NULL,
    "storage_key" TEXT,
    "checksum" TEXT,
    "generated_by_id" UUID,
    "generated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6),

    CONSTRAINT "generated_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_deliveries" (
    "id" UUID NOT NULL,
    "report_id" UUID NOT NULL,
    "mode" "ReportDeliveryMode" NOT NULL,
    "recipient" TEXT NOT NULL,
    "status" "DeliveryStatus" NOT NULL DEFAULT 'QUEUED',
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,
    "next_attempt_at" TIMESTAMPTZ(6),
    "sent_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whatsapp_connections" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "status" "WhatsAppConnectionStatus" NOT NULL DEFAULT 'DISCONNECTED',
    "phone_number" TEXT,
    "session_key" TEXT NOT NULL,
    "qr_expires_at" TIMESTAMPTZ(6),
    "last_connected_at" TIMESTAMPTZ(6),
    "last_error" TEXT,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "whatsapp_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whatsapp_messages" (
    "id" UUID NOT NULL,
    "connection_id" UUID NOT NULL,
    "delivery_id" UUID,
    "recipient" TEXT NOT NULL,
    "mode" "ReportDeliveryMode" NOT NULL,
    "status" "DeliveryStatus" NOT NULL DEFAULT 'QUEUED',
    "provider_message_id" TEXT,
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,
    "sent_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "whatsapp_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "backups" (
    "id" UUID NOT NULL,
    "status" "BackupStatus" NOT NULL DEFAULT 'PENDING',
    "storage_key" TEXT,
    "checksum" TEXT,
    "size_bytes" BIGINT,
    "error_message" TEXT,
    "requested_by_id" UUID,
    "started_at" TIMESTAMPTZ(6),
    "completed_at" TIMESTAMPTZ(6),
    "verified_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "backups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "backup_recipients" (
    "id" UUID NOT NULL,
    "backup_id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "delivered_at" TIMESTAMPTZ(6),

    CONSTRAINT "backup_recipients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "actor_id" UUID,
    "company_id" UUID,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT,
    "old_values" JSONB,
    "new_values" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "request_id" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_settings" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "is_secret" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "updated_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "application_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jobs" (
    "id" UUID NOT NULL,
    "type" "JobType" NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'PENDING',
    "payload" JSONB NOT NULL,
    "idempotency_key" TEXT,
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "max_attempts" INTEGER NOT NULL DEFAULT 3,
    "run_after" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "locked_at" TIMESTAMPTZ(6),
    "locked_by" TEXT,
    "last_error" TEXT,
    "completed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_legacy_id_key" ON "users"("legacy_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_normalized_username_key" ON "users"("normalized_username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_normalized_email_key" ON "users"("normalized_email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "users_normalized_phone_key" ON "users"("normalized_phone");

-- CreateIndex
CREATE INDEX "users_status_deleted_at_idx" ON "users"("status", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "roles_key_key" ON "roles"("key");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_key_key" ON "permissions"("key");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_module_action_key" ON "permissions"("module", "action");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_hash_key" ON "sessions"("token_hash");

-- CreateIndex
CREATE INDEX "sessions_user_id_revoked_at_expires_at_idx" ON "sessions"("user_id", "revoked_at", "expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "device_registrations_user_id_fingerprint_key" ON "device_registrations"("user_id", "fingerprint");

-- CreateIndex
CREATE INDEX "otp_challenges_user_id_purpose_status_idx" ON "otp_challenges"("user_id", "purpose", "status");

-- CreateIndex
CREATE UNIQUE INDEX "api_tokens_token_hash_key" ON "api_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "api_tokens_user_id_revoked_at_idx" ON "api_tokens"("user_id", "revoked_at");

-- CreateIndex
CREATE UNIQUE INDEX "companies_legacy_id_key" ON "companies"("legacy_id");

-- CreateIndex
CREATE UNIQUE INDEX "companies_normalized_name_key" ON "companies"("normalized_name");

-- CreateIndex
CREATE UNIQUE INDEX "companies_slug_key" ON "companies"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "companies_code_key" ON "companies"("code");

-- CreateIndex
CREATE INDEX "companies_status_deleted_at_idx" ON "companies"("status", "deleted_at");

-- CreateIndex
CREATE INDEX "company_access_company_id_level_idx" ON "company_access"("company_id", "level");

-- CreateIndex
CREATE UNIQUE INDEX "agents_legacy_id_key" ON "agents"("legacy_id");

-- CreateIndex
CREATE INDEX "agents_normalized_name_idx" ON "agents"("normalized_name");

-- CreateIndex
CREATE UNIQUE INDEX "agents_normalized_name_phone_key" ON "agents"("normalized_name", "phone");

-- CreateIndex
CREATE INDEX "company_agents_agent_id_removed_at_idx" ON "company_agents"("agent_id", "removed_at");

-- CreateIndex
CREATE UNIQUE INDEX "ledger_entries_legacy_id_key" ON "ledger_entries"("legacy_id");

-- CreateIndex
CREATE UNIQUE INDEX "ledger_entries_idempotency_key_key" ON "ledger_entries"("idempotency_key");

-- CreateIndex
CREATE INDEX "ledger_entries_company_id_entry_date_deleted_at_idx" ON "ledger_entries"("company_id", "entry_date", "deleted_at");

-- CreateIndex
CREATE INDEX "ledger_entries_source_entity_source_id_idx" ON "ledger_entries"("source_entity", "source_id");

-- CreateIndex
CREATE INDEX "ledger_entry_lines_company_id_sequence_idx" ON "ledger_entry_lines"("company_id", "sequence");

-- CreateIndex
CREATE INDEX "ledger_entry_lines_agent_id_created_at_idx" ON "ledger_entry_lines"("agent_id", "created_at");

-- CreateIndex
CREATE INDEX "ledger_entry_lines_upline_id_created_at_idx" ON "ledger_entry_lines"("upline_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "ledger_entry_lines_entry_id_sequence_key" ON "ledger_entry_lines"("entry_id", "sequence");

-- CreateIndex
CREATE UNIQUE INDEX "agent_ids_legacy_id_key" ON "agent_ids"("legacy_id");

-- CreateIndex
CREATE INDEX "agent_ids_agent_id_status_idx" ON "agent_ids"("agent_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "agent_ids_company_id_normalized_value_key" ON "agent_ids"("company_id", "normalized_value");

-- CreateIndex
CREATE UNIQUE INDEX "settlements_legacy_id_key" ON "settlements"("legacy_id");

-- CreateIndex
CREATE UNIQUE INDEX "settlements_idempotency_key_key" ON "settlements"("idempotency_key");

-- CreateIndex
CREATE INDEX "settlements_company_id_settlement_date_status_idx" ON "settlements"("company_id", "settlement_date", "status");

-- CreateIndex
CREATE INDEX "settlements_identifier_id_settlement_date_idx" ON "settlements"("identifier_id", "settlement_date");

-- CreateIndex
CREATE UNIQUE INDEX "uplines_company_id_normalized_name_key" ON "uplines"("company_id", "normalized_name");

-- CreateIndex
CREATE UNIQUE INDEX "upline_groups_company_id_normalized_name_key" ON "upline_groups"("company_id", "normalized_name");

-- CreateIndex
CREATE INDEX "upline_entries_company_id_entry_date_source_deleted_at_idx" ON "upline_entries"("company_id", "entry_date", "source", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "shareholders_company_id_normalized_name_key" ON "shareholders"("company_id", "normalized_name");

-- CreateIndex
CREATE INDEX "shareholder_entries_company_id_entry_date_source_deleted_at_idx" ON "shareholder_entries"("company_id", "entry_date", "source", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "owners_company_id_normalized_name_key" ON "owners"("company_id", "normalized_name");

-- CreateIndex
CREATE UNIQUE INDEX "owner_phone_numbers_owner_id_phone_key" ON "owner_phone_numbers"("owner_id", "phone");

-- CreateIndex
CREATE UNIQUE INDEX "report_templates_name_key" ON "report_templates"("name");

-- CreateIndex
CREATE INDEX "generated_reports_company_id_type_generated_at_idx" ON "generated_reports"("company_id", "type", "generated_at");

-- CreateIndex
CREATE INDEX "report_deliveries_status_next_attempt_at_idx" ON "report_deliveries"("status", "next_attempt_at");

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_connections_name_key" ON "whatsapp_connections"("name");

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_connections_session_key_key" ON "whatsapp_connections"("session_key");

-- CreateIndex
CREATE INDEX "whatsapp_messages_status_created_at_idx" ON "whatsapp_messages"("status", "created_at");

-- CreateIndex
CREATE INDEX "backups_status_created_at_idx" ON "backups"("status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "backup_recipients_backup_id_email_key" ON "backup_recipients"("backup_id", "email");

-- CreateIndex
CREATE INDEX "audit_logs_actor_id_created_at_idx" ON "audit_logs"("actor_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_company_id_created_at_idx" ON "audit_logs"("company_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_action_created_at_idx" ON "audit_logs"("action", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "application_settings_key_key" ON "application_settings"("key");

-- CreateIndex
CREATE UNIQUE INDEX "jobs_idempotency_key_key" ON "jobs"("idempotency_key");

-- CreateIndex
CREATE INDEX "jobs_status_run_after_idx" ON "jobs"("status", "run_after");

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_permission_overrides" ADD CONSTRAINT "user_permission_overrides_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_permission_overrides" ADD CONSTRAINT "user_permission_overrides_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "device_registrations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_registrations" ADD CONSTRAINT "device_registrations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "otp_challenges" ADD CONSTRAINT "otp_challenges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_tokens" ADD CONSTRAINT "api_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_access" ADD CONSTRAINT "company_access_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_access" ADD CONSTRAINT "company_access_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_agents" ADD CONSTRAINT "company_agents_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_agents" ADD CONSTRAINT "company_agents_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_entry_lines" ADD CONSTRAINT "ledger_entry_lines_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "ledger_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_entry_lines" ADD CONSTRAINT "ledger_entry_lines_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_entry_lines" ADD CONSTRAINT "ledger_entry_lines_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_entry_lines" ADD CONSTRAINT "ledger_entry_lines_upline_id_fkey" FOREIGN KEY ("upline_id") REFERENCES "uplines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_ids" ADD CONSTRAINT "agent_ids_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_ids" ADD CONSTRAINT "agent_ids_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_identifier_id_fkey" FOREIGN KEY ("identifier_id") REFERENCES "agent_ids"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "uplines" ADD CONSTRAINT "uplines_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "upline_groups" ADD CONSTRAINT "upline_groups_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "upline_group_members" ADD CONSTRAINT "upline_group_members_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "upline_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "upline_group_members" ADD CONSTRAINT "upline_group_members_upline_id_fkey" FOREIGN KEY ("upline_id") REFERENCES "uplines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "upline_entries" ADD CONSTRAINT "upline_entries_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "upline_entries" ADD CONSTRAINT "upline_entries_upline_id_fkey" FOREIGN KEY ("upline_id") REFERENCES "uplines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "upline_entries" ADD CONSTRAINT "upline_entries_settlement_id_fkey" FOREIGN KEY ("settlement_id") REFERENCES "settlements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shareholders" ADD CONSTRAINT "shareholders_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shareholder_entries" ADD CONSTRAINT "shareholder_entries_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shareholder_entries" ADD CONSTRAINT "shareholder_entries_shareholder_id_fkey" FOREIGN KEY ("shareholder_id") REFERENCES "shareholders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shareholder_entries" ADD CONSTRAINT "shareholder_entries_settlement_id_fkey" FOREIGN KEY ("settlement_id") REFERENCES "settlements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "owners" ADD CONSTRAINT "owners_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "owner_phone_numbers" ADD CONSTRAINT "owner_phone_numbers_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "owners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "owner_agent_assignments" ADD CONSTRAINT "owner_agent_assignments_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "owners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "owner_agent_assignments" ADD CONSTRAINT "owner_agent_assignments_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_reports" ADD CONSTRAINT "generated_reports_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_reports" ADD CONSTRAINT "generated_reports_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "report_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_deliveries" ADD CONSTRAINT "report_deliveries_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "generated_reports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_messages" ADD CONSTRAINT "whatsapp_messages_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "whatsapp_connections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "backup_recipients" ADD CONSTRAINT "backup_recipients_backup_id_fkey" FOREIGN KEY ("backup_id") REFERENCES "backups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
