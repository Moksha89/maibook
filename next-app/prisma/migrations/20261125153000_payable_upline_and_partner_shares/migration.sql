-- Flip stored upline settlement amounts and shareholder payables so negative means the company owes them
-- (same convention as the agent ledger). Manual upline entries are left unchanged.
-- Company profit / settlement share magnitudes are not changed.

UPDATE "upline_entries"
SET "amount" = -"amount"
WHERE "source" = 'SETTLEMENT';

UPDATE "ledger_entry_lines" AS l
SET
  "coins" = -l."coins",
  "cash_value" = -l."cash_value",
  "credit" = CASE WHEN (-l."cash_value") >= 0 THEN (-l."cash_value") ELSE 0 END,
  "debit" = CASE WHEN (-l."cash_value") < 0 THEN ABS(-l."cash_value") ELSE 0 END
FROM "ledger_entries" AS e
WHERE l."entry_id" = e."id"
  AND l."account_type" = 'UPLINE'
  AND e."entry_type" = 'SETTLEMENT';

WITH ordered AS (
  SELECT
    l."id",
    SUM(l."cash_value") OVER (
      PARTITION BY l."upline_id"
      ORDER BY e."entry_date" ASC, e."created_at" ASC, l."entry_id" ASC, l."sequence" ASC
      ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS closing,
    SUM(l."cash_value") OVER (
      PARTITION BY l."upline_id"
      ORDER BY e."entry_date" ASC, e."created_at" ASC, l."entry_id" ASC, l."sequence" ASC
      ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) - l."cash_value" AS opening
  FROM "ledger_entry_lines" AS l
  JOIN "ledger_entries" AS e ON e."id" = l."entry_id"
  WHERE l."account_type" = 'UPLINE'
    AND l."upline_id" IS NOT NULL
    AND e."deleted_at" IS NULL
)
UPDATE "ledger_entry_lines" AS l
SET "opening_balance" = ordered.opening, "closing_balance" = ordered.closing
FROM ordered
WHERE l."id" = ordered.id;

UPDATE "uplines" AS u
SET "current_balance" = COALESCE((
  SELECT l."closing_balance"
  FROM "ledger_entry_lines" AS l
  JOIN "ledger_entries" AS e ON e."id" = l."entry_id"
  WHERE l."upline_id" = u."id"
    AND l."account_type" = 'UPLINE'
    AND e."deleted_at" IS NULL
  ORDER BY e."entry_date" DESC, e."created_at" DESC, l."entry_id" DESC, l."sequence" DESC
  LIMIT 1
), 0);

UPDATE "shareholder_entries"
SET "amount" = -"amount";

UPDATE "shareholders" AS s
SET "current_balance" = COALESCE((
  SELECT SUM(se."amount")
  FROM "shareholder_entries" AS se
  WHERE se."shareholder_id" = s."id"
    AND se."deleted_at" IS NULL
), 0);
