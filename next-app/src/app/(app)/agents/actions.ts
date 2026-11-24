"use server";

import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { forbidden } from "next/navigation";

import type { ActionState } from "@/lib/actions/types";
import { requireCompanyAccess, requirePermission } from "@/lib/auth/permissions";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { normalizeEmail, normalizeName, normalizePhone } from "@/lib/domain/normalization";
import { assignAgentSchema, createAgentSchema, updateAgentSchema } from "@/lib/validation/agent";

function refresh(companyId?: string) {
  revalidatePath("/", "layout");
  revalidatePath("/agents");
  revalidatePath("/identifiers");
  revalidatePath("/companies");
  if (companyId) revalidatePath(`/companies/${companyId}`);
}

/** Non-superadmins may change an agent only when they have FULL access to one of its companies. */
async function requireAgentAccess(agentId: string) {
  const session = await requireSession();
  if (session.user.roles.some(({ role }) => role.key === "superadmin")) return;
  const allowed = await db.companyAgent.findFirst({ where: { agentId, removedAt: null, company: { userAccess: { some: { userId: session.userId, level: "FULL" } } } }, select: { agentId: true } });
  if (!allowed) forbidden();
}

export async function createAgentAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requirePermission("agents.create");
  const parsed = createAgentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", fieldErrors: parsed.error.flatten().fieldErrors };
  await requireCompanyAccess(parsed.data.companyId, "FULL");
  const session = await requireSession();
  const normalizedName = normalizeName(parsed.data.name);

  try {
    // Typing an existing agent's name assigns that agent instead of creating a duplicate.
    const existing = await db.agent.findFirst({ where: { normalizedName, deletedAt: null }, include: { companies: { where: { companyId: parsed.data.companyId } } } });
    if (existing) {
      const link = existing.companies[0];
      if (link && !link.removedAt) return { status: "error", message: `${existing.name} is already assigned to this company.` };
      if (link) await db.companyAgent.update({ where: { companyId_agentId: { companyId: link.companyId, agentId: existing.id } }, data: { removedAt: null } });
      else await db.companyAgent.create({ data: { companyId: parsed.data.companyId, agentId: existing.id, openingBalance: parsed.data.openingBalance, currentBalance: parsed.data.openingBalance } });
      await db.auditLog.create({ data: { actorId: session.userId, companyId: parsed.data.companyId, action: "agent.assign", entityType: "Agent", entityId: existing.id, requestId: randomUUID(), newValues: { name: existing.name, openingBalance: parsed.data.openingBalance } } });
      refresh(parsed.data.companyId);
      return { status: "success", message: `${existing.name} already existed and was added to the company.` };
    }
    const agent = await db.agent.create({
      data: {
        name: parsed.data.name,
        normalizedName,
        phone: parsed.data.phone ? normalizePhone(parsed.data.phone) : null,
        email: parsed.data.email ? normalizeEmail(parsed.data.email) : null,
        companies: { create: { companyId: parsed.data.companyId, openingBalance: parsed.data.openingBalance, currentBalance: parsed.data.openingBalance } },
      },
    });
    await db.auditLog.create({ data: { actorId: session.userId, companyId: parsed.data.companyId, action: "agent.create", entityType: "Agent", entityId: agent.id, requestId: randomUUID(), newValues: { name: parsed.data.name, openingBalance: parsed.data.openingBalance } } });
    refresh(parsed.data.companyId);
    return { status: "success", message: `${parsed.data.name} was created and assigned.` };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { status: "error", message: "An agent with this name already exists." };
    throw error;
  }
}

export async function assignAgentAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requirePermission("agents.update");
  const parsed = assignAgentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message, fieldErrors: parsed.error.flatten().fieldErrors };
  await requireCompanyAccess(parsed.data.companyId, "FULL");
  const session = await requireSession();
  const link = await db.companyAgent.findUnique({ where: { companyId_agentId: { companyId: parsed.data.companyId, agentId: parsed.data.agentId } } });
  if (link && !link.removedAt) return { status: "error", message: "This agent is already assigned to that company." };
  if (link) await db.companyAgent.update({ where: { companyId_agentId: { companyId: link.companyId, agentId: link.agentId } }, data: { removedAt: null } });
  else await db.companyAgent.create({ data: { ...parsed.data, currentBalance: parsed.data.openingBalance } });
  await db.auditLog.create({ data: { actorId: session.userId, companyId: parsed.data.companyId, action: "agent.assign", entityType: "Agent", entityId: parsed.data.agentId, requestId: randomUUID(), newValues: { openingBalance: parsed.data.openingBalance } } });
  refresh(parsed.data.companyId);
  return { status: "success", message: "Company assignment added." };
}

