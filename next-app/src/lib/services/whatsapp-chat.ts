import { randomUUID } from "node:crypto";
import "server-only";

import type { WhatsAppChatAck, WhatsAppChatDirection, WhatsAppChatMediaType } from "@prisma/client";

import { db } from "@/lib/db";
import { asAck, asMediaType, chatJidFromRecipient, isGroupJid, messageTimestamp, previewFor, type ChatMessageInput } from "./whatsapp-chat-map";

export * from "./whatsapp-chat-map";

export async function upsertChatMessages(connectionId: string, records: ChatMessageInput[]) {
  const valid = records.filter((row) => row.providerMessageId && row.chatJid);
  if (!valid.length) return { chats: 0, messages: 0 };
  let messages = 0;
  const touched = new Set<string>();
  for (const row of valid) {
    const fromMe = Boolean(row.fromMe);
    const direction: WhatsAppChatDirection = fromMe ? "OUT" : "IN";
    const mediaType = asMediaType(row.mediaType);
    const ack = asAck(row.ack, fromMe);
    const timestamp = messageTimestamp(row.timestamp);
    if (Number.isNaN(timestamp.getTime())) continue;
    const body = row.body ?? null;
    const preview = previewFor(mediaType, body, row.mediaFilename);
    const name = (row.contactName || row.pushName || "").trim() || null;
    const isGroup = row.isGroup ?? isGroupJid(row.chatJid);
    const chat = await db.whatsAppChat.upsert({
      where: { connectionId_jid: { connectionId, jid: row.chatJid } },
      create: {
        id: randomUUID(),
        connectionId,
        jid: row.chatJid,
        name,
        isGroup,
        lastMessageAt: timestamp,
        lastPreview: preview,
        lastDirection: direction,
        lastAck: ack,
        unreadCount: 0,
      },
      update: {
        ...(name ? { name } : {}),
        isGroup,
      },
    });
    touched.add(chat.id);
    const existing = await db.whatsAppChatMessage.findUnique({
      where: { connectionId_providerMessageId: { connectionId, providerMessageId: row.providerMessageId } },
    });
    if (existing) {
      await db.whatsAppChatMessage.update({
        where: { id: existing.id },
        data: {
          ...(body != null && body !== "" ? { body } : {}),
          ...(row.mediaFilename ? { mediaFilename: row.mediaFilename } : {}),
          mediaType,
          ack,
          pushName: row.pushName || name,
        },
      });
    } else {
      await db.whatsAppChatMessage.create({
        data: {
          id: randomUUID(),
          connectionId,
          chatId: chat.id,
          providerMessageId: row.providerMessageId,
          fromMe,
          direction,
          body,
          mediaType,
          mediaFilename: row.mediaFilename || null,
          ack,
          timestamp,
          pushName: row.pushName || name,
        },
      });
      if (!fromMe) await db.whatsAppChat.update({ where: { id: chat.id }, data: { unreadCount: { increment: 1 } } });
    }
    messages += 1;
  }
  for (const chatId of touched) await refreshChatSummary(chatId);
  return { chats: touched.size, messages };
}

export async function refreshChatSummary(chatId: string) {
  const last = await db.whatsAppChatMessage.findFirst({ where: { chatId }, orderBy: [{ timestamp: "desc" }, { createdAt: "desc" }] });
  if (!last) return;
  // Unread is maintained on insert and cleared when the thread is opened in this UI. Never send a WhatsApp read receipt from here.
  await db.whatsAppChat.update({
    where: { id: chatId },
    data: {
      lastMessageAt: last.timestamp,
      lastPreview: previewFor(last.mediaType, last.body, last.mediaFilename),
      lastDirection: last.direction,
      lastAck: last.ack,
      ...(last.fromMe ? { unreadCount: 0 } : {}),
    },
  });
}


