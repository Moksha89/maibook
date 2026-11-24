-- Owners and business partners can be linked to many companies.
CREATE TABLE "owner_companies" (
    "owner_id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "assigned_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "owner_companies_pkey" PRIMARY KEY ("owner_id","company_id")
);
CREATE INDEX "owner_companies_company_id_idx" ON "owner_companies"("company_id");
ALTER TABLE "owner_companies" ADD CONSTRAINT "owner_companies_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "owners"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "owner_companies" ADD CONSTRAINT "owner_companies_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- Carry over each owner's existing single company.
INSERT INTO "owner_companies" ("owner_id","company_id") SELECT "id","company_id" FROM "owners" WHERE "company_id" IS NOT NULL;
