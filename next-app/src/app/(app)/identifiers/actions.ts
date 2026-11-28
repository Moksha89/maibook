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
import { parseAgentSplits, primaryAgentId, recordIdentifierAgentSet } from "@/lib/services/identifier-agent-assignment";
import { recordIdentifierShare } from "@/lib/services/identifier-share-history";
import { identifierSchema } from "@/lib/validation/identifier";

async function requireAgentsMatchType(agentIds: string[], type: "AGENT" | "SUB_AGENT") {
  if (!agentIds.length) return null;
  const people = await db.agent.findMany({ where: { id: { in: agentIds }, deletedAt: null }, select: { id: true, type: true } });
  if (people.length !== agentIds.length || people.some((person) => person.type !== type)) {
    return { status: "error" as const, message: type === "SUB_AGENT" ? "Every selected person must be a sub-agent of this company." : "Every selected person must be an agent of this company." };
  }
  return null;
}


export async function createIdentifierAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requirePermission("identifiers.create");
  const siteId = String(formData.get("siteId") || "");
  if (!siteId) return { status: "error", message: "Select a site." };
  const site = await db.site.findUnique({ where: { id: siteId }, select: { id: true } });
  if (!site) return { status: "error", message: "This site no longer exists." };
  const parsed = identifierSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message, fieldErrors: parsed.error.flatten().fieldErrors };
  const companyId = parsed.data.companyId ?? null;
  const splitsParsed = parseAgentSplits(formData);
  if (!splitsParsed.ok) return { status: "error", message: splitsParsed.message };
  const splits = splitsParsed.splits;
  const primaryId = primaryAgentId(splits);
  if (splits.length && !String(formData.get("percentageRate") ?? "").trim()) return { status: "error", message: "Agent percentage is required when an agent is selected." };
  if (companyId) await requireCompanyAccess(companyId, "FULL");
  const session = await requireSession();
  if (splits.length && !companyId) return { status: "error", message: "Select a company for this agent." };
  if (splits.length && companyId) {
    const assigned = await db.companyAgent.findMany({ where: { companyId, agentId: { in: splits.map((row) => row.agentId) } } });
    if (assigned.length !== splits.length || assigned.some((row) => row.removedAt)) return { status: "error", message: "Every selected agent must belong to this company." };
    const typeMismatch = await requireAgentsMatchType(splits.map((row) => row.agentId), parsed.data.type);
    if (typeMismatch) return typeMismatch;
  }
  const normalizedValue = normalizeName(parsed.data.value);
  if (await db.agentIdentifier.findFirst({ where: { siteId: site.id, normalizedValue, deletedAt: null }, select: { id: true } })) return { status: "error", message: "This ID already exists on this site." };
  try {
    const identifier = await db.$transaction(async (tx) => {
      const created = await tx.agentIdentifier.create({ data: { value: parsed.data.value, type: parsed.data.type, percentageRate: parsed.data.percentageRate, companyId, agentId: primaryId, siteId: site.id, normalizedValue } });
      await recordIdentifierShare(tx, created.id, created.percentageRate, created.createdAt);
      if (splits.length) await recordIdentifierAgentSet(tx, created.id, splits, created.createdAt);
      await tx.auditLog.create({ data: { actorId: session.userId, companyId, action: "identifier.create", entityType: "AgentIdentifier", entityId: created.id, requestId: randomUUID(), newValues: { value: parsed.data.value, type: parsed.data.type, percentageRate: parsed.data.percentageRate, agents: splits } } });
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
  const splitsParsed = parseAgentSplits(formData);
  if (!splitsParsed.ok) return { status: "error", message: splitsParsed.message };
  const splits = splitsParsed.splits;
  const agentId = primaryAgentId(splits);
  if (existing.companyId) await requireCompanyAccess(existing.companyId, "FULL");
  if (companyId) await requireCompanyAccess(companyId, "FULL");
  const session = await requireSession();
  if (splits.length && !companyId) return { status: "error", message: "Select a company for this agent." };
  if (splits.length && !String(formData.get("percentageRate") ?? "").trim()) return { status: "error", message: "Agent percentage is required when an agent is linked." };
  if (splits.length && companyId) {
    const assigned = await db.companyAgent.findMany({ where: { companyId, agentId: { in: splits.map((row) => row.agentId) } } });
    if (assigned.length !== splits.length || assigned.some((row) => row.removedAt)) return { status: "error", message: "Every selected agent must belong to this company." };
    const typeMismatch = await requireAgentsMatchType(splits.map((row) => row.agentId), parsed.data.type);
    if (typeMismatch) return typeMismatch;
  }
  try {
    await db.$transaction(async (tx) => {
      await tx.agentIdentifier.update({ where: { id: existing.id }, data: { companyId, agentId, value: parsed.data.value, normalizedValue: normalizeName(parsed.data.value), type: parsed.data.type, percentageRate: parsed.data.percentageRate } });
      if (!existing.percentageRate.eq(parsed.data.percentageRate)) await recordIdentifierShare(tx, existing.id, parsed.data.percentageRate);
      await recordIdentifierAgentSet(tx, existing.id, splits);
      await tx.auditLog.create({ data: { actorId: session.userId, companyId, action: "identifier.update", entityType: "AgentIdentifier", entityId: existing.id, requestId: randomUUID(), oldValues: { companyId: existing.companyId, agentId: existing.agentId, value: existing.value, type: existing.type, percentageRate: existing.percentageRate.toString() }, newValues: { companyId, agentId, value: parsed.data.value, type: parsed.data.type, percentageRate: parsed.data.percentageRate, agents: splits } } });
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
  const splitsParsed = parseAgentSplits(formData);
  if (!identifierId) return { status: "error", message: "Select an agent." };
  if (!splitsParsed.ok) return { status: "error", message: splitsParsed.message };
  const splits = splitsParsed.splits;
  if (!splits.length) {
    const legacyAgentId = String(formData.get("agentId") || "");
    if (!legacyAgentId) return { status: "error", message: "Select an agent." };
    splits.push({ agentId: legacyAgentId, splitPercentage: 100 });
  }
  const agentId = primaryAgentId(splits);
  const existing = await db.agentIdentifier.findFirst({ where: { id: identifierId, deletedAt: null } });
  if (!existing) return { status: "error", message: "This ID no longer exists." };
  if (!existing.companyId) return { status: "error", message: "Link a company to this ID first." };
  await requireCompanyAccess(existing.companyId, "FULL");
  const assigned = await db.companyAgent.findMany({ where: { companyId: existing.companyId, agentId: { in: splits.map((row) => row.agentId) } } });
  if (assigned.length !== splits.length || assigned.some((row) => row.removedAt)) return { status: "error", message: "Every selected agent must belong to this company." };
  const type = String(formData.get("type") || existing.type) === "SUB_AGENT" ? "SUB_AGENT" : "AGENT";
  const typeMismatch = await requireAgentsMatchType(splits.map((row) => row.agentId), type);
  if (typeMismatch) return typeMismatch;
  const session = await requireSession();
  await db.$transaction(async (tx) => {
    const result = await recordIdentifierAgentSet(tx, existing.id, splits);
    if (!result.changed && existing.type === type && existing.agentId === agentId) return;
    await tx.agentIdentifier.update({ where: { id: existing.id }, data: { agentId, type } });
    await tx.auditLog.create({ data: { actorId: session.userId, companyId: existing.companyId, action: "identifier.assign-agent", entityType: "AgentIdentifier", entityId: existing.id, requestId: randomUUID(), oldValues: { agentId: existing.agentId, type: existing.type }, newValues: { agentId, type, agents: splits } } });
  });
  revalidatePath("/", "layout");
  return { status: "success", message: "Agents assigned." };
}

export async function unassignIdentifierAgentAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requirePermission("identifiers.update");
  const identifierId = String(formData.get("identifierId") || "");
  const existing = await db.agentIdentifier.findFirst({ where: { id: identifierId, deletedAt: null } });
  if (!existing) return { status: "error", message: "This ID no longer exists." };
  if (existing.companyId) await requireCompanyAccess(existing.companyId, "FULL");
  const openAssignments = await db.identifierAgentAssignment.count({ where: { identifierId: existing.id, effectiveTo: null } });
  if (!existing.agentId && !openAssignments) return { status: "success", message: "This ID has no agent assigned." };
  const session = await requireSession();
  await db.$transaction(async (tx) => {
    await tx.agentIdentifier.update({ where: { id: existing.id }, data: { agentId: null } });
    await recordIdentifierAgentSet(tx, existing.id, []);
    await tx.auditLog.create({ data: { actorId: session.userId, companyId: existing.companyId, action: "identifier.unassign-agent", entityType: "AgentIdentifier", entityId: existing.id, requestId: randomUUID(), oldValues: { agentId: existing.agentId }, newValues: { agentId: null } } });
  });
  revalidatePath("/", "layout");
  return { status: "success", message: "Agent unassigned. Old settlements stay with the previous agent." };
}
