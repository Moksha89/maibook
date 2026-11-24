"use server";

import { randomUUID } from "node:crypto";
import { notFound } from "next/navigation";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

import type { ActionState } from "@/lib/actions/types";
import { requireCompanyAccess, requirePermission } from "@/lib/auth/permissions";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { postSettlement, reverseSettlement } from "@/lib/services/settlements";
import { settlementSchema } from "@/lib/validation/settlement";

export async function createSettlementAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requirePermission("settlements.create");
  const parsed = settlementSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message, fieldErrors: parsed.error.flatten().fieldErrors };
  await requireCompanyAccess(parsed.data.companyId, "FULL");
  const session = await requireSession();
  try {
    const posted = await postSettlement({ ...parsed.data, actorId: session.userId, requestId: randomUUID() });
    const subAgent = (await db.agentIdentifier.findUnique({ where: { id: posted.identifierId }, select: { type: true } }))?.type === "SUB_AGENT";
    const share = (subAgent ? 1 : -1) * Number(posted.agentShare.toString()) * (Number(posted.amount.toString()) < 0 ? -1 : 1);
    const who = Math.abs(share) < 0.5 ? "Settled" : share > 0 ? "Agent owes company" : "Company owes agent";
    revalidatePath("/settlements");
    revalidatePath("/identifiers");
    revalidatePath("/agents");
    revalidatePath("/ledger");
    return { status: "success", message: `Settlement posted. ${who}${Math.abs(share) < 0.5 ? "" : ` ${Math.abs(share).toLocaleString("en-IN", { maximumFractionDigits: 0, signDisplay: "negative" })}`}.`, data: { idempotencyKey: randomUUID() } };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { status: "success", message: "This settlement was already posted.", data: { idempotencyKey: randomUUID() } };
    return { status: "error", message: error instanceof Error ? error.message : "The settlement could not be posted." };
  }
}

export async function reverseSettlementAction(formData: FormData) {
  await requirePermission("settlements.reverse");
  const settlementId = String(formData.get("settlementId") || "");
  const reason = String(formData.get("reason") || "Reversed by an authorized user").slice(0, 500);
  if (!z.string().uuid().safeParse(settlementId).success) notFound();
  const settlement = await db.settlement.findUnique({ where: { id: settlementId }, select: { companyId: true } });
  if (!settlement) notFound();
  await requireCompanyAccess(settlement.companyId, "FULL");
  const session = await requireSession();
  await reverseSettlement(settlementId, session.userId, randomUUID(), reason);
  revalidatePath("/settlements"); revalidatePath("/identifiers"); revalidatePath("/agents"); revalidatePath("/ledger");
}
