"use server";

import { randomUUID } from "node:crypto";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

import type { ActionState } from "@/lib/actions/types";
import { requireCompanyAccess, requirePermission } from "@/lib/auth/permissions";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { postAgentTransfer, restoreLedgerEntry, softDeleteLedgerEntry, updateAgentTransfer, updateManualAgentEntry } from "@/lib/services/ledger";
import { agentTransferSchema, editAgentTransferSchema, editManualAgentSchema } from "@/lib/validation/ledger";

async function requireEntryAccess(entryId: string) {
  if (!z.string().uuid().safeParse(entryId).success) throw new Error("This entry was not found.");
  const entry = await db.ledgerEntry.findUnique({ where: { id: entryId }, select: { companyId: true, entryType: true } });
  if (!entry) throw new Error("This entry was not found.");
  if (entry.entryType !== "TRANSACTION" && entry.entryType !== "MANUAL_AGENT") {
    throw new Error("This entry can't be changed from here. Use the source workflow to reverse settlements and other generated entries.");
  }
  await requireCompanyAccess(entry.companyId, "FULL");
  return entry;
}

export async function createTransferAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requirePermission("ledger.create");
  const parsed = agentTransferSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", fieldErrors: parsed.error.flatten().fieldErrors, message: parsed.error.issues[0]?.message };
  await requireCompanyAccess(parsed.data.companyId, "FULL");
  const session = await requireSession();
  try {
    await postAgentTransfer({ ...parsed.data, actorId: session.userId, requestId: randomUUID() });
    revalidatePath("/companies", "layout");
    revalidatePath("/ledger");
    revalidatePath("/agents");
    return { status: "success", message: "Transfer posted and balances recalculated.", data: { idempotencyKey: randomUUID() } };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { status: "success", message: "This transfer was already posted.", data: { idempotencyKey: randomUUID() } };
    return { status: "error", message: error instanceof Error ? error.message : "The transfer could not be posted." };
  }
}

export async function deleteLedgerEntryAction(formData: FormData) {
  await requirePermission("ledger.delete");
  const session = await requireSession();
  const entryId = String(formData.get("entryId") || "");
  await requireEntryAccess(entryId);
  await softDeleteLedgerEntry(entryId, session.userId, randomUUID());
  revalidatePath("/companies", "layout");
  revalidatePath("/ledger");
  revalidatePath("/agents");
}

export async function restoreLedgerEntryAction(formData: FormData) {
  await requirePermission("ledger.update");
  const session = await requireSession();
  const entryId = String(formData.get("entryId") || "");
  await requireEntryAccess(entryId);
  await restoreLedgerEntry(entryId, session.userId, randomUUID());
  revalidatePath("/companies", "layout");
  revalidatePath("/ledger");
  revalidatePath("/agents");
}

export async function updateLedgerEntryAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requirePermission("ledger.update");
  const parsed = editAgentTransferSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", fieldErrors: parsed.error.flatten().fieldErrors, message: parsed.error.issues[0]?.message };
  const existing = await requireEntryAccess(parsed.data.entryId);
  await requireCompanyAccess(parsed.data.companyId, "FULL");
  if (existing.companyId !== parsed.data.companyId) await requireCompanyAccess(existing.companyId, "FULL");
  const session = await requireSession();
  try {
    await updateAgentTransfer(parsed.data.entryId, { coins: parsed.data.coins, rate: parsed.data.rate, entryDate: parsed.data.entryDate, remarks: parsed.data.remarks, companyId: parsed.data.companyId, senderAgentId: parsed.data.senderAgentId, receiverAgentId: parsed.data.receiverAgentId, actorId: session.userId, requestId: randomUUID() });
    revalidatePath("/ledger");
    revalidatePath(`/ledger/${parsed.data.entryId}/edit`);
    revalidatePath("/companies", "layout");
    revalidatePath("/agents");
    return { status: "success", message: "Transfer updated and all later balances recalculated." };
  } catch (error) { return { status: "error", message: error instanceof Error ? error.message : "The transfer could not be updated." }; }
}

export async function updateManualAgentEntryAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requirePermission("ledger.update");
  const parsed = editManualAgentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", fieldErrors: parsed.error.flatten().fieldErrors, message: parsed.error.issues[0]?.message };
  const existing = await requireEntryAccess(parsed.data.entryId);
  await requireCompanyAccess(parsed.data.companyId, "FULL");
  if (existing.companyId !== parsed.data.companyId) await requireCompanyAccess(existing.companyId, "FULL");
  const session = await requireSession();
  try {
    await updateManualAgentEntry(parsed.data.entryId, { amount: parsed.data.amount, entryDate: parsed.data.entryDate, remarks: parsed.data.remarks, companyId: parsed.data.companyId, agentId: parsed.data.agentId, actorId: session.userId, requestId: randomUUID() });
    revalidatePath("/ledger"); revalidatePath("/agents"); revalidatePath(`/ledger/${parsed.data.entryId}/edit`); revalidatePath("/companies", "layout");
    return { status: "success", message: "Manual allocation updated and later balances recalculated." };
  } catch (error) { return { status: "error", message: error instanceof Error ? error.message : "The allocation could not be updated." }; }
}
