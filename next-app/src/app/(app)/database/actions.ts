"use server";

import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { forbidden } from "next/navigation";

import type { ActionState } from "@/lib/actions/types";
import { requireCompanyAccess, requirePermission } from "@/lib/auth/permissions";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { createDatabaseBackup, verifyDatabaseBackup } from "@/lib/services/backups";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function createBackupAction(_formData?: FormData) { await requirePermission("backups.create"); const session = await requireSession(); await createDatabaseBackup(session.userId); revalidatePath("/database"); }
export async function verifyBackupAction(formData: FormData) { await requirePermission("backups.read"); const session = await requireSession(); await verifyDatabaseBackup(String(formData.get("backupId") || ""), session.userId); revalidatePath("/database"); }

const DELETED_SUFFIX = /~deleted-[0-9a-f]{8}$/i;

function stripDeletedSuffix(value: string) {
  return value.replace(DELETED_SUFFIX, "");
}

function refreshRestored(extra?: string) {
  revalidatePath("/database");
  revalidatePath("/agents");
  revalidatePath("/companies");
  revalidatePath("/identifiers");
  revalidatePath("/dashboard");
  revalidatePath("/", "layout");
  if (extra) revalidatePath(extra);
}

function codeFromAudit(oldValues: Prisma.JsonValue | null | undefined) {
  if (!oldValues || typeof oldValues !== "object" || Array.isArray(oldValues)) return null;
  const code = (oldValues as { code?: unknown }).code;
  return typeof code === "string" && code.trim() ? code : null;
}

/** Clear an agent soft-delete, restore its name, and re-link companies removed at delete time. */
export async function restoreAgentAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requirePermission("agents.delete");
  const agentId = String(formData.get("agentId") || "");
  const session = await requireSession();
  const agent = await db.agent.findFirst({ where: { id: agentId, deletedAt: { not: null } }, include: { companies: true } });
  if (!agent) return { status: "error", message: "This agent is not in the deleted list." };
  if (!session.user.roles.some(({ role }) => role.key === "superadmin")) {
    const allowed = await db.companyAgent.findFirst({ where: { agentId, company: { userAccess: { some: { userId: session.userId, level: "FULL" } } } }, select: { agentId: true } });
    if (!allowed) forbidden();
  }
  const normalizedName = stripDeletedSuffix(agent.normalizedName);
  const clash = await db.agent.findFirst({ where: { id: { not: agent.id }, normalizedName }, select: { name: true } });
  if (clash) return { status: "error", message: `An active agent named ${clash.name} already uses this name. Rename the other agent first.` };
  const deletedAt = agent.deletedAt!;
  const windowStart = new Date(deletedAt.getTime() - 5_000);
  const windowEnd = new Date(deletedAt.getTime() + 5_000);
  try {
    await db.$transaction([
      db.agent.update({ where: { id: agent.id }, data: { deletedAt: null, deletedById: null, status: "ACTIVE", normalizedName } }),
      db.companyAgent.updateMany({ where: { agentId: agent.id, removedAt: { gte: windowStart, lte: windowEnd }, company: { deletedAt: null } }, data: { removedAt: null } }),
      db.auditLog.create({ data: { actorId: session.userId, action: "agent.restore", entityType: "Agent", entityId: agent.id, requestId: randomUUID(), newValues: { name: agent.name } } }),
    ]);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { status: "error", message: "An active agent already uses this name. Rename the other agent first." };
    throw error;
  }
  refreshRestored(`/agents/${agent.id}`);
  return { status: "success", message: `${agent.name} was restored.` };
}

/** Clear a company soft-delete, restore its name and slug, and put back its code when that code is still free. */
export async function restoreCompanyAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requirePermission("companies.delete");
  const companyId = String(formData.get("companyId") || "");
  await requireCompanyAccess(companyId, "FULL");
  const session = await requireSession();
  const company = await db.company.findFirst({ where: { id: companyId, deletedAt: { not: null } } });
  if (!company) return { status: "error", message: "This company is not in the deleted list." };
  const normalizedName = stripDeletedSuffix(company.normalizedName);
  const slug = stripDeletedSuffix(company.slug);
  const clash = await db.company.findFirst({ where: { id: { not: company.id }, OR: [{ normalizedName }, { slug }] }, select: { name: true, normalizedName: true } });
  if (clash) return { status: "error", message: `An active company named ${clash.name} already uses this ${clash.normalizedName === normalizedName ? "name" : "slug"}. Rename the other company first.` };
  const log = await db.auditLog.findFirst({ where: { action: "company.delete", entityType: "Company", OR: [{ entityId: company.id }, { companyId: company.id }] }, orderBy: { createdAt: "desc" }, select: { oldValues: true } });
  const oldCode = codeFromAudit(log?.oldValues);
  let code = company.code;
  if (!code && oldCode) {
    const taken = await db.company.findFirst({ where: { id: { not: company.id }, code: oldCode }, select: { id: true } });
    if (!taken) code = oldCode;
  }
  try {
    await db.$transaction([
      db.company.update({ where: { id: company.id }, data: { deletedAt: null, deletedById: null, status: "ACTIVE", normalizedName, slug, code } }),
      db.auditLog.create({ data: { actorId: session.userId, companyId: company.id, action: "company.restore", entityType: "Company", entityId: company.id, requestId: randomUUID(), newValues: { name: company.name, code } } }),
    ]);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { status: "error", message: "An active company already uses this name, slug or code. Rename the other company first." };
    throw error;
  }
  refreshRestored(`/companies/${company.id}`);
  return { status: "success", message: `${company.name} was restored.` };
}

/** Clear an ID soft-delete after its company and agent are active, and restore its value when that value is still free in the company. */
export async function restoreIdentifierAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requirePermission("identifiers.delete");
  const identifierId = String(formData.get("identifierId") || "");
  const session = await requireSession();
  const existing = await db.agentIdentifier.findFirst({ where: { id: identifierId, deletedAt: { not: null } }, include: { company: { select: { id: true, name: true, deletedAt: true } }, agent: { select: { id: true, name: true, deletedAt: true } } } });
  if (!existing) return { status: "error", message: "This ID is not in the deleted list." };
  if (existing.companyId) await requireCompanyAccess(existing.companyId, "FULL");
  if (existing.company?.deletedAt) return { status: "error", message: `Restore company ${existing.company.name} first.` };
  if (existing.agent?.deletedAt) return { status: "error", message: `Restore agent ${existing.agent.name} first.` };
  const normalizedValue = stripDeletedSuffix(existing.normalizedValue);
  const clash = await db.agentIdentifier.findFirst({ where: { id: { not: existing.id }, companyId: existing.companyId, normalizedValue }, select: { value: true } });
  if (clash) return { status: "error", message: `An ID ${clash.value} already uses this value in the same company. Rename the other ID first.` };
  try {
    await db.$transaction([
      db.agentIdentifier.update({ where: { id: existing.id }, data: { deletedAt: null, deletedById: null, status: "ACTIVE", normalizedValue } }),
      db.auditLog.create({ data: { actorId: session.userId, companyId: existing.companyId, action: "identifier.restore", entityType: "AgentIdentifier", entityId: existing.id, requestId: randomUUID(), newValues: { value: existing.value } } }),
    ]);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { status: "error", message: "An ID already uses this value in the same company. Rename the other ID first." };
    throw error;
  }
  refreshRestored(`/identifiers/${existing.id}`);
  if (existing.companyId) revalidatePath(`/companies/${existing.companyId}`);
  if (existing.agentId) revalidatePath(`/agents/${existing.agentId}`);
  return { status: "success", message: `${existing.value} was restored.` };
}
