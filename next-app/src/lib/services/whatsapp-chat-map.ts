import type { WhatsAppChatAck, WhatsAppChatMediaType } from "@prisma/client";

export type ChatMessageInput = {
  providerMessageId: string;
  chatJid: string;
  contactName?: string | null;
  isGroup?: boolean;
  fromMe: boolean;
  body?: string | null;
  mediaType?: WhatsAppChatMediaType | string | null;
  mediaFilename?: string | null;
  ack?: WhatsAppChatAck | string | null;
  timestamp: string | number | Date;
  pushName?: string | null;
};

export const MEDIA_TYPES = ["TEXT", "IMAGE", "VIDEO", "AUDIO", "DOCUMENT", "STICKER", "LOCATION", "CONTACT", "UNKNOWN"] as const;
export const ACKS = ["PENDING", "SENT", "DELIVERED", "READ", "FAILED"] as const;

export function digitsOfJid(jid: string) {
  return String(jid || "").split("@")[0].split(":")[0];
}

/** Map a stored phone/recipient (+91… or raw digits) to a WhatsApp user jid. */
export function chatJidFromRecipient(recipient: string) {
  const digits = String(recipient || "").replace(/\D/g, "");
  return digits ? `${digits}@s.whatsapp.net` : "";
}

export function isGroupJid(jid: string) {
  return String(jid || "").endsWith("@g.us");
}

export function asMediaType(value: string | null | undefined): WhatsAppChatMediaType {
  const upper = String(value || "TEXT").toUpperCase();
  return (MEDIA_TYPES as readonly string[]).includes(upper) ? upper as WhatsAppChatMediaType : "UNKNOWN";
}

export function asAck(value: string | null | undefined, fromMe: boolean): WhatsAppChatAck {
  const raw = String(value || "").toUpperCase();
  if (raw === "SERVER_ACK" || raw === "SENT") return "SENT";
  if (raw === "DELIVERY_ACK" || raw === "DELIVERED") return "DELIVERED";
  if (raw === "READ" || raw === "PLAYED") return "READ";
  if (raw === "ERROR" || raw === "FAILED") return "FAILED";
  if (raw === "PENDING" || raw === "PENDING_ACK") return "PENDING";
  return fromMe ? "SENT" : "DELIVERED";
}

export function messageTimestamp(value: string | number | Date) {
  if (value instanceof Date) return value;
  if (typeof value === "number") return new Date(value < 10_000_000_000 ? value * 1000 : value);
  const asNumber = Number(value);
  if (Number.isFinite(asNumber) && String(value).trim() !== "" && !String(value).includes("T")) {
    return new Date(asNumber < 10_000_000_000 ? asNumber * 1000 : asNumber);
  }
  return new Date(value);
}

export function previewFor(mediaType: WhatsAppChatMediaType, body?: string | null, filename?: string | null) {
  const text = (body || "").trim();
  if (mediaType === "IMAGE") return text ? `📷 ${text}` : "📷 Photo";
  if (mediaType === "VIDEO") return text ? `🎥 ${text}` : "🎥 Video";
  if (mediaType === "AUDIO") return "🎤 Voice message";
  if (mediaType === "DOCUMENT") return `📄 ${filename || text || "Document"}`;
  if (mediaType === "STICKER") return "🎨 Sticker";
  if (mediaType === "LOCATION") return "📍 Location";
  if (mediaType === "CONTACT") return `👤 ${text || "Contact"}`;
  if (mediaType === "UNKNOWN") return text || "Message";
  return text || "";
}

/** Merge a batch of normalized messages by provider id (later records update body/ack). */
export function mergeByProviderId<T extends { providerMessageId: string }>(existing: T[], incoming: T[]) {
  const map = new Map<string, T>();
  for (const row of existing) map.set(row.providerMessageId, row);
  for (const row of incoming) {
    const previous = map.get(row.providerMessageId);
    map.set(row.providerMessageId, previous ? { ...previous, ...row } : row);
  }
  return [...map.values()];
}

export function displayName(chat: { name?: string | null; jid: string; isGroup?: boolean }) {
  if (chat.name?.trim()) return chat.name.trim();
  if (chat.isGroup) return "Group";
  const digits = digitsOfJid(chat.jid);
  return digits ? `+${digits}` : chat.jid;
}

