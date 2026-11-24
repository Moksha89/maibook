ALTER TABLE "shareholder_entries" ADD COLUMN "period_start" DATE;
ALTER TABLE "shareholder_entries" ADD COLUMN "period_end" DATE;
CREATE INDEX "shareholder_entries_company_id_period_start_period_end_deleted_at_idx" ON "shareholder_entries"("company_id", "period_start", "period_end", "deleted_at");
