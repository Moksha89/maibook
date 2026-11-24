"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { ActionState } from "@/lib/actions/types";
import { requireCompanyAccess, requirePermission } from "@/lib/auth/permissions";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { normalizePhone } from "@/lib/domain/normalization";
import { initializeWhatsAppSession, logoutWhatsAppSession, whatsAppSessionStatus } from "@/lib/services/whatsapp-bridge";

async function defaultConnection() { return db.whatsAppConnection.upsert({ where: { name: "Primary" }, update: {}, create: { name: "Primary", sessionKey: randomUUID() } }); }

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function initializeWhatsAppAction(_formData?: FormData): Promise<void> {
  await requirePermission("whatsapp.connect");
  const connection = await defaultConnection();
  await db.whatsAppConnection.update({ where: { id: connection.id }, data: { status: "INITIALIZING", lastError: null, qrCode: null } });
  try { await initializeWhatsAppSession(connection.sessionKey); }
  catch (error) { await db.whatsAppConnection.update({ where: { id: connection.id }, data: { status: "DISCONNECTED", lastError: error instanceof Error ? error.message : "Bridge initialization failed." } }); }
  revalidatePath("/whatsapp");
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function logoutWhatsAppAction(_formData?: FormData): Promise<void> {
  await requirePermission("whatsapp.disconnect");
  const connection = await defaultConnection();
  try { await logoutWhatsAppSession(connection.sessionKey); } catch {}
  await db.whatsAppConnection.update({ where: { id: connection.id }, data: { status: "DISCONNECTED", phoneNumber: null, qrCode: null, qrExpiresAt: null } });
  revalidatePath("/whatsapp");
}

const deliverySchema = z.object({ reportId: z.string().uuid(), recipient: z.string().trim().min(8).max(600), mode: z.enum(["TEXT", "IMAGE", "BOTH"]) });

export async function queueWhatsAppDeliveryAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requirePermission("whatsapp.send");
  await requirePermission("reports.deliver");
  const parsed = deliverySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message };
  const session = await requireSession();
  const report = await db.generatedReport.findUnique({ where: { id: parsed.data.reportId } });
  if (!report?.companyId) return { status: "error", message: "The selected report is unavailable." };
  await requireCompanyAccess(report.companyId, "READ");
  // Several numbers may be pasted at once, separated by commas, semicolons, or new lines.
  const recipients = [...new Set(parsed.data.recipient.split(/[\s,;]+/).map((value) => normalizePhone(value)).filter(Boolean))];
  if (!recipients.length || recipients.length > 20) return { status: "error", message: "Enter between 1 and 20 WhatsApp numbers." };
  if (recipients.some((number) => number.replace(/\D/g, "").length < 8 || number.replace(/\D/g, "").length > 15)) return { status: "error", message: "Each WhatsApp number needs 8 to 15 digits including the country code." };
  const connection = await defaultConnection();
  if (process.env.WHATSAPP_DELIVERY_ENABLED !== "true") {
    await db.reportDelivery.createMany({ data: recipients.map((recipient) => ({ reportId: report.id, mode: parsed.data.mode, recipient, status: "FAILED" as const, lastError: "WhatsApp delivery is disabled in this environment." })) });
    revalidatePath("/whatsapp");
    return { status: "error", message: "Deliveries were recorded but not sent because WhatsApp is disabled in this environment." };
  }
  if (connection.status !== "CONNECTED") return { status: "error", message: "Connect WhatsApp before sending a report." };
  const live = await whatsAppSessionStatus(connection.sessionKey);
  if (live === "UNREACHABLE") return { status: "error", message: "The WhatsApp service is not responding right now. Nothing was queued; try again in a minute." };
  if (live !== "CONNECTED") return { status: "error", message: "WhatsApp is not connected on the server. Open the WhatsApp page, press Initialize and scan the QR code again." };
  const queued = await db.$transaction(async (tx) => {
    const records = [];
    for (const recipient of recipients) {
      const record = await tx.reportDelivery.create({ data: { reportId: report.id, mode: parsed.data.mode, recipient } });
      await tx.whatsAppMessage.create({ data: { connectionId: connection.id, deliveryId: record.id, recipient, mode: parsed.data.mode } });
      await tx.job.create({ data: { type: "DELIVER_WHATSAPP", idempotencyKey: `whatsapp:${record.id}`, payload: { deliveryId: record.id, reportId: report.id, connectionId: connection.id } } });
      await tx.auditLog.create({ data: { actorId: session.userId, companyId: report.companyId!, action: "whatsapp.delivery.queue", entityType: "ReportDelivery", entityId: record.id, requestId: randomUUID(), newValues: { recipient, mode: parsed.data.mode } } });
      records.push(record);
    }
    return records;
  });
  revalidatePath("/whatsapp");
  return { status: "success", message: queued.length === 1 ? `Delivery ${queued[0].id.slice(0, 8)} queued.` : `${queued.length} deliveries queued.` };
}

/** Re-queues one failed delivery; deliveries already marked SENT are never resent. */
export async function retryWhatsAppDeliveryAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requirePermission("whatsapp.send");
  await requirePermission("reports.deliver");
  const deliveryId = String(formData.get("deliveryId") || "");
  const session = await requireSession();
  const delivery = await db.reportDelivery.findUnique({ where: { id: deliveryId }, include: { report: true } });
  if (!delivery?.report.companyId) return { status: "error", message: "This delivery is unavailable." };
  await requireCompanyAccess(delivery.report.companyId, "READ");
  if (delivery.status !== "FAILED") return { status: "error", message: "Only failed deliveries can be retried." };
  if (process.env.WHATSAPP_DELIVERY_ENABLED !== "true") return { status: "error", message: "WhatsApp delivery is disabled in this environment." };
  const connection = await defaultConnection();
  if (connection.status !== "CONNECTED") return { status: "error", message: "Connect WhatsApp before retrying." };
  const attempt = delivery.attemptCount + 1;
  await db.$transaction(async (tx) => {
    await tx.reportDelivery.update({ where: { id: delivery.id }, data: { status: "QUEUED", lastError: null, nextAttemptAt: null } });
    const existing = await tx.whatsAppMessage.findFirst({ where: { deliveryId: delivery.id } });
    if (existing) await tx.whatsAppMessage.update({ where: { id: existing.id }, data: { status: "QUEUED", lastError: null } });
    else await tx.whatsAppMessage.create({ data: { connectionId: connection.id, deliveryId: delivery.id, recipient: delivery.recipient, mode: delivery.mode } });
    await tx.job.create({ data: { type: "DELIVER_WHATSAPP", idempotencyKey: `whatsapp:${delivery.id}:retry:${attempt}:${Date.now()}`, payload: { deliveryId: delivery.id, reportId: delivery.reportId, connectionId: connection.id } } });
    await tx.auditLog.create({ data: { actorId: session.userId, companyId: delivery.report.companyId!, action: "whatsapp.delivery.retry", entityType: "ReportDelivery", entityId: delivery.id, requestId: randomUUID() } });
  });
  revalidatePath("/whatsapp");
  return { status: "success", message: "Delivery re-queued." };
}
