"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";

import type { ActionState } from "@/lib/actions/types";
import { requireCompanyAccess, requirePermission } from "@/lib/auth/permissions";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { reportRequestSchema } from "@/lib/validation/report";

export async function generateReportAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requirePermission("reports.generate");
  const parsed = reportRequestSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message, fieldErrors: parsed.error.flatten().fieldErrors };
  await requireCompanyAccess(parsed.data.companyId, "READ");
  const session = await requireSession();
  if (parsed.data.type === "AGENT_LEDGER") {
    const assignment = await db.companyAgent.findFirst({ where: { companyId: parsed.data.companyId, agentId: parsed.data.agentId, removedAt: null } });
    if (!assignment) return { status: "error", message: "Select an agent assigned to this company." };
  }
  if (parsed.data.templateId) {
    const template = await db.reportTemplate.findFirst({ where: { id: parsed.data.templateId, type: parsed.data.type, isActive: true } });
    if (!template) return { status: "error", message: "The selected template does not match this report type." };
  }
  const report = await db.generatedReport.create({ data: { companyId: parsed.data.companyId, templateId: parsed.data.templateId, type: parsed.data.type, format: parsed.data.format, parameters: { companyId: parsed.data.companyId, agentId: parsed.data.agentId, startDate: parsed.data.startDate.toISOString(), endDate: parsed.data.endDate.toISOString() }, generatedById: session.userId, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } });
  await db.auditLog.create({ data: { actorId: session.userId, companyId: parsed.data.companyId, action: "report.generate", entityType: "GeneratedReport", entityId: report.id, requestId: randomUUID(), newValues: { type: report.type, format: report.format } } });
  revalidatePath("/reports");
  return { status: "success", message: "Report generated.", data: { reportId: report.id } };
}

export async function createReportTemplateAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requirePermission("reports.generate");
  const name = String(formData.get("name") || "").trim();
  const type = String(formData.get("type") || "") as "COMPANY_LEDGER" | "AGENT_LEDGER" | "SETTLEMENT" | "PROFIT_DISTRIBUTION" | "UPLINE" | "COMPANY_SUMMARY" | "COMPANY_PNL";
  const body = String(formData.get("body") || "").trim();
  if (!name || !body || !["COMPANY_LEDGER", "AGENT_LEDGER", "SETTLEMENT", "PROFIT_DISTRIBUTION", "UPLINE", "COMPANY_SUMMARY", "COMPANY_PNL"].includes(type)) return { status: "error", message: "Name, report type, and template body are required." };
  await db.reportTemplate.create({ data: { name, type, body } });
  revalidatePath("/reports");
  return { status: "success", message: "Report template created." };
}
