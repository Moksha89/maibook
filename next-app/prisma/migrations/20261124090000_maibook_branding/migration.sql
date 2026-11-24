-- Rename the visible product brand from iBook to Maibook.
UPDATE "application_settings"
SET "value" = jsonb_set("value", '{title}', '"Maibook"'::jsonb)
WHERE "key" = 'site.branding' AND lower("value"->>'title') = 'ibook';
