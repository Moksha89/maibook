-- Expense module: company-only expenses (amount, category, remarks), soft-deleted and never removed, charged to shareholders by percentage.
ALTER TYPE "ShareholderEntrySource" ADD VALUE IF NOT EXISTS 'EXPENSE';
ALTER TYPE "ReportType" ADD VALUE IF NOT EXISTS 'COMPANY_PNL';

CREATE TABLE "expenses" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "amount" DECIMAL(30,8) NOT NULL,
    "expense_date" DATE NOT NULL,
    "category" TEXT NOT NULL,
    "remarks" TEXT,
    "created_by_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by_id" UUID,
    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "expenses_amount_positive" CHECK ("amount" > 0)
);
CREATE INDEX "expenses_company_id_deleted_at_expense_date_idx" ON "expenses"("company_id", "deleted_at", "expense_date");
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Shareholder entries created by an expense point back to it so edits and deletes can reverse them.
ALTER TABLE "shareholder_entries" ADD COLUMN "expense_id" UUID;
CREATE INDEX "shareholder_entries_expense_id_idx" ON "shareholder_entries"("expense_id");
ALTER TABLE "shareholder_entries" ADD CONSTRAINT "shareholder_entries_expense_id_fkey" FOREIGN KEY ("expense_id") REFERENCES "expenses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Permissions (same grants as the seed: superadmin and admin get all; manager gets read/create/update).
INSERT INTO "permissions" ("id", "key", "module", "action")
SELECT gen_random_uuid(), 'expenses.' || a, 'expenses', a FROM unnest(ARRAY['read', 'create', 'update', 'delete']) AS a
ON CONFLICT ("key") DO NOTHING;
INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT r."id", p."id" FROM "roles" r JOIN "permissions" p ON p."module" = 'expenses'
WHERE r."key" IN ('superadmin', 'admin') OR (r."key" = 'manager' AND p."action" IN ('read', 'create', 'update'))
ON CONFLICT DO NOTHING;
