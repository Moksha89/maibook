-- Convert stored assignment percentages from "share of the ID rate" (totalling 100)
-- into each agent's actual rate, so the ID rate is the sum of its agent percentages.
-- Uses the ID % in force when the assignment started; falls back to the current ID %.
-- Old settlements are not rewritten.

UPDATE "identifier_agent_assignments" AS ia
SET "split_percentage" = ROUND(
  ia."split_percentage" * COALESCE((
    SELECT h."percentage"
    FROM "identifier_share_history" AS h
    WHERE h."identifier_id" = ia."identifier_id"
      AND h."effective_from" <= ia."effective_from"
      AND (h."effective_to" IS NULL OR h."effective_to" > ia."effective_from")
    ORDER BY h."effective_from" DESC
    LIMIT 1
  ), i."percentage_rate") / 100
, 4)
FROM "agent_ids" AS i
WHERE i.id = ia."identifier_id";
