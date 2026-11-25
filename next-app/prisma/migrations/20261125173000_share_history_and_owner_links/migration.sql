-- Time-effective partner and agent share history, identifier-agent assignment history,
-- and backfill of owner_companies from shareholder rows (a shareholder assignment is the partnership).

ALTER TABLE "owner_share_history" ADD COLUMN IF NOT EXISTS "effective_to" TIMESTAMPTZ(6);

CREATE TABLE IF NOT EXISTS "identifier_share_history" (
  "id" UUID NOT NULL,
  "identifier_id" UUID NOT NULL,
  "percentage" DECIMAL(7,4) NOT NULL,
  "effective_from" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "effective_to" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "identifier_share_history_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "identifier_share_history_identifier_id_effective_from_idx" ON "identifier_share_history" ("identifier_id", "effective_from");
ALTER TABLE "identifier_share_history" DROP CONSTRAINT IF EXISTS "identifier_share_history_identifier_id_fkey";
ALTER TABLE "identifier_share_history" ADD CONSTRAINT "identifier_share_history_identifier_id_fkey" FOREIGN KEY ("identifier_id") REFERENCES "agent_ids"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "identifier_agent_assignments" (
  "id" UUID NOT NULL,
  "identifier_id" UUID NOT NULL,
  "agent_id" UUID NOT NULL,
  "effective_from" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "effective_to" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "identifier_agent_assignments_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "identifier_agent_assignments_identifier_id_effective_from_idx" ON "identifier_agent_assignments" ("identifier_id", "effective_from");
ALTER TABLE "identifier_agent_assignments" DROP CONSTRAINT IF EXISTS "identifier_agent_assignments_identifier_id_fkey";
ALTER TABLE "identifier_agent_assignments" ADD CONSTRAINT "identifier_agent_assignments_identifier_id_fkey" FOREIGN KEY ("identifier_id") REFERENCES "agent_ids"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "identifier_agent_assignments" DROP CONSTRAINT IF EXISTS "identifier_agent_assignments_agent_id_fkey";
ALTER TABLE "identifier_agent_assignments" ADD CONSTRAINT "identifier_agent_assignments_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Find-or-create an owner for each distinct live shareholder name.
INSERT INTO "owners" ("id", "name", "normalized_name", "email", "status", "created_by_id", "created_at", "updated_at")
SELECT gen_random_uuid(),
       (ARRAY_AGG(sh."name" ORDER BY sh."created_at"))[1],
       sh."normalized_name",
       (ARRAY_AGG(sh."email" ORDER BY sh."created_at") FILTER (WHERE sh."email" IS NOT NULL))[1],
       'ACTIVE',
       COALESCE(
         (SELECT o."created_by_id" FROM "owners" o WHERE o."normalized_name" = sh."normalized_name" ORDER BY o."created_at" LIMIT 1),
         (SELECT u."id" FROM "users" u ORDER BY u."created_at" LIMIT 1)
       ),
       CURRENT_TIMESTAMP,
       CURRENT_TIMESTAMP
FROM "shareholders" sh
WHERE sh."deleted_at" IS NULL AND sh."status" = 'ACTIVE'
  AND NOT EXISTS (SELECT 1 FROM "owners" o WHERE o."normalized_name" = sh."normalized_name")
GROUP BY sh."normalized_name";

-- Link each live shareholder to the chosen owner (standalone / earliest) if not already linked.
INSERT INTO "owner_companies" ("owner_id", "company_id", "percentage", "assigned_at")
SELECT o."id", sh."company_id", sh."percentage", sh."created_at"
FROM "shareholders" sh
JOIN LATERAL (
  SELECT x."id"
  FROM "owners" x
  WHERE x."normalized_name" = sh."normalized_name"
  ORDER BY (x."company_id" IS NULL) DESC, x."created_at" ASC
  LIMIT 1
) o ON TRUE
WHERE sh."deleted_at" IS NULL AND sh."status" = 'ACTIVE'
  AND NOT EXISTS (
    SELECT 1 FROM "owner_companies" oc
    WHERE oc."owner_id" = o."id" AND oc."company_id" = sh."company_id"
  );

-- First share history starts at the shareholder row's created_at, so earlier settlements earn 0.
INSERT INTO "owner_share_history" ("id", "owner_id", "company_id", "percentage", "effective_from", "created_at")
SELECT gen_random_uuid(), o."id", sh."company_id", sh."percentage", sh."created_at", CURRENT_TIMESTAMP
FROM "shareholders" sh
JOIN LATERAL (
  SELECT x."id"
  FROM "owners" x
  WHERE x."normalized_name" = sh."normalized_name"
  ORDER BY (x."company_id" IS NULL) DESC, x."created_at" ASC
  LIMIT 1
) o ON TRUE
WHERE sh."deleted_at" IS NULL AND sh."status" = 'ACTIVE'
  AND NOT EXISTS (
    SELECT 1 FROM "owner_share_history" h
    WHERE h."owner_id" = o."id" AND h."company_id" = sh."company_id"
  );

-- Current ID % from the ID's creation time (posted settlements already store their own %).
INSERT INTO "identifier_share_history" ("id", "identifier_id", "percentage", "effective_from", "created_at")
SELECT gen_random_uuid(), ai."id", ai."percentage_rate", ai."created_at", CURRENT_TIMESTAMP
FROM "agent_ids" ai
WHERE ai."deleted_at" IS NULL
  AND NOT EXISTS (SELECT 1 FROM "identifier_share_history" h WHERE h."identifier_id" = ai."id");

-- Current agent assignment from the ID's creation time (posted settlements already store their own agent).
INSERT INTO "identifier_agent_assignments" ("id", "identifier_id", "agent_id", "effective_from", "created_at")
SELECT gen_random_uuid(), ai."id", ai."agent_id", ai."created_at", CURRENT_TIMESTAMP
FROM "agent_ids" ai
WHERE ai."deleted_at" IS NULL AND ai."agent_id" IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM "identifier_agent_assignments" a WHERE a."identifier_id" = ai."id");

-- If an earlier first history row started at epoch, move it to the shareholder's created_at so pre-assignment profit is excluded.
UPDATE "owner_share_history" AS h
SET "effective_from" = sh."created_at"
FROM "shareholders" sh
JOIN LATERAL (
  SELECT x."id"
  FROM "owners" x
  WHERE x."normalized_name" = sh."normalized_name"
  ORDER BY (x."company_id" IS NULL) DESC, x."created_at" ASC
  LIMIT 1
) o ON TRUE
WHERE h."owner_id" = o."id"
  AND h."company_id" = sh."company_id"
  AND sh."deleted_at" IS NULL
  AND sh."status" = 'ACTIVE'
  AND h."effective_from" = TIMESTAMPTZ '1970-01-01 00:00:00+00'
  AND sh."created_at" > TIMESTAMPTZ '1970-01-01 00:00:01+00'
  AND NOT EXISTS (
    SELECT 1 FROM "owner_share_history" earlier
    WHERE earlier."owner_id" = h."owner_id"
      AND earlier."company_id" = h."company_id"
      AND earlier."id" <> h."id"
      AND earlier."effective_from" < h."effective_from"
  );
