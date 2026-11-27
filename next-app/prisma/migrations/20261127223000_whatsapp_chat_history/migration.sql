CREATE TYPE "WhatsAppChatDirection" AS ENUM ('IN', 'OUT');
CREATE TYPE "WhatsAppChatMediaType" AS ENUM ('TEXT', 'IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT', 'STICKER', 'LOCATION', 'CONTACT', 'UNKNOWN');
CREATE TYPE "WhatsAppChatAck" AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED');

ALTER TABLE "whatsapp_connections" ADD COLUMN IF NOT EXISTS "last_history_sync_at" TIMESTAMPTZ(6);

CREATE TABLE "whatsapp_chats" (
    "id" UUID NOT NULL,
    "connection_id" UUID NOT NULL,
    "jid" TEXT NOT NULL,
    "name" TEXT,
    "is_group" BOOLEAN NOT NULL DEFAULT false,
    "last_message_at" TIMESTAMPTZ(6),
    "last_preview" TEXT,
    "last_direction" "WhatsAppChatDirection",
    "last_ack" "WhatsAppChatAck",
    "unread_count" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "whatsapp_chats_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "whatsapp_chat_messages" (
    "id" UUID NOT NULL,
    "connection_id" UUID NOT NULL,
    "chat_id" UUID NOT NULL,
    "provider_message_id" TEXT NOT NULL,
    "from_me" BOOLEAN NOT NULL,
    "direction" "WhatsAppChatDirection" NOT NULL,
    "body" TEXT,
    "media_type" "WhatsAppChatMediaType" NOT NULL DEFAULT 'TEXT',
    "media_filename" TEXT,
    "ack" "WhatsAppChatAck" NOT NULL DEFAULT 'SENT',
    "timestamp" TIMESTAMPTZ(6) NOT NULL,
    "push_name" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "whatsapp_chat_messages_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "whatsapp_chats_connection_id_jid_key" ON "whatsapp_chats"("connection_id", "jid");
CREATE INDEX "whatsapp_chats_connection_id_last_message_at_idx" ON "whatsapp_chats"("connection_id", "last_message_at");
CREATE UNIQUE INDEX "whatsapp_chat_messages_connection_id_provider_message_id_key" ON "whatsapp_chat_messages"("connection_id", "provider_message_id");
CREATE INDEX "whatsapp_chat_messages_chat_id_timestamp_idx" ON "whatsapp_chat_messages"("chat_id", "timestamp");

ALTER TABLE "whatsapp_chats" ADD CONSTRAINT "whatsapp_chats_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "whatsapp_connections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "whatsapp_chat_messages" ADD CONSTRAINT "whatsapp_chat_messages_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "whatsapp_connections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "whatsapp_chat_messages" ADD CONSTRAINT "whatsapp_chat_messages_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "whatsapp_chats"("id") ON DELETE CASCADE ON UPDATE CASCADE;
