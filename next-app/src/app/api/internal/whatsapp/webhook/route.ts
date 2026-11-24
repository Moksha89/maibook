import { hashToken } from "@/lib/auth/crypto";
import { db } from "@/lib/db";
import { z } from "zod";

const payloadSchema = z.object({
  sessionKey: z.string().min(1).max(200),
  status: z.enum(["DISCONNECTED", "INITIALIZING", "QR_READY", "CONNECTED", "FAILED"]).optional(),
  messageId: z.string().min(4).max(100).optional(),
  messageStatus: z.enum(["SERVER_ACK", "DELIVERY_ACK", "ERROR"]).optional(),
  qrCode: z.string().max(16_000).optional(),
  phoneNumber: z.string().max(40).optional(),
  error: z.string().max(2_000).optional(),
});
export async function POST(request: Request) {
  const configured = process.env.WHATSAPP_BRIDGE_TOKEN;
  const provided = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!configured || !provided || hashToken(configured) !== hashToken(provided)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = payloadSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid payload" }, { status: 400 });
  const body = parsed.data;
  if (body.messageId && body.messageStatus) {
    // Receipts from WhatsApp itself: DELIVERY_ACK means the message reached the recipient's phone.
    const message = await db.whatsAppMessage.findFirst({ where: { providerMessageId: body.messageId } });
    if (!message) return Response.json({ ok: true, ignored: true });
    if (body.messageStatus === "DELIVERY_ACK") {
      const now = new Date();
      await db.$transaction([
        db.whatsAppMessage.update({ where: { id: message.id }, data: { status: "DELIVERED", deliveredAt: now } }),
        ...(message.deliveryId ? [db.reportDelivery.update({ where: { id: message.deliveryId }, data: { status: "DELIVERED", deliveredAt: now } })] : []),
      ]);
    } else if (body.messageStatus === "ERROR" && message.status !== "DELIVERED") {
      const lastError = body.error || "WhatsApp reported that the message could not be delivered.";
      await db.$transaction([
        db.whatsAppMessage.update({ where: { id: message.id }, data: { status: "FAILED", lastError } }),
        ...(message.deliveryId ? [db.reportDelivery.update({ where: { id: message.deliveryId }, data: { status: "FAILED", lastError } })] : []),
      ]);
    }
    return Response.json({ ok: true });
  }
  if (!body.status) return Response.json({ error: "Invalid payload" }, { status: 400 });
  const connection = await db.whatsAppConnection.findUnique({ where: { sessionKey: body.sessionKey } });
  if (!connection) return Response.json({ error: "Session not found" }, { status: 404 });
  await db.whatsAppConnection.update({ where: { id: connection.id }, data: { status: body.status as "DISCONNECTED" | "INITIALIZING" | "QR_READY" | "CONNECTED" | "FAILED", qrCode: body.qrCode || (body.status === "QR_READY" ? connection.qrCode : null), qrExpiresAt: body.status === "QR_READY" ? new Date(Date.now() + 60_000) : null, phoneNumber: body.phoneNumber || connection.phoneNumber, lastConnectedAt: body.status === "CONNECTED" ? new Date() : connection.lastConnectedAt, lastError: body.error || null } });
  return Response.json({ ok: true });
}
