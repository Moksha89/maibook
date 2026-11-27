// In-memory chat store and Baileys event helpers for the Web WhatsApp view.
// Does not log out, send messages, or mark chats as read.

const ACK_FROM_CODE = { 0: "FAILED", 1: "PENDING", 2: "SENT", 3: "DELIVERED", 4: "READ", 5: "READ" };
const stores = new Map();
const lastHistoryFetch = new Map();

export function storeFor(sessionKey) {
  if (!stores.has(sessionKey)) stores.set(sessionKey, { chats: new Map(), messages: new Map(), contacts: new Map() });
  return stores.get(sessionKey);
}

export function digitsOfJid(jid) {
  return String(jid || "").split("@")[0].split(":")[0];
}

export function isGroupJid(jid) {
  return String(jid || "").endsWith("@g.us");
}

export function chatName(store, jid, fallback) {
  const chat = store.chats.get(jid);
  const contact = store.contacts.get(jid);
  return (chat?.name || contact?.name || fallback || "").trim() || null;
}

/** Pull a displayable body and media type from a Baileys message object. */
export function extractContent(message) {
  const raw = message?.message || message || {};
  const inner = raw.ephemeralMessage?.message || raw.viewOnceMessage?.message || raw.viewOnceMessageV2?.message || raw.documentWithCaptionMessage?.message || raw;
  if (inner.conversation) return { text: inner.conversation, type: "TEXT" };
  if (inner.extendedTextMessage?.text) return { text: inner.extendedTextMessage.text, type: "TEXT" };
  if (inner.imageMessage) return { text: inner.imageMessage.caption || "", type: "IMAGE", filename: inner.imageMessage.fileName };
  if (inner.videoMessage) return { text: inner.videoMessage.caption || "", type: "VIDEO", filename: inner.videoMessage.fileName };
  if (inner.audioMessage) return { text: "", type: "AUDIO" };
  if (inner.documentMessage) return { text: inner.documentMessage.caption || "", type: "DOCUMENT", filename: inner.documentMessage.fileName };
  if (inner.stickerMessage) return { text: "", type: "STICKER" };
  if (inner.locationMessage || inner.liveLocationMessage) {
    const loc = inner.locationMessage || inner.liveLocationMessage;
    const label = [loc?.name, loc?.address].filter(Boolean).join(" · ");
    return { text: label, type: "LOCATION" };
  }
  if (inner.contactMessage) return { text: inner.contactMessage.displayName || "", type: "CONTACT" };
  if (inner.contactsArrayMessage) return { text: inner.contactsArrayMessage.displayName || "Contacts", type: "CONTACT" };
  return null;
}

export function shouldSkipMessage(message) {
  const raw = message?.message || {};
  if (raw.protocolMessage && !raw.conversation && !raw.extendedTextMessage && !raw.imageMessage && !raw.documentMessage) return true;
  if (raw.reactionMessage || raw.senderKeyDistributionMessage || raw.pollUpdateMessage) return true;
  if (message?.messageStubType && !message?.message) return true;
  return false;
}

export function normalizedFromWaMessage(store, message, extra = {}) {
  const key = message?.key || {};
  const id = key.id;
  const jid = key.remoteJid || extra.chatJid;
  if (!id || !jid || jid === "status@broadcast") return null;
  if (shouldSkipMessage(message) && !extra.body) return null;
  const fromMe = Boolean(key.fromMe);
  const content = extractContent(message) || (extra.body != null ? { text: extra.body, type: extra.mediaType || "TEXT", filename: extra.mediaFilename } : { text: "", type: "UNKNOWN" });
  const timestamp = message.messageTimestamp ?? extra.timestamp ?? Date.now();
  const tsMs = typeof timestamp === "number" && timestamp < 10_000_000_000 ? timestamp * 1000 : Number(timestamp);
  const pushName = message.pushName || extra.pushName || null;
  const name = chatName(store, jid, pushName);
  return {
    providerMessageId: id,
    chatJid: jid,
    contactName: name,
    isGroup: isGroupJid(jid),
    fromMe,
    direction: fromMe ? "OUT" : "IN",
    body: content.text || "",
    mediaType: content.type,
    mediaFilename: content.filename || null,
    ack: extra.ack || ACK_FROM_CODE[message.status] || (fromMe ? "SENT" : "DELIVERED"),
    timestamp: Number.isFinite(tsMs) ? tsMs : Date.now(),
    pushName,
  };
}

