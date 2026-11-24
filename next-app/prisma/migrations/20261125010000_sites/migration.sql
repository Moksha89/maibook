CREATE TABLE "sites" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "normalized_name" TEXT NOT NULL,
    "upline_percentage" DECIMAL(7,4) NOT NULL,
    "upline_group_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "sites_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "sites_normalized_name_key" ON "sites"("normalized_name");
CREATE INDEX "sites_upline_group_id_idx" ON "sites"("upline_group_id");
ALTER TABLE "sites" ADD CONSTRAINT "sites_upline_group_id_fkey" FOREIGN KEY ("upline_group_id") REFERENCES "upline_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;
