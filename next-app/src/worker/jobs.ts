import { Job, Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "../lib/db";
import { loadReportTable, type ReportParameters, type ReportTable } from "../lib/services/report-data";
import { sendEmail } from "../lib/services/email";
import { renderPdf, renderPng, reportFileName } from "../lib/services/report-render";
import { getBranding } from "../lib/services/branding";
import { sendWhatsAppReport } from "../lib/services/whatsapp-bridge";

const whatsappPayload = z.object({ deliveryId: z.string().uuid(), connectionId: z.string().uuid() });
const emailPayload = z.object({ to: z.email(), subject: z.string().min(1), text: z.string() });

export class UnsupportedJobError extends Error {}

function reportText(table: ReportTable) {
  return [table.title, table.subtitle, "", table.columns.join(" | "), ...table.rows.map((row) => row.join(" | "))].join("\n");
}

export async function claimJob(workerId: string) {
  return db.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<{ id: string }[]>`
      SELECT id FROM jobs WHERE status = 'PENDING' AND run_after <= NOW()
      AND attempt_count < max_attempts ORDER BY created_at, id
      FOR UPDATE SKIP LOCKED LIMIT 1`;
    if (!rows[0]) return null;
    return tx.job.update({ where: { id: rows[0].id }, data: {
      status: "RUNNING", lockedAt: new Date(), lockedBy: workerId, attemptCount: { increment: 1 },
    } });
  });
}

async function deliverWhatsApp(payload: Prisma.JsonValue) {
  const data = whatsappPayload.parse(payload);
  const delivery = await db.reportDelivery.findUniqueOrThrow({ where: { id: data.deliveryId }, include: { report: true } });
  // A retry after recording provider success must not send the report twice.
  if (delivery.status === "SENT" || delivery.status === "DELIVERED") return;
  const connection = await db.whatsAppConnection.findUniqueOrThrow({ where: { id: data.connectionId } });
  if (connection.status !== "CONNECTED") throw new Error("WhatsApp is disconnected.");
  if (delivery.report.expiresAt && delivery.report.expiresAt <= new Date()) throw new Error("The report has expired.");
  const table = await loadReportTable(delivery.report.type, delivery.report.parameters as unknown as ReportParameters);
  const text = delivery.mode === "TEXT" || delivery.mode === "BOTH" ? reportText(table) : undefined;
  const image = delivery.mode === "IMAGE" || delivery.mode === "BOTH" ? await renderPng(table) : undefined;
  const document = delivery.mode === "PDF" ? await renderPdf(table, await getBranding()) : undefined;
  // The bridge only answers once WhatsApp's servers have acknowledged the message; anything else throws and is retried.
  const result = await sendWhatsAppReport(connection.sessionKey, {
    recipient: delivery.recipient, text: delivery.mode === "PDF" ? table.title : text,
    imageBase64: image?.toString("base64"), imageFilename: image ? reportFileName(table.title, "png") : undefined,
    documentBase64: document?.toString("base64"), documentFilename: document ? reportFileName(table.title, "pdf") : undefined, documentMimetype: document ? "application/pdf" : undefined,
  });
  await db.$transaction([
    db.reportDelivery.updateMany({ where: { id: delivery.id, status: { not: "DELIVERED" } }, data: { status: "SENT", sentAt: new Date(), attemptCount: { increment: 1 }, lastError: null, nextAttemptAt: null } }),
    db.whatsAppMessage.updateMany({ where: { deliveryId: delivery.id, status: { not: "DELIVERED" } }, data: { status: "SENT", sentAt: new Date(), attemptCount: { increment: 1 }, lastError: null, providerMessageId: result.messageId } }),
  ]);
}

export async function executeJob(job: Job) {
  if (job.type === "DELIVER_WHATSAPP") return deliverWhatsApp(job.payload);
  if (job.type === "SEND_EMAIL") return sendEmail(emailPayload.parse(job.payload));
  // Reports, OTP and backups execute in their authenticated request workflows.
  throw new UnsupportedJobError(`Job type ${job.type} has no queue handler.`);
}

export async function settleJob(job: Job, error?: unknown) {
  if (!error) {
    await db.job.update({ where: { id: job.id }, data: {
      status: "COMPLETED", completedAt: new Date(), lockedAt: null, lockedBy: null, lastError: null,
    } });
    return;
  }
  const final = job.attemptCount >= job.maxAttempts || error instanceof UnsupportedJobError;
  const delayMinutes = Math.min(60, 2 ** Math.max(0, job.attemptCount - 1));
  const retryAt = new Date(Date.now() + delayMinutes * 60_000);
  const lastError = error instanceof Error ? error.message.slice(0, 2000) : "Unknown worker error";
  await db.$transaction(async (tx) => {
    await tx.job.update({ where: { id: job.id }, data: {
      status: final ? "FAILED" : "PENDING", runAfter: retryAt, lockedAt: null, lockedBy: null, lastError,
    } });
    if (job.type !== "DELIVER_WHATSAPP") return;
    const payload = whatsappPayload.safeParse(job.payload);
    if (!payload.success) return;
    const deliveryState = { status: final ? "FAILED" as const : "QUEUED" as const, lastError, attemptCount: { increment: 1 } };
    await tx.reportDelivery.updateMany({ where: { id: payload.data.deliveryId, status: { notIn: ["SENT", "DELIVERED"] } }, data: {
      ...deliveryState, nextAttemptAt: final ? null : retryAt,
    } });
    await tx.whatsAppMessage.updateMany({ where: { deliveryId: payload.data.deliveryId, status: { notIn: ["SENT", "DELIVERED"] } }, data: deliveryState });
  });
}
