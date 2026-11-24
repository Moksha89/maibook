// Maibook WhatsApp bridge — implements docs/WHATSAPP_BRIDGE_CONTRACT.md on top of Baileys.
// Listens on localhost only. Sessions persist under SESSIONS_DIR (one folder per sessionKey).
import http from "node:http";
import { timingSafeEqual } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";
import pino from "pino";
import makeWASocket, { Browsers, DisconnectReason, fetchLatestBaileysVersion, useMultiFileAuthState } from "@whiskeysockets/baileys";

const TOKEN = process.env.BRIDGE_TOKEN || "";
const HOST = process.env.BRIDGE_HOST || "127.0.0.1";
const PORT = Number(process.env.BRIDGE_PORT || 3110);
const WEBHOOK = process.env.APP_WEBHOOK_URL || "http://127.0.0.1:3100/api/internal/whatsapp/webhook";
const SESSIONS_DIR = path.resolve(process.env.SESSIONS_DIR || "./sessions");
/** Outgoing 1:1 message stanzas (tags and attributes only; payload text is stripped) make addressing problems visible in the journal. */
export const sanitizeStanza = (xml) => String(xml).replace(/>[^<]{12,}</g, ">…<").replace(/\d{6}(?=\d{4}[@:])/g, "******").slice(0, 1500);
const wantStanzas = process.env.LOG_STANZAS !== "0";
const logger = pino({
  level: wantStanzas ? "trace" : (process.env.LOG_LEVEL || "warn"),
  hooks: {
    logMethod(args, method, level) {
      if (level >= 40) return method.apply(this, args);
      if (wantStanzas && level === 10 && args[0] && typeof args[0] === "object" && args[0].msg === "xml send" && typeof args[0].xml === "string" && args[0].xml.startsWith("<message")) {
        console.log(new Date().toISOString(), "outgoing", sanitizeStanza(args[0].xml));
      }
    },
  },
});
const log = (...args) => console.log(new Date().toISOString(), ...args);

// libsignal prints whole session objects (including key material) with console.info/warn; keep those out of the journal.
for (const level of ["info", "warn"]) {
  const original = console[level].bind(console);
  console[level] = (...args) => {
    if (typeof args[0] === "string" && /^(Closing|Opening|Removing|Migrating|Session already|Failed to decrypt|Bad MAC|No matching sessions)/.test(args[0])) { original(args[0].slice(0, 80)); return; }
    original(...args);
  };
}

/** Delivery receipts by WhatsApp message id: PENDING -> SERVER_ACK (WhatsApp accepted) -> DELIVERY_ACK (reached a phone) -> READ. */
const ACK_NAMES = { 0: "ERROR", 1: "PENDING", 2: "SERVER_ACK", 3: "DELIVERY_ACK", 4: "READ", 5: "READ" };
const acks = new Map();
const ackWaiters = new Map();
function recordAck(sessionKey, id, code, extra = {}) {
  if (!id) return;
  const name = ACK_NAMES[code] || String(code);
  const previous = acks.get(id);
  if (previous && previous.code >= code && code !== 0) return;
  acks.set(id, { code, status: name, at: new Date().toISOString(), ...extra });
  if (acks.size > 500) acks.delete(acks.keys().next().value);
  log("ack", id.slice(0, 8), name, extra.error || "");
  ackWaiters.get(id)?.forEach((fn) => fn());
  if (code !== 1) notify(sessionKey, { messageId: id, messageStatus: name === "READ" ? "DELIVERY_ACK" : name, ...(extra.error ? { error: extra.error } : {}) });
}
function waitForAck(id, minCode, ms) {
  return new Promise((resolve) => {
    const check = () => { const a = acks.get(id); if (a && (a.code >= minCode || a.code === 0)) { cleanup(); resolve(a); } };
    const timer = setTimeout(() => { cleanup(); resolve(acks.get(id) || null); }, ms);
    const cleanup = () => { clearTimeout(timer); const list = ackWaiters.get(id) || []; ackWaiters.set(id, list.filter((fn) => fn !== check)); if (!ackWaiters.get(id).length) ackWaiters.delete(id); };
    ackWaiters.set(id, [...(ackWaiters.get(id) || []), check]); check();
  });
}

