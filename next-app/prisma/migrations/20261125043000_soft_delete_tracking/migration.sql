-- Track who soft-deleted agents, companies and IDs. Rows are never removed; deleted_at marks them.
ALTER TABLE "companies" ADD COLUMN "deleted_by_id" UUID;
ALTER TABLE "agents" ADD COLUMN "deleted_by_id" UUID;
ALTER TABLE "agent_ids" ADD COLUMN "deleted_by_id" UUID;

-- Backfill the deleter for records deleted before this column existed, from the audit log.
UPDATE "agents" a SET "deleted_by_id" = l."actor_id" FROM (SELECT DISTINCT ON ("entity_id") "entity_id", "actor_id" FROM "audit_logs" WHERE "action" = 'agent.delete' ORDER BY "entity_id", "created_at" DESC) l WHERE a."deleted_at" IS NOT NULL AND a."deleted_by_id" IS NULL AND l."entity_id" = a."id"::text;
UPDATE "agent_ids" i SET "deleted_by_id" = l."actor_id" FROM (SELECT DISTINCT ON ("entity_id") "entity_id", "actor_id" FROM "audit_logs" WHERE "action" = 'identifier.delete' ORDER BY "entity_id", "created_at" DESC) l WHERE i."deleted_at" IS NOT NULL AND i."deleted_by_id" IS NULL AND l."entity_id" = i."id"::text;
UPDATE "companies" c SET "deleted_by_id" = l."actor_id" FROM (SELECT DISTINCT ON ("company_id") "company_id", "actor_id" FROM "audit_logs" WHERE "action" = 'company.delete' ORDER BY "company_id", "created_at" DESC) l WHERE c."deleted_at" IS NOT NULL AND c."deleted_by_id" IS NULL AND l."company_id" = c."id";
