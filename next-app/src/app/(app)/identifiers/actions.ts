"use server";

import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { ActionState } from "@/lib/actions/types";
import { requireCompanyAccess, requirePermission } from "@/lib/auth/permissions";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { normalizeName } from "@/lib/domain/normalization";
import { recordIdentifierAgentAssignment } from "@/lib/services/identifier-agent-assignment";
import { recordIdentifierShare } from "@/lib/services/identifier-share-history";
import { identifierSchema } from "@/lib/validation/identifier";

export async function createIdentifierAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requirePermission("identifiers.create");
  const siteId = String(formData.get("siteId") || "");
  if (!siteId) return { status: "error", message: "Select a site." };
  const site = await db.site.findUnique({ where: { id: siteId }, select: { id: true } });
  if (!site) return { status: "error", message: "This site no longer exists." };
  const parsed = identifierSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message, fieldErrors: parsed.error.flatten().fieldErrors };
  const companyId = parsed.data.companyId ?? null;
  if (parsed.data.agentId && !String(formData.get("percentageRate") ?? "").trim()) return { status: "error", message: "Agent percentage is required when an agent is selected." };
  if (companyId) await requireCompanyAccess(companyId, "FULL");
  const session = await requireSession();
  if (parsed.data.agentId && !companyId) return { status: "error", message: "Select a company for this agent." };
  const assigned = parsed.data.agentId && companyId ? await db.companyAgent.findUnique({ where: { companyId_agentId: { companyId, agentId: parsed.data.agentId } } }) : null;
  if (parsed.data.agentId && (!assigned || assigned.removedAt)) return { status: "error", message: "The selected agent is not linked to this company." };
  const normalizedValue = normalizeName(parsed.data.value);
  if (await db.agentIdentifier.findFirst({ where: { siteId: site.id, normalizedValue, deletedAt: null }, select: { id: true } })) return { status: "error", message: "This ID already exists on this site." };
  try {
    const identifier = await db.$transaction(async (tx) => {
      const created = await tx.agentIdentifier.create({ data: { value: parsed.data.value, type: parsed.data.type, percentageRate: parsed.data.percentageRate, companyId, agentId: parsed.data.agentId ?? null, siteId: site.id, normalizedValue } });
      await recordIdentifierShare(tx, created.id, created.percentageRate, created.createdAt);
      if (created.agentId) await recordIdentifierAgentAssignment(tx, created.id, created.agentId, created.createdAt);
      await tx.auditLog.create({ data: { actorId: session.userId, companyId, action: "identifier.create", entityType: "AgentIdentifier", entityId: created.id, requestId: randomUUID(), newValues: { value: parsed.data.value, type: parsed.data.type, percentageRate: parsed.data.percentageRate } } });
      return created;
    });
    revalidatePath("/", "layout");
    return { status: "success", message: `${identifier.value} was created.` };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { status: "error", message: "This ID already exists on this site." };
    throw error;
  }
}

const updateIdentifierSchema = identifierSchema.extend({ identifierId: z.string().uuid() });

export async function updateIdentifierAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requirePermission("identifiers.update");
  const parsed = updateIdentifierSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message, fieldErrors: parsed.error.flatten().fieldErrors };
  const existing = await db.agentIdentifier.findFirst({ where: { id: parsed.data.identifierId, deletedAt: null } });
  if (!existing) return { status: "error", message: "This ID no longer exists." };
  const companyId = parsed.data.companyId ?? null;
  const agentId = parsed.data.agentId ?? null;
  if (existing.companyId) await requireCompanyAccess(existing.companyId, "FULL");
  if (companyId) await requireCompanyAccess(companyId, "FULL");
  const session = await requireSession();
  if (agentId && !companyId) return { status: "error", message: "Select a company for this agent." };
  if (agentId && !String(formData.get("percentageRate") ?? "").trim()) return { status: "error", message: "Agent percentage is required when an agent is linked." };
  if (agentId && companyId) {
    const assigned = await db.companyAgent.findUnique({ where: { companyId_agentId: { companyId, agentId } } });
    if (!assigned || assigned.removedAt) return { status: "error", message: "The selected agent is not linked to this company." };
  }
  const agentChanged = (existing.agentId ?? null) !== agentId;
  try {
    await db.$transaction(async (tx) => {
      await tx.agentIdentifier.update({ where: { id: existing.id }, data: { companyId, agentId, value: parsed.data.value, normalizedValue: normalizeName(parsed.data.value), type: parsed.data.type, percentageRate: parsed.data.percentageRate } });
      if (!existing.percentageRate.eq(parsed.data.percentageRate)) await recordIdentifierShare(tx, existing.id, parsed.data.percentageRate);
      if (agentChanged) await recordIdentifierAgentAssignment(tx, existing.id, agentId);
      await tx.auditLog.create({ data: { actorId: session.userId, companyId, action: "identifier.update", entityType: "AgentIdentifier", entityId: existing.id, requestId: randomUUID(), oldValues: { companyId: existing.companyId, agentId: existing.agentId, value: existing.value, type: existing.type, percentageRate: existing.percentageRate.toString() }, newValues: { companyId, agentId, value: parsed.data.value, type: parsed.data.type, percentageRate: parsed.data.percentageRate } } });
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { status: "error", message: "This ID already exists on this site." };
    throw error;
  }
  revalidatePath("/identifiers");
  revalidatePath(`/identifiers/${existing.id}`);
  return { status: "success", message: "ID updated." };
}

export async function setIdentifierStatusAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requirePermission("identifiers.update");
  const identifierId = String(formData.get("identifierId") || "");
  const status = formData.get("status") === "ACTIVE" ? "ACTIVE" : "INACTIVE";
  const existing = await db.agentIdentifier.findFirst({ where: { id: identifierId, deletedAt: null } });
  if (!existing) return { status: "error", message: "This ID no longer exists." };
  if (existing.companyId) await requireCompanyAccess(existing.companyId, "FULL");
  const session = await requireSession();
  await db.agentIdentifier.update({ where: { id: existing.id }, data: { status } });
  await db.auditLog.create({ data: { actorId: session.userId, companyId: existing.companyId, action: `identifier.${status === "ACTIVE" ? "activate" : "deactivate"}`, entityType: "AgentIdentifier", entityId: existing.id, requestId: randomUUID(), newValues: { status } } });
  revalidatePath("/identifiers");
  return { status: "success" };
}

