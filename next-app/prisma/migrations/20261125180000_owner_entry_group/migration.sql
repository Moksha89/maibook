ALTER TABLE "owner_entries" ADD COLUMN IF NOT EXISTS "group_id" UUID;
CREATE INDEX IF NOT EXISTS "owner_entries_group_id_idx" ON "owner_entries" ("group_id");
