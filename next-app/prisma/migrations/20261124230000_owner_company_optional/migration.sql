-- Owners can be created without a company and assigned one later.
ALTER TABLE "owners" ALTER COLUMN "company_id" DROP NOT NULL;
ALTER TABLE "owners" ADD COLUMN "created_by_id" UUID;
