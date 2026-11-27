# Maibook WhatsApp bridge contract

Maibook never talks to WhatsApp directly. It calls a private "bridge" service that owns the
WhatsApp Web session. The application side is implemented in
`next-app/src/lib/services/whatsapp-bridge.ts`, the status webhook in
`next-app/src/app/api/internal/whatsapp/webhook/route.ts` and the delivery job in
`next-app/src/worker/jobs.ts`. Delivery stays off until `WHATSAPP_DELIVERY_ENABLED=true`,
`WHATSAPP_BRIDGE_URL` and `WHATSAPP_BRIDGE_TOKEN` are set and a phone has been paired by scanning the QR code.

All requests carry `Authorization: Bearer <WHATSAPP_BRIDGE_TOKEN>`.

## Maibook → bridge

| Call | Purpose | Response |
| --- | --- | --- |
| `POST {BRIDGE_URL}/v1/sessions/{sessionKey}/initialize` | Start (or resume) the session and begin QR pairing | `200 { status }` |
| `POST {BRIDGE_URL}/v1/sessions/{sessionKey}/logout` | Close the session and forget the pairing | `200 { status }` |
| `POST {BRIDGE_URL}/v1/sessions/{sessionKey}/messages` | Send one report | `200 { messageId }` |
| `GET {BRIDGE_URL}/v1/sessions/{sessionKey}/chats` | List chats known to the live session (read-only) | `200 { chats }` |
| `GET {BRIDGE_URL}/v1/sessions/{sessionKey}/chats/{jid}/messages` | List stored messages for one chat (read-only) | `200 { messages }` |
| `POST {BRIDGE_URL}/v1/sessions/{sessionKey}/sync-history` | Ask WhatsApp for older messages in known chats. Does not send a message, log out, or relink. | `200 { historyRequested, chats, messages }` |

`messages` body: `{ "recipient": "+919999999999", "text"?: string, "imageBase64"?: string, "imageFilename"?: string }`.
Errors are `4xx/5xx` with `{ "error": "message" }`; the worker retries with exponential back-off
(bounded by `max_attempts`) and never re-sends a delivery already recorded as `SENT`.

## Bridge → Maibook

`POST {APP_URL}/api/internal/whatsapp/webhook` with the same bearer token and body:

```json
{ "sessionKey": "…", "status": "INITIALIZING | QR_READY | CONNECTED | DISCONNECTED | FAILED",
  "qrCode": "raw QR payload (QR_READY only)", "phoneNumber": "…", "error": "…" }
```

The WhatsApp page refreshes every three seconds while the status is `INITIALIZING` or `QR_READY`,
so the QR code appears automatically. A QR code is valid for about 60 seconds.

## What the operator must provide

1. A bridge service implementing the contract (for example built on whatsapp-web.js or Baileys) with a persistent session volume.
2. `WHATSAPP_BRIDGE_URL` and `WHATSAPP_BRIDGE_TOKEN` in the app environment.
3. A phone to scan the QR code from WhatsApp → Linked devices.
4. Flip `WHATSAPP_DELIVERY_ENABLED=true` only after the above.

## Chat history

The bridge keeps an in-memory store of chats and messages from Baileys events (`messages.upsert`, `messaging-history.set`, `chats.*`, `contacts.*`) and posts them to the same webhook as `{ "event": "chat_messages", "messages": [ ... ] }` or `{ "event": "chats", "chats": [ ... ] }`.

Maibook persists every inbound and outbound message (jid, contact name, direction, text or caption, media type, timestamp, ack status) in `whatsapp_chats` / `whatsapp_chat_messages`, keyed uniquely by `(connection, providerMessageId)` so history imports are idempotent.

How far back history goes depends on WhatsApp, not Maibook. On a later reconnect with `syncFullHistory: true`, WhatsApp may send a history snapshot through `messaging-history.set`. `fetchMessageHistory` can then page backward 50 messages at a time from the oldest message already known in a chat. Full history is usually only offered around the first pairing of a linked device; this app previously used `syncFullHistory: false` and did not store what was sent, so older chats may be incomplete until WhatsApp provides them. The Web WhatsApp tab does not send messages and does not mark chats as read on WhatsApp itself.
