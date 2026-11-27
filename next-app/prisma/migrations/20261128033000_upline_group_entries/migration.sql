CREATE TYPE "UplineGroupEntryDirection" AS ENUM ('RECEIVED', 'PAID');

ALTER TABLE "upline_groups" ADD COLUMN IF NOT EXISTS "current_balance" DECIMAL(30, 8) NOT NULL DEFAULT 0;

CREATE TABLE "upline_group_entries" (
    "id" UUID NOT NULL,
    "group_id" UUID NOT NULL,
    "direction" "UplineGroupEntryDirection" NOT NULL,
    "amount" DECIMAL(30, 8) NOT NULL,
    "remarks" TEXT,
    "created_by_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),
    CONSTRAINT "upline_group_entries_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "upline_group_entries_group_id_created_at_deleted_at_idx" ON "upline_group_entries"("group_id", "created_at", "deleted_at");

ALTER TABLE "upline_group_entries" ADD CONSTRAINT "upline_group_entries_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "upline_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