/** Clear the local unread badge only. Does not send a WhatsApp read receipt. */
export async function clearLocalUnread(connectionId: string, jid: string) {
  await db.whatsAppChat.updateMany({ where: { connectionId, jid }, data: { unreadCount: 0 } });
}

export async function updateChatAck(connectionId: string, providerMessageId: string, ack: WhatsAppChatAck) {
  const message = await db.whatsAppChatMessage.findUnique({ where: { connectionId_providerMessageId: { connectionId, providerMessageId } } });
  if (!message) return false;
  await db.whatsAppChatMessage.update({ where: { id: message.id }, data: { ack } });
  await refreshChatSummary(message.chatId);
  return true;
}

export async function upsertChatMeta(connectionId: string, chats: { jid: string; name?: string | null; isGroup?: boolean }[]) {
  for (const chat of chats) {
    if (!chat.jid) continue;
    await db.whatsAppChat.upsert({
      where: { connectionId_jid: { connectionId, jid: chat.jid } },
      create: {
        id: randomUUID(),
        connectionId,
        jid: chat.jid,
        name: chat.name || null,
        isGroup: chat.isGroup ?? isGroupJid(chat.jid),
      },
      update: { ...(chat.name ? { name: chat.name } : {}), isGroup: chat.isGroup ?? isGroupJid(chat.jid) },
    });
  }
}

/** Seed chats from older outbound delivery rows that predate the chat tables. Idempotent by provider message id. */
export async function seedChatsFromDeliveries(connectionId: string) {
  const rows = await db.whatsAppMessage.findMany({
    where: { connectionId, providerMessageId: { not: null } },
    select: { providerMessageId: true, recipient: true, mode: true, status: true, sentAt: true, createdAt: true, deliveryId: true },
  });
  if (!rows.length) return { chats: 0, messages: 0 };
  const deliveries = rows.some((row) => row.deliveryId)
    ? await db.reportDelivery.findMany({
        where: { id: { in: rows.map((row) => row.deliveryId).filter((id): id is string => Boolean(id)) } },
        include: { report: { select: { type: true, format: true, company: { select: { name: true } } } } },
      })
    : [];
  const byDelivery = new Map(deliveries.map((row) => [row.id, row]));
  const records: ChatMessageInput[] = [];
  for (const row of rows) {
    const jid = chatJidFromRecipient(row.recipient);
    if (!jid || !row.providerMessageId) continue;
    const delivery = row.deliveryId ? byDelivery.get(row.deliveryId) : undefined;
    const report = delivery?.report;
    const label = report ? `${report.company?.name || "Company"} · ${report.type.replaceAll("_", " ")} · ${report.format}` : row.mode.replaceAll("_", " ");
    records.push({
      providerMessageId: row.providerMessageId,
      chatJid: jid,
      fromMe: true,
      body: label,
      mediaType: row.mode === "PDF" ? "DOCUMENT" : row.mode === "IMAGE" || row.mode === "BOTH" ? "IMAGE" : "TEXT",
      ack: row.status === "DELIVERED" ? "DELIVERED" : row.status === "FAILED" ? "FAILED" : row.status === "SENT" ? "SENT" : "PENDING",
      timestamp: row.sentAt ?? row.createdAt,
    });
  }
  return upsertChatMessages(connectionId, records);
}

export type BridgeChatMessage = ChatMessageInput;
export type BridgeChat = { jid: string; name?: string | null; isGroup?: boolean; messages?: BridgeChatMessage[] };

export async function importBridgeSnapshot(connectionId: string, snapshot: { chats?: BridgeChat[]; messages?: BridgeChatMessage[] }) {
  if (snapshot.chats?.length) await upsertChatMeta(connectionId, snapshot.chats);
  const records = [
    ...(snapshot.messages || []),
    ...(snapshot.chats || []).flatMap((chat) => (chat.messages || []).map((message) => ({ ...message, chatJid: message.chatJid || chat.jid, contactName: message.contactName || chat.name }))),
  ];
  return upsertChatMessages(connectionId, records);
}

