-- ID names are unique within a site, not across the app or a company. Soft-deleted rows already get a ~deleted- suffix, so a plain unique index is enough.
DROP INDEX IF EXISTS "agent_ids_company_id_normalized_value_key";

WITH ranked AS (
  SELECT id, site_id, normalized_value,
         row_number() OVER (PARTITION BY site_id, normalized_value ORDER BY created_at, id) AS rn
  FROM "agent_ids"
)
UPDATE "agent_ids" AS a
SET normalized_value = ranked.normalized_value || '-' || substring(a.id::text, 1, 8)
FROM ranked
WHERE a.id = ranked.id AND ranked.rn > 1;

CREATE UNIQUE INDEX "agent_ids_site_id_normalized_value_key" ON "agent_ids"("site_id", "normalized_value");
