import "server-only";

interface BridgeResponse { status?: string; phoneNumber?: string; qrCode?: string; error?: string; messageId?: string; ack?: string; jid?: string }

function config() {
  const url = process.env.WHATSAPP_BRIDGE_URL?.replace(/\/$/, "");
  const token = process.env.WHATSAPP_BRIDGE_TOKEN;
  if (!url || !token || process.env.WHATSAPP_DELIVERY_ENABLED !== "true") throw new Error("WhatsApp delivery is disabled or the private bridge is not configured.");
  return { url, token };
}

async function bridgeRequest(sessionKey: string, action: "initialize" | "logout") {
  const { url, token } = config();
  const response = await fetch(`${url}/v1/sessions/${encodeURIComponent(sessionKey)}/${action}`, { method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, signal: AbortSignal.timeout(10_000) });
  const body = await response.json().catch(() => ({})) as BridgeResponse;
  if (!response.ok) throw new Error(body.error || `WhatsApp bridge returned ${response.status}.`);
  return body;
}

export function initializeWhatsAppSession(sessionKey: string) { return bridgeRequest(sessionKey, "initialize"); }
export function logoutWhatsAppSession(sessionKey: string) { return bridgeRequest(sessionKey, "logout"); }

export async function sendWhatsAppReport(sessionKey: string, payload: { recipient: string; text?: string; imageBase64?: string; imageFilename?: string; documentBase64?: string; documentFilename?: string; documentMimetype?: string }) {
  const { url, token } = config();
  const response = await fetch(`${url}/v1/sessions/${encodeURIComponent(sessionKey)}/messages`, { method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify(payload), signal: AbortSignal.timeout(60_000) });
  const body = await response.json().catch(() => ({})) as BridgeResponse;
  if (!response.ok) throw new Error(body.error || `WhatsApp bridge returned ${response.status}.`);
  return body;
}

/** Live status of one session as the bridge itself sees it (the database copy can be stale after a restart). */
export async function whatsAppSessionStatus(sessionKey: string): Promise<string> {
  const { url } = config();
  try {
    const response = await fetch(`${url}/health`, { signal: AbortSignal.timeout(4000), cache: "no-store" });
    const body = await response.json() as { sessions?: { key: string; status: string }[] };
    return body.sessions?.find((entry) => sessionKey.startsWith(entry.key))?.status ?? "DISCONNECTED";
  } catch { return "UNREACHABLE"; }
}

export type BridgeChatRow = {
  jid: string;
  name?: string | null;
  isGroup?: boolean;
  lastMessageAt?: number | null;
  lastPreview?: string;
  lastDirection?: string | null;
  lastAck?: string | null;
  unreadCount?: number;
  messages?: Record<string, unknown>[];
};

async function bridgeGet(path: string) {
  const { url, token } = config();
  const response = await fetch(`${url}${path}`, { headers: { authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(8_000), cache: "no-store" });
  const body = await response.json().catch(() => ({})) as { error?: string; chats?: BridgeChatRow[]; messages?: Record<string, unknown>[]; jid?: string };
  if (!response.ok) throw new Error(body.error || `WhatsApp bridge returned ${response.status}.`);
  return body;
}

/** Read-only chat list from the live bridge process. Does not send messages or change the session. */
export async function listWhatsAppChats(sessionKey: string) {
  return bridgeGet(`/v1/sessions/${encodeURIComponent(sessionKey)}/chats`);
}

export async function listWhatsAppChatMessages(sessionKey: string, jid: string, opts?: { limit?: number; before?: number }) {
  const query = new URLSearchParams();
  if (opts?.limit) query.set("limit", String(opts.limit));
  if (opts?.before) query.set("before", String(opts.before));
  const suffix = query.size ? `?${query}` : "";
  return bridgeGet(`/v1/sessions/${encodeURIComponent(sessionKey)}/chats/${encodeURIComponent(jid)}/messages${suffix}`);
}

/** Ask the already-connected session to page backward for older messages. Never logs out or sends a chat message. */
export async function syncWhatsAppHistory(sessionKey: string, body?: { jid?: string; limitPerChat?: number; force?: boolean; oldestMessageId?: string; oldestFromMe?: boolean; oldestTimestamp?: number; anchors?: { jid: string; oldestMessageId: string; oldestFromMe?: boolean; oldestTimestamp?: number }[] }) {
  const { url, token } = config();
  const response = await fetch(`${url}/v1/sessions/${encodeURIComponent(sessionKey)}/sync-history`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify(body || {}),
    signal: AbortSignal.timeout(20_000),
  });
  const json = await response.json().catch(() => ({})) as { error?: string; chats?: BridgeChatRow[]; messages?: Record<string, unknown>[]; historyRequested?: number };
  if (!response.ok) throw new Error(json.error || `WhatsApp bridge returned ${response.status}.`);
  return json;
}