function rememberMessage(store, record, raw) {
  if (!record) return null;
  const previous = store.messages.get(record.providerMessageId);
  const merged = previous ? { ...previous, ...record, body: record.body || previous.body } : record;
  if (raw) merged.raw = raw.message || raw;
  store.messages.set(record.providerMessageId, merged);
  if (!store.chats.has(record.chatJid)) {
    store.chats.set(record.chatJid, { jid: record.chatJid, name: record.contactName, isGroup: record.isGroup, unreadCount: 0 });
  }
  const chat = store.chats.get(record.chatJid);
  if (record.contactName && !chat.name) chat.name = record.contactName;
  const newer = !chat.lastMessageAt || record.timestamp >= chat.lastMessageAt;
  if (newer) {
    chat.lastMessageAt = record.timestamp;
    chat.lastPreview = record.body;
    chat.lastDirection = record.direction;
    chat.lastAck = record.ack;
  }
  return merged;
}

function rememberContact(store, contact) {
  const jid = contact.id || contact.jid;
  if (!jid) return;
  const name = (contact.name || contact.notify || contact.verifiedName || contact.verifiedBizName || "").trim();
  const previous = store.contacts.get(jid) || { jid };
  store.contacts.set(jid, { ...previous, name: name || previous.name });
  const chat = store.chats.get(jid);
  if (chat && name && !chat.name) chat.name = name;
}

function rememberChat(store, chat) {
  const jid = chat.id || chat.jid;
  if (!jid || jid === "status@broadcast") return;
  const previous = store.chats.get(jid) || { jid, isGroup: isGroupJid(jid), unreadCount: 0 };
  const name = (chat.name || chat.subject || previous.name || "").trim() || previous.name;
  const lastTs = Number(chat.conversationTimestamp || 0);
  store.chats.set(jid, {
    ...previous,
    name,
    isGroup: previous.isGroup || isGroupJid(jid),
    lastMessageAt: previous.lastMessageAt || (lastTs ? (lastTs < 10_000_000_000 ? lastTs * 1000 : lastTs) : previous.lastMessageAt),
    unreadCount: typeof chat.unreadCount === "number" ? chat.unreadCount : previous.unreadCount,
  });
}

export function listChats(sessionKey) {
  const store = storeFor(sessionKey);
  const byChat = new Map();
  for (const message of store.messages.values()) {
    const list = byChat.get(message.chatJid) || [];
    list.push(message);
    byChat.set(message.chatJid, list);
  }
  return [...store.chats.values()].map((chat) => {
    const messages = (byChat.get(chat.jid) || []).slice().sort((a, b) => a.timestamp - b.timestamp);
    const last = messages[messages.length - 1];
    return {
      jid: chat.jid,
      name: chatName(store, chat.jid, chat.name),
      isGroup: Boolean(chat.isGroup),
      lastMessageAt: last?.timestamp || chat.lastMessageAt || null,
      lastPreview: last?.body || chat.lastPreview || "",
      lastDirection: last?.direction || chat.lastDirection || null,
      lastAck: last?.ack || chat.lastAck || null,
      unreadCount: chat.unreadCount || 0,
      messageCount: messages.length,
    };
  }).sort((a, b) => (b.lastMessageAt || 0) - (a.lastMessageAt || 0));
}

export function listMessages(sessionKey, jid, { limit = 200, before } = {}) {
  const store = storeFor(sessionKey);
  let rows = [...store.messages.values()].filter((row) => row.chatJid === jid).sort((a, b) => a.timestamp - b.timestamp);
  if (before) rows = rows.filter((row) => row.timestamp < Number(before));
  if (rows.length > limit) rows = rows.slice(-limit);
  return rows.map(({ raw, ...row }) => row);
}

export function getRawMessage(sessionKey, id) {
  return storeFor(sessionKey).messages.get(id)?.raw;
}

export function applyMessageUpdate(sessionKey, key, update) {
  if (!key?.id) return null;
  const store = storeFor(sessionKey);
  const current = store.messages.get(key.id);
  if (!current) return null;
  if (update?.status !== undefined) current.ack = ACK_FROM_CODE[update.status] || current.ack;
  return current;
}

function payloadOf(record) {
  const { raw, ...rest } = record;
  return rest;
}

