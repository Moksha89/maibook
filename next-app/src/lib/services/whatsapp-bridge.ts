import "server-only";

interface BridgeResponse { status?: string; phoneNumber?: string; qrCode?: string; error?: string; messageId?: string }

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

export async function sendWhatsAppReport(sessionKey: string, payload: { recipient: string; text?: string; imageBase64?: string; imageFilename?: string }) {
  const { url, token } = config();
  const response = await fetch(`${url}/v1/sessions/${encodeURIComponent(sessionKey)}/messages`, { method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify(payload), signal: AbortSignal.timeout(30_000) });
  const body = await response.json().catch(() => ({})) as BridgeResponse;
  if (!response.ok) throw new Error(body.error || `WhatsApp bridge returned ${response.status}.`);
  return body;
}
