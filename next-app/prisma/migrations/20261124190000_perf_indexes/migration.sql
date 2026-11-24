-- Sorting indexes for the newest-first Ledger and Audit log lists (they sorted the whole table before).
CREATE INDEX IF NOT EXISTS "ledger_entries_entry_date_created_at_idx" ON "ledger_entries"("entry_date" DESC, "created_at" DESC);
CREATE INDEX IF NOT EXISTS "audit_logs_created_at_idx" ON "audit_logs"("created_at" DESC);