export type OutboundRecordInput = {
  connectionId: string;
  recipient: string;
  providerMessageId: string;
  body?: string | null;
  mediaType?: WhatsAppChatMediaType;
  mediaFilename?: string | null;
  ack?: WhatsAppChatAck;
  timestamp?: Date;
};

export async function recordOutboundChatMessage(input: OutboundRecordInput) {
  const jid = chatJidFromRecipient(input.recipient);
  if (!jid) return;
  await upsertChatMessages(input.connectionId, [{
    providerMessageId: input.providerMessageId,
    chatJid: jid,
    fromMe: true,
    body: input.body || null,
    mediaType: input.mediaType || "TEXT",
    mediaFilename: input.mediaFilename || null,
    ack: input.ack || "SENT",
    timestamp: input.timestamp || new Date(),
  }]);
}


/** Pull the live bridge snapshot into the database, and occasionally request older history. Never sends a WhatsApp message or touches the session pairing. */
export async function refreshChatsFromBridge(connection: { id: string; sessionKey: string; status: string; lastHistorySyncAt: Date | null }) {
  const { listWhatsAppChats, syncWhatsAppHistory } = await import("./whatsapp-bridge");
  try {
    const listed = await listWhatsAppChats(connection.sessionKey);
    if (listed.chats?.length) await upsertChatMeta(connection.id, listed.chats);
    if (listed.messages?.length) await importBridgeSnapshot(connection.id, { messages: listed.messages as ChatMessageInput[] });
  } catch {
    /* The previous bridge build may not have the chat routes yet. */
  }
  const stale = !connection.lastHistorySyncAt || Date.now() - connection.lastHistorySyncAt.getTime() > 30 * 60_000;
  if (connection.status !== "CONNECTED" || !stale) return;
  try {
    const oldestByChat = await db.whatsAppChat.findMany({
      where: { connectionId: connection.id, messages: { some: {} } },
      take: 40,
      orderBy: { lastMessageAt: "desc" },
      include: { messages: { orderBy: { timestamp: "asc" }, take: 1 } },
    });
    const anchors = oldestByChat.flatMap((chat) => {
      const oldest = chat.messages[0];
      return oldest ? [{ jid: chat.jid, oldestMessageId: oldest.providerMessageId, oldestFromMe: oldest.fromMe, oldestTimestamp: oldest.timestamp.getTime() }] : [];
    });
    const synced = await syncWhatsAppHistory(connection.sessionKey, { anchors, limitPerChat: 50 });
    if (synced.chats?.length) await upsertChatMeta(connection.id, synced.chats);
    if (synced.messages?.length) await importBridgeSnapshot(connection.id, { messages: synced.messages as ChatMessageInput[] });
  } catch {
    /* History request is best-effort; Load earlier can retry a single chat. */
  }
  await db.whatsAppConnection.update({ where: { id: connection.id }, data: { lastHistorySyncAt: new Date() } });
}

export async function requestEarlierMessages(connection: { id: string; sessionKey: string }, jid: string) {
  const { syncWhatsAppHistory, listWhatsAppChatMessages } = await import("./whatsapp-bridge");
  const oldest = await db.whatsAppChatMessage.findFirst({ where: { connectionId: connection.id, chat: { jid } }, orderBy: { timestamp: "asc" } });
  await syncWhatsAppHistory(connection.sessionKey, {
    jid,
    limitPerChat: 50,
    force: true,
    oldestMessageId: oldest?.providerMessageId,
    oldestFromMe: oldest?.fromMe,
    oldestTimestamp: oldest?.timestamp.getTime(),
  });
  await new Promise((resolve) => setTimeout(resolve, 2500));
  try {
    const listed = await listWhatsAppChatMessages(connection.sessionKey, jid, { limit: 500 });
    await importBridgeSnapshot(connection.id, { messages: (listed.messages || []) as ChatMessageInput[] });
  } catch {
    /* The webhook will persist history events as they arrive. */
  }
}
