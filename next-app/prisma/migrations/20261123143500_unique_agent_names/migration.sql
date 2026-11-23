DROP INDEX IF EXISTS "agents_normalized_name_phone_key";
CREATE UNIQUE INDEX "agents_normalized_name_key" ON "agents"("normalized_name");
