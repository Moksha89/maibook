"use server";

import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

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
    revalidatePath("/identifiers");
    return { status: "success", message: `${parsed.data.value} was created.` };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { status: "error", message: "This ID already exists in the selected company." };
    throw error;
  }
}
