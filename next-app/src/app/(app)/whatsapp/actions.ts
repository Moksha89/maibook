"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { ActionState } from "@/lib/actions/types";
import { requireCompanyAccess, requirePermission } from "@/lib/auth/permissions";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { normalizePhone } from "@/lib/domain/normalization";
import { initializeWhatsAppSession, logoutWhatsAppSession } from "@/lib/services/whatsapp-bridge";

async function defaultConnection() { return db.whatsAppConnection.upsert({ where: { name: "Primary" }, update: {}, create: { name: "Primary", sessionKey: randomUUID() } }); }

export async function initializeWhatsAppAction(): Promise<void> {
  await requirePermission("whatsapp.connect");
  const connection = await defaultConnection();
  await db.whatsAppConnection.update({ where: { id: connection.id }, data: { status: "INITIALIZING", lastError: null, qrCode: null } });
  try { await initializeWhatsAppSession(connection.sessionKey); }
  catch (error) { await db.whatsAppConnection.update({ where: { id: connection.id }, data: { status: "DISCONNECTED", lastError: error instanceof Error ? error.message : "Bridge initialization failed." } }); }
  revalidatePath("/whatsapp");
}

export async function logoutWhatsAppAction(): Promise<void> {
  await requirePermission("whatsapp.disconnect");
  const connection = await defaultConnection();
  try { await logoutWhatsAppSession(connection.sessionKey); } catch {}
  await db.whatsAppConnection.update({ where: { id: connection.id }, data: { status: "DISCONNECTED", phoneNumber: null, qrCode: null, qrExpiresAt: null } });
  revalidatePath("/whatsapp");
}

const deliverySchema = z.object({ reportId: z.string().uuid(), recipient: z.string().trim().min(8).max(30), mode: z.enum(["TEXT", "IMAGE", "BOTH"]) });

export async function queueWhatsAppDeliveryAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requirePermission("whatsapp.send");
  await requirePermission("reports.deliver");
  const parsed = deliverySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message };
  const session = await requireSession();
  const report = await db.generatedReport.findUnique({ where: { id: parsed.data.reportId } });
  if (!report?.companyId) return { status: "error", message: "The selected report is unavailable." };
  await requireCompanyAccess(report.companyId, "READ");
  const recipient = normalizePhone(parsed.data.recipient);
  const connection = await defaultConnection();
  if (process.env.WHATSAPP_DELIVERY_ENABLED !== "true") {
    await db.reportDelivery.create({ data: { reportId: report.id, mode: parsed.data.mode, recipient, status: "FAILED", lastError: "WhatsApp delivery is disabled in this environment." } });
    revalidatePath("/whatsapp");
    return { status: "error", message: "Delivery was recorded but not sent because WhatsApp is disabled in this environment." };
  }
  if (connection.status !== "CONNECTED") return { status: "error", message: "Connect WhatsApp before sending a report." };
  const delivery = await db.$transaction(async (tx) => {
    const record = await tx.reportDelivery.create({ data: { reportId: report.id, mode: parsed.data.mode, recipient } });
    await tx.whatsAppMessage.create({ data: { connectionId: connection.id, deliveryId: record.id, recipient, mode: parsed.data.mode } });
    await tx.job.create({ data: { type: "DELIVER_WHATSAPP", idempotencyKey: `whatsapp:${record.id}`, payload: { deliveryId: record.id, reportId: report.id, connectionId: connection.id } } });
    await tx.auditLog.create({ data: { actorId: session.userId, companyId: report.companyId!, action: "whatsapp.delivery.queue", entityType: "ReportDelivery", entityId: record.id, requestId: randomUUID(), newValues: { recipient, mode: parsed.data.mode } } });
    return record;
  });
  revalidatePath("/whatsapp");
  return { status: "success", message: `Delivery ${delivery.id.slice(0, 8)} queued.` };
}
