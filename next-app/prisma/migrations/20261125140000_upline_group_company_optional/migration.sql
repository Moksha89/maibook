-- Make upline groups independent of companies: company_id is optional, and group names are unique app-wide.
DROP INDEX IF EXISTS "upline_groups_company_id_normalized_name_key";
ALTER TABLE "upline_groups" ALTER COLUMN "company_id" DROP NOT NULL;

-- If two companies already share a group name, keep the oldest and suffix the rest so the new unique index can be added.
WITH ranked AS (
  SELECT id, normalized_name, row_number() OVER (PARTITION BY normalized_name ORDER BY created_at, id) AS rn
  FROM "upline_groups"
)
UPDATE "upline_groups" AS g
SET normalized_name = ranked.normalized_name || '-' || substring(g.id::text, 1, 8),
    name = g.name || ' ' || substring(g.id::text, 1, 8)
FROM ranked
WHERE g.id = ranked.id AND ranked.rn > 1;

CREATE UNIQUE INDEX "upline_groups_normalized_name_key" ON "upline_groups"("normalized_name");