export async function deleteIdentifierAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requirePermission("identifiers.delete");
  const identifierId = String(formData.get("identifierId") || "");
  const existing = await db.agentIdentifier.findFirst({ where: { id: identifierId, deletedAt: null }, include: { _count: { select: { settlements: true } } } });
  if (!existing) return { status: "error", message: "This ID no longer exists." };
  if (existing.companyId) await requireCompanyAccess(existing.companyId, "FULL");
  const session = await requireSession();
  if (existing._count.settlements) return { status: "error", message: "This ID has settlements and cannot be removed. Deactivate it instead." };
  if (!existing.currentBalance.isZero()) return { status: "error", message: "Clear the balance before removing this ID." };
  await db.$transaction([
    db.agentIdentifier.update({ where: { id: existing.id }, data: { deletedAt: new Date(), deletedById: session.userId, status: "INACTIVE", normalizedValue: `${existing.normalizedValue}~deleted-${existing.id.slice(0, 8)}` } }),
    db.auditLog.create({ data: { actorId: session.userId, companyId: existing.companyId, action: "identifier.delete", entityType: "AgentIdentifier", entityId: existing.id, requestId: randomUUID(), oldValues: { value: existing.value } } }),
  ]);
  revalidatePath("/identifiers");
  return { status: "success", message: `${existing.value} was removed.` };
}

export async function assignIdentifierAgentAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requirePermission("identifiers.update");
  const identifierId = String(formData.get("identifierId") || "");
  const agentId = String(formData.get("agentId") || "");
  if (!identifierId || !agentId) return { status: "error", message: "Select an agent." };
  const existing = await db.agentIdentifier.findFirst({ where: { id: identifierId, deletedAt: null } });
  if (!existing) return { status: "error", message: "This ID no longer exists." };
  if (!existing.companyId) return { status: "error", message: "Link a company to this ID first." };
  await requireCompanyAccess(existing.companyId, "FULL");
  const assigned = await db.companyAgent.findUnique({ where: { companyId_agentId: { companyId: existing.companyId, agentId } } });
  if (!assigned || assigned.removedAt) return { status: "error", message: "The selected agent is not linked to this company." };
  if (existing.agentId === agentId) return { status: "success", message: "This agent is already assigned." };
  const session = await requireSession();
  await db.$transaction(async (tx) => {
    await tx.agentIdentifier.update({ where: { id: existing.id }, data: { agentId } });
    await recordIdentifierAgentAssignment(tx, existing.id, agentId);
    await tx.auditLog.create({ data: { actorId: session.userId, companyId: existing.companyId, action: "identifier.assign-agent", entityType: "AgentIdentifier", entityId: existing.id, requestId: randomUUID(), oldValues: { agentId: existing.agentId }, newValues: { agentId } } });
  });
  revalidatePath("/", "layout");
  return { status: "success", message: "Agent assigned." };
}

export async function unassignIdentifierAgentAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requirePermission("identifiers.update");
  const identifierId = String(formData.get("identifierId") || "");
  const existing = await db.agentIdentifier.findFirst({ where: { id: identifierId, deletedAt: null } });
  if (!existing) return { status: "error", message: "This ID no longer exists." };
  if (existing.companyId) await requireCompanyAccess(existing.companyId, "FULL");
  if (!existing.agentId) return { status: "success", message: "This ID has no agent assigned." };
  const session = await requireSession();
  await db.$transaction(async (tx) => {
    await tx.agentIdentifier.update({ where: { id: existing.id }, data: { agentId: null } });
    await recordIdentifierAgentAssignment(tx, existing.id, null);
    await tx.auditLog.create({ data: { actorId: session.userId, companyId: existing.companyId, action: "identifier.unassign-agent", entityType: "AgentIdentifier", entityId: existing.id, requestId: randomUUID(), oldValues: { agentId: existing.agentId }, newValues: { agentId: null } } });
  });
  revalidatePath("/", "layout");
  return { status: "success", message: "Agent unassigned. Old settlements stay with the previous agent." };
}
