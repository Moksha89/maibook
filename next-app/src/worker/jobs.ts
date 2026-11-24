import { Job, Prisma } from "@prisma/client";
import sharp from "sharp";
import { z } from "zod";
import { db } from "../lib/db";
import { loadReportTable, type ReportParameters, type ReportTable } from "../lib/services/report-data";
import { sendEmail } from "../lib/services/email";
import { sendWhatsAppReport } from "../lib/services/whatsapp-bridge";

const whatsappPayload = z.object({ deliveryId: z.string().uuid(), connectionId: z.string().uuid() });
const emailPayload = z.object({ to: z.email(), subject: z.string().min(1), text: z.string() });

export class UnsupportedJobError extends Error {}

function reportText(table: ReportTable) {
  return [table.title, table.subtitle, "", table.columns.join(" | "), ...table.rows.map((row) => row.join(" | "))].join("\n");
}

function escapeXml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

async function reportPng(table: ReportTable) {
  const text = reportText(table).split("\n").slice(0, 80);
  const width = 1400;
  const height = Math.max(300, 110 + text.length * 24);
  const lines = text.map((line, index) => `<text x="34" y="${48 + index * 24}" font-family="monospace" font-size="15" fill="#17263a">${escapeXml(line.slice(0, 160))}</text>`).join("");
  return sharp(Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#ffffff"/><rect width="100%" height="8" fill="#c9952e"/>${lines}</svg>`)).png().toBuffer();
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
  if (delivery.status === "SENT") return;
  const connection = await db.whatsAppConnection.findUniqueOrThrow({ where: { id: data.connectionId } });
  if (connection.status !== "CONNECTED") throw new Error("WhatsApp is disconnected.");
  if (delivery.report.expiresAt && delivery.report.expiresAt <= new Date()) throw new Error("The report has expired.");
  const table = await loadReportTable(delivery.report.type, delivery.report.parameters as unknown as ReportParameters);
  const text = delivery.mode === "IMAGE" ? undefined : reportText(table);
  const image = delivery.mode === "TEXT" ? undefined : await reportPng(table);
  const result = await sendWhatsAppReport(connection.sessionKey, {
    recipient: delivery.recipient, text, imageBase64: image?.toString("base64"),
    imageFilename: image ? `${delivery.report.type.toLowerCase()}.png` : undefined,
  });
  await db.$transaction([
    db.reportDelivery.update({ where: { id: delivery.id }, data: { status: "SENT", sentAt: new Date(), attemptCount: { increment: 1 }, lastError: null, nextAttemptAt: null } }),
    db.whatsAppMessage.updateMany({ where: { deliveryId: delivery.id }, data: { status: "SENT", sentAt: new Date(), attemptCount: { increment: 1 }, lastError: null, providerMessageId: result.messageId } }),
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
    await tx.reportDelivery.updateMany({ where: { id: payload.data.deliveryId, status: { not: "SENT" } }, data: {
      ...deliveryState, nextAttemptAt: final ? null : retryAt,
    } });
    await tx.whatsAppMessage.updateMany({ where: { deliveryId: payload.data.deliveryId, status: { not: "SENT" } }, data: deliveryState });
  });
}
