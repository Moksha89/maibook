import { hashToken } from "@/lib/auth/crypto";
import { db } from "@/lib/db";

const statuses = new Set(["DISCONNECTED", "INITIALIZING", "QR_READY", "CONNECTED", "FAILED"]);
export async function POST(request: Request) {
  const configured = process.env.WHATSAPP_BRIDGE_TOKEN;
  const provided = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!configured || !provided || hashToken(configured) !== hashToken(provided)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json() as { sessionKey?: string; status?: string; qrCode?: string; phoneNumber?: string; error?: string };
  if (!body.sessionKey || !body.status || !statuses.has(body.status)) return Response.json({ error: "Invalid payload" }, { status: 400 });
  const connection = await db.whatsAppConnection.findUnique({ where: { sessionKey: body.sessionKey } });
  if (!connection) return Response.json({ error: "Session not found" }, { status: 404 });
  await db.whatsAppConnection.update({ where: { id: connection.id }, data: { status: body.status as "DISCONNECTED" | "INITIALIZING" | "QR_READY" | "CONNECTED" | "FAILED", qrCode: body.qrCode || (body.status === "QR_READY" ? connection.qrCode : null), qrExpiresAt: body.status === "QR_READY" ? new Date(Date.now() + 60_000) : null, phoneNumber: body.phoneNumber || connection.phoneNumber, lastConnectedAt: body.status === "CONNECTED" ? new Date() : connection.lastConnectedAt, lastError: body.error || null } });
  return Response.json({ ok: true });
}
