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
const logger = pino({ level: process.env.LOG_LEVEL || "warn" });
const log = (...args) => console.log(new Date().toISOString(), ...args);

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
  const sock = makeWASocket({ auth, version, logger, browser: Browsers.ubuntu("Maibook"), printQRInTerminal: false, markOnlineOnConnect: false, syncFullHistory: false, generateHighQualityLinkPreview: false });
  state.sock = sock;
  sock.ev.on("creds.update", saveCreds);
  sock.ev.on("connection.update", async (update) => {
    if (state.sock !== sock) return;
    const { connection, lastDisconnect, qr } = update;
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

async function sendMessage(sessionKey, body) {
  const state = sessions.get(sessionKey);
  if (!state?.sock || state.status !== "CONNECTED") { const error = new Error("WhatsApp is not connected. Scan the QR code first."); error.status = 409; throw error; }
  const number = String(body.recipient || "").replace(/\D/g, "");
  if (number.length < 8 || number.length > 15) { const error = new Error("Recipient must be an international phone number."); error.status = 400; throw error; }
  const lookup = await state.sock.onWhatsApp(`${number}@s.whatsapp.net`);
  const hit = lookup?.find((entry) => entry.exists);
  if (!hit) { const error = new Error(`+${number} is not registered on WhatsApp.`); error.status = 422; throw error; }
  const text = typeof body.text === "string" && body.text.trim() ? body.text : undefined;
  let result;
  if (body.imageBase64) {
    const image = Buffer.from(String(body.imageBase64).replace(/^data:[^,]+,/, ""), "base64");
    if (!image.length || image.length > 15 * 1024 * 1024) { const error = new Error("Invalid or oversized image."); error.status = 400; throw error; }
    result = await state.sock.sendMessage(hit.jid, { image, caption: text, fileName: body.imageFilename || "report.png" });
  } else if (text) {
    result = await state.sock.sendMessage(hit.jid, { text });
  } else { const error = new Error("Nothing to send: provide text or an image."); error.status = 400; throw error; }
  return { messageId: result?.key?.id || "unknown" };
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
    const match = /^\/v1\/sessions\/([^/]+)\/(initialize|logout|messages)$/.exec(url.pathname);
    if (request.method !== "POST" || !match) return send(404, { error: "Not found" });
    const sessionKey = decodeURIComponent(match[1]);
    if (!validKey(sessionKey)) return send(400, { error: "Invalid session key" });
    if (match[2] === "initialize") {
      const state = await startSession(sessionKey);
      return send(200, { status: state.status, ...(state.qr ? { qrCode: state.qr } : {}), ...(state.phone ? { phoneNumber: `+${state.phone}` } : {}) });
    }
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
