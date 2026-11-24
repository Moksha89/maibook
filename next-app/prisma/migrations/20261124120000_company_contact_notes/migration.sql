-- Company contact details and internal notes (spec: company profile).
ALTER TABLE "companies" ADD COLUMN "contact_phone" TEXT, ADD COLUMN "contact_email" TEXT, ADD COLUMN "notes" TEXT;