export async function updateAgentAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requirePermission("agents.update");
  const parsed = updateAgentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message, fieldErrors: parsed.error.flatten().fieldErrors };
  await requireAgentAccess(parsed.data.agentId);
  const session = await requireSession();
  const existing = await db.agent.findFirst({ where: { id: parsed.data.agentId, deletedAt: null } });
  if (!existing) return { status: "error", message: "This agent no longer exists." };
  try {
    await db.agent.update({ where: { id: existing.id }, data: { name: parsed.data.name, normalizedName: normalizeName(parsed.data.name), phone: parsed.data.phone ? normalizePhone(parsed.data.phone) : null, email: parsed.data.email ? normalizeEmail(parsed.data.email) : null } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { status: "error", message: "An agent with this name already exists." };
    throw error;
  }
  await db.auditLog.create({ data: { actorId: session.userId, action: "agent.update", entityType: "Agent", entityId: existing.id, requestId: randomUUID(), oldValues: { name: existing.name, phone: existing.phone, email: existing.email }, newValues: { name: parsed.data.name, phone: parsed.data.phone || null, email: parsed.data.email || null } } });
  refresh();
  return { status: "success", message: "Agent updated." };
}

export async function setAgentStatusAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requirePermission("agents.update");
  const agentId = String(formData.get("agentId") || "");
  const status = formData.get("status") === "ACTIVE" ? "ACTIVE" : "INACTIVE";
  await requireAgentAccess(agentId);
  const session = await requireSession();
  const result = await db.agent.updateMany({ where: { id: agentId, deletedAt: null }, data: { status } });
  if (!result.count) return { status: "error", message: "This agent no longer exists." };
  await db.auditLog.create({ data: { actorId: session.userId, action: `agent.${status === "ACTIVE" ? "activate" : "deactivate"}`, entityType: "Agent", entityId: agentId, requestId: randomUUID(), newValues: { status } } });
  refresh();
  return { status: "success" };
}

export async function removeAgentAssignmentAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requirePermission("agents.update");
  const agentId = String(formData.get("agentId") || "");
  const companyId = String(formData.get("companyId") || "");
  await requireCompanyAccess(companyId, "FULL");
  const session = await requireSession();
  const link = await db.companyAgent.findUnique({ where: { companyId_agentId: { companyId, agentId } } });
  if (!link || link.removedAt) return { status: "error", message: "This assignment no longer exists." };
  if (!link.currentBalance.isZero()) return { status: "error", message: "The balance must be zero before the agent can be removed from this company." };
  const identifiers = await db.agentIdentifier.count({ where: { companyId, agentId, deletedAt: null } });
  if (identifiers) return { status: "error", message: "Remove this agent's IDs in the company first." };
  await db.companyAgent.update({ where: { companyId_agentId: { companyId, agentId } }, data: { removedAt: new Date() } });
  await db.auditLog.create({ data: { actorId: session.userId, companyId, action: "agent.unassign", entityType: "Agent", entityId: agentId, requestId: randomUUID() } });
  refresh(companyId);
  return { status: "success" };
}

export async function deleteAgentAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requirePermission("agents.delete");
  const agentId = String(formData.get("agentId") || "");
  await requireAgentAccess(agentId);
  const session = await requireSession();
  const agent = await db.agent.findFirst({ where: { id: agentId, deletedAt: null }, include: { companies: { where: { removedAt: null } }, _count: { select: { ledgerLines: true, settlements: true } } } });
  if (!agent) return { status: "error", message: "This agent no longer exists." };
  if (agent._count.ledgerLines || agent._count.settlements) return { status: "error", message: "This agent has ledger or settlement history and cannot be removed. Deactivate it instead." };
  if (agent.companies.some((link) => !link.currentBalance.isZero())) return { status: "error", message: "Clear the agent's balances before removing it." };
  const identifiers = await db.agentIdentifier.count({ where: { agentId, deletedAt: null } });
  if (identifiers) return { status: "error", message: "Remove this agent's IDs first." };
  await db.$transaction([
    db.companyAgent.updateMany({ where: { agentId, removedAt: null }, data: { removedAt: new Date() } }),
    db.agent.update({ where: { id: agentId }, data: { deletedAt: new Date(), deletedById: session.userId, status: "INACTIVE", normalizedName: `${agent.normalizedName}~deleted-${agent.id.slice(0, 8)}` } }),
    db.auditLog.create({ data: { actorId: session.userId, action: "agent.delete", entityType: "Agent", entityId: agentId, requestId: randomUUID(), oldValues: { name: agent.name } } }),
  ]);
  refresh();
  return { status: "success", message: `${agent.name} was removed.` };
}
