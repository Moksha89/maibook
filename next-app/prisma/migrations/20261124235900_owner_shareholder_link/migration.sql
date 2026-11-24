-- Owners assigned to a company are also that company's shareholders.
INSERT INTO "shareholders" ("id", "company_id", "name", "normalized_name", "percentage", "updated_at")
SELECT gen_random_uuid(), oc."company_id", o."name", o."normalized_name", oc."percentage", now()
FROM "owner_companies" oc JOIN "owners" o ON o."id" = oc."owner_id"
ON CONFLICT ("company_id", "normalized_name") DO NOTHING;