if (!TOKEN || TOKEN.length < 16) { console.error("BRIDGE_TOKEN (>=16 chars) is required."); process.exit(1); }
mkdirSync(SESSIONS_DIR, { recursive: true, mode: 0o700 });

/** @type {Map<string, {sock: any, status: string, qr?: string, phone?: string, retries: number, stopping: boolean, timer?: NodeJS.Timeout}>} */
const sessions = new Map();
const validKey = (key) => /^[A-Za-z0-9_-]{1,100}$/.test(key);
const dirFor = (key) => path.join(SESSIONS_DIR, key);

async function notify(sessionKey, payload, attempt = 1) {
  try {
    const response = await fetch(WEBHOOK, { method: "POST", headers: { authorization: `Bearer ${TOKEN}`, "content-type": "application/json" }, body: JSON.stringify({ sessionKey, ...payload }), signal: AbortSignal.timeout(8000) });
    if (!response.ok && response.status >= 500 && attempt < 4) throw new Error(`webhook ${response.status}`);
    if (!response.ok && response.status !== 404) log("webhook rejected", response.status);
  } catch (error) {
    if (attempt < 4) { await new Promise((resolve) => setTimeout(resolve, 1500 * attempt)); return notify(sessionKey, payload, attempt + 1); }
    log("webhook failed", String(error?.message || error));
  }
}

function digitsOf(jid) { return String(jid || "").split("@")[0].split(":")[0]; }

async function startSession(sessionKey) {
  let state = sessions.get(sessionKey);
  if (state?.sock && state.status !== "DISCONNECTED") return state;
  state = { sock: null, status: "INITIALIZING", retries: 0, stopping: false };
  sessions.set(sessionKey, state);
  await connect(sessionKey, state);
  return state;
}

