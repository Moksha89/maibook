import { hashToken } from "@/lib/auth/crypto";
import { db } from "@/lib/db";
import { z } from "zod";

const payloadSchema = z.object({
  sessionKey: z.string().min(1).max(200),
  status: z.enum(["DISCONNECTED", "INITIALIZING", "QR_READY", "CONNECTED", "FAILED"]),
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
  const connection = await db.whatsAppConnection.findUnique({ where: { sessionKey: body.sessionKey } });
  if (!connection) return Response.json({ error: "Session not found" }, { status: 404 });
  await db.whatsAppConnection.update({ where: { id: connection.id }, data: { status: body.status as "DISCONNECTED" | "INITIALIZING" | "QR_READY" | "CONNECTED" | "FAILED", qrCode: body.qrCode || (body.status === "QR_READY" ? connection.qrCode : null), qrExpiresAt: body.status === "QR_READY" ? new Date(Date.now() + 60_000) : null, phoneNumber: body.phoneNumber || connection.phoneNumber, lastConnectedAt: body.status === "CONNECTED" ? new Date() : connection.lastConnectedAt, lastError: body.error || null } });
  return Response.json({ ok: true });
}