export function attachChatHandlers(sock, sessionKey, notify) {
  const store = storeFor(sessionKey);
  const flush = [];
  let timer;
  const queue = (record) => {
    if (!record) return;
    flush.push(payloadOf(record));
    clearTimeout(timer);
    timer = setTimeout(() => {
      const messages = flush.splice(0, flush.length);
      if (messages.length) notify(sessionKey, { event: "chat_messages", messages });
    }, 250);
  };

  sock.ev.on("contacts.upsert", (contacts) => {
    for (const contact of contacts || []) rememberContact(store, contact);
  });
  sock.ev.on("contacts.update", (contacts) => {
    for (const contact of contacts || []) rememberContact(store, contact);
  });
  sock.ev.on("chats.upsert", (chats) => {
    for (const chat of chats || []) rememberChat(store, chat);
    notify(sessionKey, { event: "chats", chats: listChats(sessionKey) });
  });
  sock.ev.on("chats.update", (chats) => {
    for (const chat of chats || []) rememberChat(store, chat);
  });
  sock.ev.on("chats.set", ({ chats } = {}) => {
    for (const chat of chats || []) rememberChat(store, chat);
    notify(sessionKey, { event: "chats", chats: listChats(sessionKey) });
  });
  sock.ev.on("messages.upsert", ({ messages, type }) => {
    for (const message of messages || []) {
      const record = rememberMessage(store, normalizedFromWaMessage(store, message), message);
      if (record && type !== "prepend") queue(record);
    }
  });
  sock.ev.on("messaging-history.set", ({ messages, chats, contacts }) => {
    for (const contact of contacts || []) rememberContact(store, contact);
    for (const chat of chats || []) rememberChat(store, chat);
    const batch = [];
    for (const message of messages || []) {
      const record = rememberMessage(store, normalizedFromWaMessage(store, message), message);
      if (record) batch.push(payloadOf(record));
    }
    for (let i = 0; i < batch.length; i += 100) {
      notify(sessionKey, { event: "chat_messages", messages: batch.slice(i, i + 100), source: "history" });
    }
    if (chats?.length) notify(sessionKey, { event: "chats", chats: listChats(sessionKey) });
  });
  sock.ev.on("messages.update", (updates) => {
    for (const { key, update } of updates || []) {
      const record = applyMessageUpdate(sessionKey, key, update);
      if (record && update?.status !== undefined) {
        notify(sessionKey, { event: "message_ack", messageId: key.id, messageStatus: record.ack });
      }
    }
  });
}

export async function syncHistory(sock, sessionKey, { jid, oldestMessageId, oldestFromMe, oldestTimestamp, anchors = [], limitPerChat = 50, maxChats = 40, force = false } = {}) {
  const store = storeFor(sessionKey);
  const chats = jid ? listChats(sessionKey).filter((chat) => chat.jid === jid) : listChats(sessionKey).slice(0, maxChats);
  if (jid && !chats.some((chat) => chat.jid === jid)) chats.push({ jid, isGroup: isGroupJid(jid) });
  const anchorByJid = new Map();
  if (oldestMessageId && jid) anchorByJid.set(jid, { providerMessageId: oldestMessageId, fromMe: Boolean(oldestFromMe), timestamp: Number(oldestTimestamp) || Date.now() });
  for (const anchor of anchors || []) {
    if (!anchor?.jid || !anchor.oldestMessageId) continue;
    anchorByJid.set(anchor.jid, { providerMessageId: anchor.oldestMessageId, fromMe: Boolean(anchor.oldestFromMe), timestamp: Number(anchor.oldestTimestamp) || Date.now() });
    if (!chats.some((chat) => chat.jid === anchor.jid)) chats.push({ jid: anchor.jid, isGroup: isGroupJid(anchor.jid) });
  }
  const started = [];
  const skipped = [];
  const now = Date.now();
  for (const chat of chats) {
    const messages = [...store.messages.values()].filter((row) => row.chatJid === chat.jid).sort((a, b) => a.timestamp - b.timestamp);
    const oldest = messages[0] || anchorByJid.get(chat.jid) || null;
    if (!oldest) { skipped.push(chat.jid); continue; }
    const last = lastHistoryFetch.get(`${sessionKey}:${chat.jid}`) || 0;
    if (!force && now - last < 10 * 60 * 1000) { skipped.push(chat.jid); continue; }
    lastHistoryFetch.set(`${sessionKey}:${chat.jid}`, now);
    try {
      await sock.fetchMessageHistory(Math.min(50, Math.max(1, limitPerChat)), {
        remoteJid: chat.jid,
        id: oldest.providerMessageId,
        fromMe: oldest.fromMe,
      }, Math.floor(oldest.timestamp / 1000));
      started.push(chat.jid);
    } catch (error) {
      skipped.push(chat.jid);
      lastHistoryFetch.delete(`${sessionKey}:${chat.jid}`);
    }
  }
  return { chats: chats.length, messages: store.messages.size, historyRequested: started.length, skipped: skipped.length };
}

export function snapshot(sessionKey) {
  return { chats: listChats(sessionKey), messages: listMessagesAll(sessionKey) };
}

function listMessagesAll(sessionKey) {
  const store = storeFor(sessionKey);
  return [...store.messages.values()].map(({ raw, ...row }) => row).sort((a, b) => a.timestamp - b.timestamp);
}