async function connect(sessionKey, state) {
  const { state: auth, saveCreds } = await useMultiFileAuthState(dirFor(sessionKey));
  let version;
  try { version = (await fetchLatestBaileysVersion()).version; } catch { /* use bundled default */ }
  log("whatsapp web version", Array.isArray(version) ? version.join(".") : "bundled default");
  const sock = makeWASocket({ auth, version, logger, browser: Browsers.ubuntu("Maibook"), printQRInTerminal: false, markOnlineOnConnect: false, syncFullHistory: false, generateHighQualityLinkPreview: false });
  state.sock = sock;
  sock.ev.on("creds.update", saveCreds);
  // Raw protocol acknowledgements (attributes only, never message content) so delivery problems can be diagnosed from the journal.
  sock.ws.on("CB:ack,class:message", (node) => {
    const { id, error, phash } = node.attrs || {};
    log("server ack", String(id).slice(0, 8), error ? `error=${error}` : "ok", phash ? `phash=${phash}` : "no-phash", `from=${String(node.attrs?.from || "").replace(/\d{6}(?=\d{4}[@:])/, "******")}`);
    if (id && error) recordAck(sessionKey, id, 0, { error: `WhatsApp rejected the message (error ${error}).` });
    else if (id) recordAck(sessionKey, id, 2);
  });
  // Protocol diagnostics: node names and attributes only (never bodies or key material) for delivery related stanzas.
  const originalEmit = sock.ws.emit.bind(sock.ws);
  sock.ws.emit = (event, ...args) => {
    if (typeof event === "string" && /^CB:(receipt|ack|failure|notification|stream:error)$/.test(event)) {
      const attrs = args[0]?.attrs || {};
      if (event !== "CB:ack" || attrs.error || attrs.class !== "message") log("node", event.slice(0, 60), JSON.stringify(Object.fromEntries(Object.entries(attrs).slice(0, 8).map(([k, v]) => [k, String(v).replace(/\d{6}(?=\d{4}[@:])/g, "******").slice(0, 60)]))));
    }
    return originalEmit(event, ...args);
  };
  sock.ws.on("CB:receipt", (node) => log("receipt", String(node.attrs?.id).slice(0, 8), node.attrs?.type || "delivery", String(node.attrs?.from || "").replace(/\d{6}(?=\d{4}@)/, "******")));
  sock.ev.on("messages.update", (updates) => {
    for (const { key, update } of updates) {
      if (!key?.fromMe || update?.status === undefined) continue;
      recordAck(sessionKey, key.id, update.status, update.status === 0 ? { error: "WhatsApp reported a send error." } : {});
    }
  });
  sock.ev.on("message-receipt.update", (updates) => {
    for (const { key, receipt } of updates) {
      if (!key?.fromMe) continue;
      if (receipt?.receiptTimestamp || receipt?.readTimestamp || receipt?.playedTimestamp) recordAck(sessionKey, key.id, receipt.readTimestamp ? 4 : 3);
    }
  });
  sock.ev.on("connection.update", async (update) => {
    if (state.sock !== sock) return;
    const { connection, lastDisconnect, qr, reachoutTimeLock } = update;
    if (reachoutTimeLock) log("reachout timelock", JSON.stringify(reachoutTimeLock));
    if (qr) { state.status = "QR_READY"; state.qr = qr; await notify(sessionKey, { status: "QR_READY", qrCode: qr }); }
    if (connection === "open") {
      state.status = "CONNECTED"; state.qr = undefined; state.retries = 0; state.phone = digitsOf(sock.user?.id);
      log("connected", sessionKey, state.phone);
      await notify(sessionKey, { status: "CONNECTED", phoneNumber: state.phone ? `+${state.phone}` : undefined });
    }
    if (connection === "close") {
      const code = lastDisconnect?.error?.output?.statusCode;
      state.sock = null;
      if (state.stopping) return;
      if (code === DisconnectReason.loggedOut) {
        state.status = "DISCONNECTED"; rmSync(dirFor(sessionKey), { recursive: true, force: true });
        sessions.delete(sessionKey);
        await notify(sessionKey, { status: "DISCONNECTED", error: "The phone logged this device out." });
        return;
      }
      // 515 "restart required" follows a successful QR scan; everything else is retried with back-off.
      const delay = code === DisconnectReason.restartRequired ? 500 : Math.min(30000, 2000 * 2 ** state.retries++);
      if (state.retries > 8) { state.status = "FAILED"; await notify(sessionKey, { status: "FAILED", error: `Connection closed (code ${code ?? "unknown"}).` }); return; }
      state.status = "INITIALIZING";
      state.timer = setTimeout(() => connect(sessionKey, state).catch((error) => log("reconnect failed", String(error?.message || error))), delay);
    }
  });
}

async function logoutSession(sessionKey) {
  const state = sessions.get(sessionKey);
  if (state) {
    state.stopping = true; clearTimeout(state.timer);
    try { await state.sock?.logout(); } catch { try { state.sock?.end(undefined); } catch { /* ignore */ } }
    sessions.delete(sessionKey);
  }
  rmSync(dirFor(sessionKey), { recursive: true, force: true });
  await notify(sessionKey, { status: "DISCONNECTED" });
  return { status: "DISCONNECTED" };
}

