-- Share percentage per owner-company link, and payment entries for owners / business partners.
ALTER TABLE "owner_companies" ADD COLUMN "percentage" DECIMAL(7,4) NOT NULL DEFAULT 0;
CREATE TABLE "owner_entries" (
    "id" UUID NOT NULL,
    "owner_id" UUID NOT NULL,
    "company_id" UUID,
    "entry_date" DATE NOT NULL,
    "direction" TEXT NOT NULL,
    "amount" DECIMAL(30,8) NOT NULL,
    "remarks" TEXT,
    "created_by_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),
    CONSTRAINT "owner_entries_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "owner_entries_direction_check" CHECK ("direction" IN ('PAID','RECEIVED')),
    CONSTRAINT "owner_entries_amount_check" CHECK ("amount" > 0)
);
CREATE INDEX "owner_entries_owner_id_entry_date_idx" ON "owner_entries"("owner_id","entry_date");
CREATE INDEX "owner_entries_company_id_idx" ON "owner_entries"("company_id");
ALTER TABLE "owner_entries" ADD CONSTRAINT "owner_entries_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "owners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "owner_entries" ADD CONSTRAINT "owner_entries_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
