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
