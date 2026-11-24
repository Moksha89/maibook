CREATE TABLE "owner_share_history" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "owner_id" UUID NOT NULL,
  "company_id" UUID NOT NULL,
  "percentage" DECIMAL(7,4) NOT NULL,
  "effective_from" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "owner_share_history_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "owner_share_history_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "owners"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "owner_share_history_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "owner_share_history_owner_id_company_id_effective_from_idx" ON "owner_share_history"("owner_id", "company_id", "effective_from");
-- Existing assignments keep applying to all settlements already posted.
INSERT INTO "owner_share_history" ("owner_id", "company_id", "percentage", "effective_from")
SELECT "owner_id", "company_id", "percentage", TIMESTAMPTZ '1970-01-01 00:00:00+00' FROM "owner_companies";
