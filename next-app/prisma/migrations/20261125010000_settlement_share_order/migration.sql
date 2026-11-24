-- Company share is now the remainder after the upline share and the agent commission.
ALTER TABLE "settlements" DROP CONSTRAINT "settlements_amount_consistency";
UPDATE "settlements" SET "company_share" = "absolute_amount" - "agent_share" - "upline_share";
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_amount_consistency" CHECK ("absolute_amount" = abs("amount") AND "agent_share" >= 0 AND "company_share" >= 0 AND "upline_share" >= 0 AND ("agent_share" + "upline_share" + "company_share") = "absolute_amount");