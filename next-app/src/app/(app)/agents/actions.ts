"use server";

import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

import type { ActionState } from "@/lib/actions/types";
import { requireCompanyAccess, requirePermission } from "@/lib/auth/permissions";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { normalizeEmail, normalizeName, normalizePhone } from "@/lib/domain/normalization";
import { assignAgentSchema, createAgentSchema } from "@/lib/validation/agent";

export async function createAgentAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requirePermission("agents.create");
  const parsed = createAgentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", fieldErrors: parsed.error.flatten().fieldErrors };
  await requireCompanyAccess(parsed.data.companyId, "FULL");
  const session = await requireSession();

  try {
    await db.agent.create({
      data: {
        name: parsed.data.name,
        normalizedName: normalizeName(parsed.data.name),
        phone: parsed.data.phone ? normalizePhone(parsed.data.phone) : null,
        email: parsed.data.email ? normalizeEmail(parsed.data.email) : null,
        companies: { create: { companyId: parsed.data.companyId, openingBalance: parsed.data.openingBalance, currentBalance: parsed.data.openingBalance } },
      },
    });
    await db.auditLog.create({ data: { actorId: session.userId, companyId: parsed.data.companyId, action: "agent.create", entityType: "Agent", requestId: randomUUID(), newValues: { name: parsed.data.name, openingBalance: parsed.data.openingBalance } } });
    revalidatePath("/agents");
    revalidatePath(`/companies/${parsed.data.companyId}`);
    return { status: "success", message: `${parsed.data.name} was created and assigned.` };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { status: "error", message: "An agent with this name already exists." };
    throw error;
  }
}

export async function assignAgentAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requirePermission("agents.update");
  const parsed = assignAgentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", fieldErrors: parsed.error.flatten().fieldErrors };
  await requireCompanyAccess(parsed.data.companyId, "FULL");
  try {
    await db.companyAgent.create({ data: { ...parsed.data, currentBalance: parsed.data.openingBalance } });
    revalidatePath("/agents");
    return { status: "success", message: "Company assignment added." };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { status: "error", message: "This agent is already assigned to that company." };
    throw error;
  }
}
