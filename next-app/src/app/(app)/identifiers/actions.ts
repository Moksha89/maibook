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
import { identifierSchema } from "@/lib/validation/identifier";

export async function createIdentifierAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requirePermission("identifiers.create");
  const parsed = identifierSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message, fieldErrors: parsed.error.flatten().fieldErrors };
  await requireCompanyAccess(parsed.data.companyId, "FULL");
  const session = await requireSession();
  const assigned = await db.companyAgent.findUnique({ where: { companyId_agentId: { companyId: parsed.data.companyId, agentId: parsed.data.agentId } } });
  if (!assigned || assigned.removedAt) return { status: "error", message: "The selected agent is not assigned to this company." };
  try {
    const identifier = await db.agentIdentifier.create({ data: { ...parsed.data, normalizedValue: normalizeName(parsed.data.value) } });
    await db.auditLog.create({ data: { actorId: session.userId, companyId: parsed.data.companyId, action: "identifier.create", entityType: "AgentIdentifier", entityId: identifier.id, requestId: randomUUID(), newValues: { value: parsed.data.value, type: parsed.data.type, percentageRate: parsed.data.percentageRate } } });
    revalidatePath("/", "layout");
    return { status: "success", message: `${parsed.data.value} was created.` };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { status: "error", message: "This ID already exists in the selected company." };
    throw error;
  }
}

const updateIdentifierSchema = identifierSchema.omit({ companyId: true, agentId: true }).extend({ identifierId: z.string().uuid() });

export async function updateIdentifierAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requirePermission("identifiers.update");
  const parsed = updateIdentifierSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message, fieldErrors: parsed.error.flatten().fieldErrors };
  const existing = await db.agentIdentifier.findFirst({ where: { id: parsed.data.identifierId, deletedAt: null } });
  if (!existing) return { status: "error", message: "This ID no longer exists." };
  await requireCompanyAccess(existing.companyId, "FULL");
  const session = await requireSession();
  try {
    await db.agentIdentifier.update({ where: { id: existing.id }, data: { value: parsed.data.value, normalizedValue: normalizeName(parsed.data.value), type: parsed.data.type, percentageRate: parsed.data.percentageRate } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { status: "error", message: "This ID already exists in the selected company." };
    throw error;
  }
  await db.auditLog.create({ data: { actorId: session.userId, companyId: existing.companyId, action: "identifier.update", entityType: "AgentIdentifier", entityId: existing.id, requestId: randomUUID(), oldValues: { value: existing.value, type: existing.type, percentageRate: existing.percentageRate.toString() }, newValues: { value: parsed.data.value, type: parsed.data.type, percentageRate: parsed.data.percentageRate } } });
  revalidatePath("/identifiers");
  return { status: "success", message: "ID updated. Past settlements keep their snapshotted rate." };
}

export async function setIdentifierStatusAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requirePermission("identifiers.update");
  const identifierId = String(formData.get("identifierId") || "");
  const status = formData.get("status") === "ACTIVE" ? "ACTIVE" : "INACTIVE";
  const existing = await db.agentIdentifier.findFirst({ where: { id: identifierId, deletedAt: null } });
  if (!existing) return { status: "error", message: "This ID no longer exists." };
  await requireCompanyAccess(existing.companyId, "FULL");
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
  await requireCompanyAccess(existing.companyId, "FULL");
  const session = await requireSession();
  if (existing._count.settlements) return { status: "error", message: "This ID has settlements and cannot be removed. Deactivate it instead." };
  if (!existing.currentBalance.isZero()) return { status: "error", message: "Clear the balance before removing this ID." };
  await db.$transaction([
    db.agentIdentifier.update({ where: { id: existing.id }, data: { deletedAt: new Date(), status: "INACTIVE", normalizedValue: `${existing.normalizedValue}~deleted-${existing.id.slice(0, 8)}` } }),
    db.auditLog.create({ data: { actorId: session.userId, companyId: existing.companyId, action: "identifier.delete", entityType: "AgentIdentifier", entityId: existing.id, requestId: randomUUID(), oldValues: { value: existing.value } } }),
  ]);
  revalidatePath("/identifiers");
  return { status: "success", message: `${existing.value} was removed.` };
}
