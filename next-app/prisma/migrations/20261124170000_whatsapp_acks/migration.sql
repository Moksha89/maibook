-- WhatsApp acknowledgements: SENT = accepted by WhatsApp's servers, DELIVERED = reached the recipient's phone.
ALTER TYPE "DeliveryStatus" ADD VALUE IF NOT EXISTS 'DELIVERED';
ALTER TYPE "ReportDeliveryMode" ADD VALUE IF NOT EXISTS 'PDF';
ALTER TABLE "report_deliveries" ADD COLUMN IF NOT EXISTS "delivered_at" TIMESTAMPTZ(6);
ALTER TABLE "whatsapp_messages" ADD COLUMN IF NOT EXISTS "delivered_at" TIMESTAMPTZ(6);
