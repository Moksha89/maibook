-- Allow SUB_AGENT settlements where company_share = agent_share - upline_share (and may be negative if upline_share > agent_share).
ALTER TABLE "settlements" DROP CONSTRAINT IF EXISTS "settlements_amount_consistency";
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_amount_consistency" CHECK (
  "absolute_amount" = ABS("amount")
  AND "agent_share" >= 0
  AND "upline_share" >= 0
  AND (
    ("company_share" >= 0 AND ("agent_share" + "upline_share" + "company_share") = "absolute_amount")
    OR
    (("upline_share" + "company_share") = "agent_share")
  )
);

-- Recalculate company_share and COMPANY ledger lines for SUB_AGENT settlements.
UPDATE "settlements" s
SET "company_share" = ROUND(s."agent_share" - s."upline_share", 8)
FROM "agent_ids" ai
WHERE ai."id" = s."identifier_id"
  AND ai."type" = 'SUB_AGENT'
  AND s."company_share" IS DISTINCT FROM ROUND(s."agent_share" - s."upline_share", 8);

UPDATE "ledger_entry_lines" lel
SET
  "coins" = ROUND(s."company_share" * CASE WHEN s."amount" < 0 THEN -1 ELSE 1 END, 8),
  "cash_value" = ROUND(s."company_share" * CASE WHEN s."amount" < 0 THEN -1 ELSE 1 END, 8),
  "credit" = CASE WHEN s."company_share" * CASE WHEN s."amount" < 0 THEN -1 ELSE 1 END >= 0
                  THEN ROUND(s."company_share" * CASE WHEN s."amount" < 0 THEN -1 ELSE 1 END, 8)
                  ELSE 0 END,
  "debit"  = CASE WHEN s."company_share" * CASE WHEN s."amount" < 0 THEN -1 ELSE 1 END < 0
                  THEN ABS(ROUND(s."company_share" * CASE WHEN s."amount" < 0 THEN -1 ELSE 1 END, 8))
                  ELSE 0 END
FROM "ledger_entries" le
JOIN "settlements" s ON le."source_entity" = 'Settlement' AND le."source_id" = s."id"
JOIN "agent_ids" ai ON ai."id" = s."identifier_id"
WHERE lel."entry_id" = le."id"
  AND lel."account_type" = 'COMPANY'
  AND ai."type" = 'SUB_AGENT';

WITH ordered AS (
  SELECT
    lel."id",
    COALESCE(SUM(lel."cash_value") OVER (
      PARTITION BY lel."company_id"
      ORDER BY le."entry_date" ASC, le."created_at" ASC, lel."entry_id" ASC, lel."sequence" ASC
      ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING
    ), 0) AS new_open,
    SUM(lel."cash_value") OVER (
      PARTITION BY lel."company_id"
      ORDER BY le."entry_date" ASC, le."created_at" ASC, lel."entry_id" ASC, lel."sequence" ASC
      ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS new_close
  FROM "ledger_entry_lines" lel
  JOIN "ledger_entries" le ON le."id" = lel."entry_id"
  WHERE lel."account_type" = 'COMPANY'
    AND le."deleted_at" IS NULL
)
UPDATE "ledger_entry_lines" lel
SET
  "opening_balance" = ROUND(ordered.new_open, 8),
  "closing_balance" = ROUND(ordered.new_close, 8)
FROM ordered
WHERE lel."id" = ordered."id"
  AND (
    lel."opening_balance" IS DISTINCT FROM ROUND(ordered.new_open, 8)
    OR lel."closing_balance" IS DISTINCT FROM ROUND(ordered.new_close, 8)
  );
