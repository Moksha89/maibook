"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionState } from "@/lib/actions/types";
import { requireCompanyAccess, requirePermission } from "@/lib/auth/permissions";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { distributeManualAgentAmount } from "@/lib/services/manual-distribution";

const schema = z.object({ agentId: z.string().uuid(), amount: z.coerce.number().finite().refine((value) => value !== 0, "Amount cannot be zero."), entryDate: z.coerce.date(), remarks: z.string().trim().max(500).transform((value) => value.toUpperCase()).optional(), idempotencyKey: z.string().uuid() });

export async function distributeManualAgentAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requirePermission("ledger.create");
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message };
  const session = await requireSession();
  const assignments = await db.companyAgent.findMany({ where: { agentId: parsed.data.agentId, removedAt: null }, select: { companyId: true } });
  for (const assignment of assignments) await requireCompanyAccess(assignment.companyId, "FULL");
  try {
    const result = await distributeManualAgentAmount({ ...parsed.data, actorId: session.userId, requestId: randomUUID() });
    revalidatePath("/manual-distribution"); revalidatePath("/ledger"); revalidatePath("/agents");
    return { status: "success", message: result.duplicate ? "This distribution was already posted." : `Posted across ${result.allocations.length} companies.`, data: { idempotencyKey: randomUUID() } };
  } catch (error) { return { status: "error", message: error instanceof Error ? error.message : "Distribution failed." }; }
}