const maskId = (id) => (id ? String(id).replace(/\d{6}(?=\d{4}[@:])/, "******") : null);
async function diagnostics(sessionKey, body) {
  const state = sessions.get(sessionKey);
  if (!state?.sock || state.status !== "CONNECTED") { const error = new Error("WhatsApp is not connected."); error.status = 409; throw error; }
  const sock = state.sock; const out = { status: state.status, user: digitsOf(sock.user?.id).replace(/\d{6}(?=\d{4}$)/, "******"), hasLid: Boolean(sock.user?.lid), ownLid: maskId(sock.user?.lid) };
  const attempt = async (name, fn) => { try { out[name] = await fn(); } catch (error) { out[name] = { error: String(error?.message || error).slice(0, 200) }; } };
  await attempt("reachoutTimelock", () => sock.fetchAccountReachoutTimelock());
  await attempt("newChatCap", () => sock.fetchNewChatMessageCap());
  const number = String(body.recipient || "").replace(/\D/g, "");
  if (number) {
    const jid = `${number}@s.whatsapp.net`;
    await attempt("onWhatsApp", async () => (await sock.onWhatsApp(jid))?.map((e) => ({ exists: e.exists, jidType: String(e.jid).split("@")[1], lid: Boolean(e.lid) })));
    await attempt("devices", async () => (await sock.getUSyncDevices([jid], false, false)).map((d) => ({ user: d.user.slice(-4), device: d.device, server: d.server, jid: String(d.jid || "").split("@")[1] })));
    await attempt("lidMapping", async () => maskId(await sock.signalRepository.lidMapping.getLIDForPN(jid)));
    if (body.presence) await attempt("presence", async () => {
      const seen = []; const onPresence = (event) => { for (const [who, value] of Object.entries(event.presences || {})) seen.push({ who: maskId(who), presence: value.lastKnownPresence, lastSeen: value.lastSeen ?? null }); };
      sock.ev.on("presence.update", onPresence);
      try { await sock.presenceSubscribe(jid); await new Promise((resolve) => setTimeout(resolve, 8000)); } finally { sock.ev.off("presence.update", onPresence); }
      return seen;
    });
    await attempt("tctoken", async () => {
      const lid = await sock.signalRepository.lidMapping.getLIDForPN(jid);
      const keys = [lid, jid].filter(Boolean); const found = {};
      for (const key of keys) { const data = await sock.authState.keys.get("tctoken", [key]); const entry = data?.[key]; found[key.split("@")[1]] = entry ? { present: true, timestamp: entry.timestamp ?? null, senderTimestamp: entry.senderTimestamp ?? null } : { present: false }; }
      return found;
    });
  }
  return out;
}

async function sendMessage(sessionKey, body) {
  const state = sessions.get(sessionKey);
  if (!state?.sock || state.status !== "CONNECTED") { const error = new Error("WhatsApp is not connected. Scan the QR code first."); error.status = 409; throw error; }
  const number = String(body.recipient || "").replace(/\D/g, "");
  if (number.length < 8 || number.length > 15) { const error = new Error("Recipient must be an international phone number."); error.status = 400; throw error; }
  const lookup = await state.sock.onWhatsApp(`${number}@s.whatsapp.net`);
  const hit = lookup?.find((entry) => entry.exists);
  if (!hit) { const error = new Error(`+${number} is not registered on WhatsApp.`); error.status = 422; throw error; }
  log("send to", `${number.slice(0, 4)}******${number.slice(-2)}`, "jid-type", String(hit.jid).split("@")[1], "lid", hit.lid ? "yes" : "no");
  const text = typeof body.text === "string" && body.text.trim() ? body.text : undefined;
  let result;
  if (body.documentBase64) {
    const document = Buffer.from(String(body.documentBase64).replace(/^data:[^,]+,/, ""), "base64");
    if (!document.length || document.length > 25 * 1024 * 1024) { const error = new Error("Invalid or oversized document."); error.status = 400; throw error; }
    const fileName = String(body.documentFilename || "report.pdf").replace(/[^\w.\- ]+/g, "_").slice(0, 100);
    result = await state.sock.sendMessage(hit.jid, { document, mimetype: String(body.documentMimetype || "application/pdf"), fileName, caption: text });
  } else if (body.imageBase64) {
    const image = Buffer.from(String(body.imageBase64).replace(/^data:[^,]+,/, ""), "base64");
    if (!image.length || image.length > 15 * 1024 * 1024) { const error = new Error("Invalid or oversized image."); error.status = 400; throw error; }
    result = await state.sock.sendMessage(hit.jid, { image, caption: text, fileName: body.imageFilename || "report.png" });
  } else if (text) {
    result = await state.sock.sendMessage(hit.jid, { text });
  } else { const error = new Error("Nothing to send: provide text, an image or a document."); error.status = 400; throw error; }
  const messageId = result?.key?.id || "unknown";
  recordAck(sessionKey, messageId, 1);
  // sendMessage() only means the frame was written to the socket. Wait for WhatsApp's own acknowledgement.
  const ack = await waitForAck(messageId, 2, 25_000);
  if (!ack || ack.code < 2) { const error = new Error("WhatsApp did not acknowledge the message within 25 seconds. It was not delivered."); error.status = 504; throw error; }
  return { messageId, ack: ack.status, jid: hit.jid };
}

