ALTER TABLE "identifier_agent_assignments" ADD COLUMN IF NOT EXISTS "split_percentage" DECIMAL(7, 4) NOT NULL DEFAULT 100;

UPDATE "identifier_agent_assignments" SET "split_percentage" = 100 WHERE "split_percentage" IS NULL;
