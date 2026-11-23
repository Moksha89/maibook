ALTER TABLE "shareholder_entries" ADD COLUMN "distribution_key" TEXT;
CREATE UNIQUE INDEX "shareholder_entries_distribution_key_key" ON "shareholder_entries"("distribution_key");