function authorised(request) {
  const given = Buffer.from((request.headers.authorization || "").replace(/^Bearer\s+/i, ""));
  const expected = Buffer.from(TOKEN);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    const chunks = []; let size = 0;
    request.on("data", (chunk) => { size += chunk.length; if (size > 25 * 1024 * 1024) { reject(Object.assign(new Error("Payload too large"), { status: 413 })); request.destroy(); } else chunks.push(chunk); });
    request.on("end", () => { try { resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString("utf8")) : {}); } catch { reject(Object.assign(new Error("Invalid JSON"), { status: 400 })); } });
    request.on("error", reject);
  });
}

const server = http.createServer(async (request, response) => {
  const send = (status, body) => { response.writeHead(status, { "content-type": "application/json" }); response.end(JSON.stringify(body)); };
  try {
    const url = new URL(request.url || "/", "http://localhost");
    if (request.method === "GET" && url.pathname === "/health") return send(200, { ok: true, sessions: [...sessions].map(([key, value]) => ({ key: key.slice(0, 8), status: value.status })) });
    if (!authorised(request)) return send(401, { error: "Unauthorized" });
    const status = /^\/v1\/messages\/([A-Za-z0-9]{6,64})$/.exec(url.pathname);
    if (request.method === "GET" && status) return send(200, acks.get(status[1]) || { status: "UNKNOWN" });
    const match = /^\/v1\/sessions\/([^/]+)\/(initialize|logout|messages|diagnostics)$/.exec(url.pathname);
    if (request.method !== "POST" || !match) return send(404, { error: "Not found" });
    const sessionKey = decodeURIComponent(match[1]);
    if (!validKey(sessionKey)) return send(400, { error: "Invalid session key" });
    if (match[2] === "initialize") {
      const state = await startSession(sessionKey);
      return send(200, { status: state.status, ...(state.qr ? { qrCode: state.qr } : {}), ...(state.phone ? { phoneNumber: `+${state.phone}` } : {}) });
    }
    if (match[2] === "diagnostics") return send(200, await diagnostics(sessionKey, await readJson(request)));
    if (match[2] === "logout") return send(200, await logoutSession(sessionKey));
    return send(200, await sendMessage(sessionKey, await readJson(request)));
  } catch (error) {
    log("request error", String(error?.message || error));
    send(error?.status || 500, { error: error?.message || "Internal error" });
  }
});

server.listen(PORT, HOST, () => {
  log(`maibook-whatsapp-bridge listening on ${HOST}:${PORT}, sessions in ${SESSIONS_DIR}`);
  // Resume every paired session after a restart.
  for (const entry of existsSync(SESSIONS_DIR) ? readdirSync(SESSIONS_DIR, { withFileTypes: true }) : []) {
    if (entry.isDirectory() && validKey(entry.name) && existsSync(path.join(SESSIONS_DIR, entry.name, "creds.json"))) {
      startSession(entry.name).catch((error) => log("resume failed", entry.name.slice(0, 8), String(error?.message || error)));
    }
  }
});

for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => { for (const state of sessions.values()) { state.stopping = true; try { state.sock?.end(undefined); } catch { /* ignore */ } } server.close(() => process.exit(0)); setTimeout(() => process.exit(0), 3000).unref(); });
