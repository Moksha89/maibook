ALTER TABLE "ledger_entry_lines" DROP CONSTRAINT "ledger_entry_lines_amounts";
ALTER TABLE "ledger_entry_lines" ADD CONSTRAINT "ledger_entry_lines_amounts"
CHECK (
  "cash_value" = round("coins" * "rate", 8)
  AND "credit" >= 0
  AND "debit" >= 0
  AND NOT ("credit" > 0 AND "debit" > 0)
);
