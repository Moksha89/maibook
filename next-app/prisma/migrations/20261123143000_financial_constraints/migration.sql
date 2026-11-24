ALTER TABLE "agent_ids"
  ADD CONSTRAINT "agent_ids_percentage_rate_range"
  CHECK ("percentage_rate" >= 0 AND "percentage_rate" <= 100);

ALTER TABLE "uplines"
  ADD CONSTRAINT "uplines_percentage_rate_range"
  CHECK ("percentage_rate" >= 0 AND "percentage_rate" <= 100);

ALTER TABLE "upline_group_members"
  ADD CONSTRAINT "upline_group_members_percentage_rate_range"
  CHECK ("percentage_rate" >= 0 AND "percentage_rate" <= 100);

ALTER TABLE "shareholders"
  ADD CONSTRAINT "shareholders_percentage_range"
  CHECK ("percentage" >= 0 AND "percentage" <= 100);

ALTER TABLE "settlements"
  ADD CONSTRAINT "settlements_percentage_ranges"
  CHECK (
    "agent_percentage" >= 0 AND "agent_percentage" <= 100
    AND "upline_percentage" >= 0 AND "upline_percentage" <= 100
  ),
  ADD CONSTRAINT "settlements_amount_consistency"
  CHECK (
    "absolute_amount" = abs("amount")
    AND "agent_share" >= 0
    AND "company_share" >= 0
    AND "upline_share" >= 0
    AND "agent_share" + "company_share" = "absolute_amount"
  );

ALTER TABLE "ledger_entry_lines"
  ADD CONSTRAINT "ledger_entry_lines_account_reference"
  CHECK (
    ("account_type" = 'COMPANY' AND "agent_id" IS NULL AND "upline_id" IS NULL)
    OR ("account_type" = 'AGENT' AND "agent_id" IS NOT NULL AND "upline_id" IS NULL)
    OR ("account_type" = 'UPLINE' AND "agent_id" IS NULL AND "upline_id" IS NOT NULL)
  ),
  ADD CONSTRAINT "ledger_entry_lines_amounts"
  CHECK (
    "cash_value" = "coins" * "rate"
    AND "credit" >= 0
    AND "debit" >= 0
    AND NOT ("credit" > 0 AND "debit" > 0)
  );

ALTER TABLE "jobs"
  ADD CONSTRAINT "jobs_attempt_range"
  CHECK ("attempt_count" >= 0 AND "max_attempts" > 0 AND "attempt_count" <= "max_attempts");

CREATE OR REPLACE FUNCTION enforce_shareholder_percentage_limit()
RETURNS trigger AS $$
DECLARE
  percentage_total numeric;
BEGIN
  IF NEW."status" = 'ACTIVE' AND NEW."deleted_at" IS NULL THEN
    SELECT COALESCE(SUM("percentage"), 0)
      INTO percentage_total
      FROM "shareholders"
     WHERE "company_id" = NEW."company_id"
       AND "status" = 'ACTIVE'
       AND "deleted_at" IS NULL
       AND "id" <> NEW."id";

    IF percentage_total + NEW."percentage" > 100 THEN
      RAISE EXCEPTION 'Active shareholder percentages cannot exceed 100 percent';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "shareholders_percentage_limit"
BEFORE INSERT OR UPDATE OF "company_id", "percentage", "status", "deleted_at"
ON "shareholders"
FOR EACH ROW EXECUTE FUNCTION enforce_shareholder_percentage_limit();
