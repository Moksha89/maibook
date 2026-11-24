ALTER TABLE "agent_ids" ADD COLUMN "site_id" UUID;
CREATE INDEX "agent_ids_site_id_idx" ON "agent_ids"("site_id");
ALTER TABLE "agent_ids" ADD CONSTRAINT "agent_ids_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE SET NULL ON UPDATE CASCADE;
