ALTER TABLE "settlements" ADD COLUMN "profit_distributed_at" TIMESTAMPTZ(6);
CREATE INDEX "settlements_company_id_profit_distributed_at_idx" ON "settlements"("company_id", "profit_distributed_at");
