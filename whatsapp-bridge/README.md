# Maibook WhatsApp bridge

Small private service that owns the WhatsApp Web session (Baileys) and implements `docs/WHATSAPP_BRIDGE_CONTRACT.md`.

Environment: `BRIDGE_TOKEN` (same value as the app's `WHATSAPP_BRIDGE_TOKEN`), `BRIDGE_PORT` (3110), `BRIDGE_HOST` (127.0.0.1),
`APP_WEBHOOK_URL` (default `http://127.0.0.1:3100/api/internal/whatsapp/webhook`), `SESSIONS_DIR` (persistent auth state).

Run: `npm install && BRIDGE_TOKEN=… node server.mjs`. Pair from the app's WhatsApp page → Connect → scan the QR with WhatsApp → Linked devices.
