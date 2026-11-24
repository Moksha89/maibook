"use server";

import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { ActionState } from "@/lib/actions/types";
import { requireCompanyAccess, requirePermission } from "@/lib/auth/permissions";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { decimal, splitCreditDebit } from "@/lib/domain/finance";
import { normalizeEmail, normalizeName, normalizePhone } from "@/lib/domain/normalization";
import { distributeCompanyProfit } from "@/lib/services/profit-distribution";
import { financialTransaction } from "@/lib/services/financial-transaction";
import { recalculateNonAgentBalances } from "@/lib/services/ledger";
import { manualUplineEntrySchema, profitDistributionSchema, shareholderSchema, uplineGroupSchema, uplineSchema } from "@/lib/validation/company-workspace";

export async function createUplineAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requirePermission("uplines.create");
  const parsed = uplineSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message, fieldErrors: parsed.error.flatten().fieldErrors };
  await requireCompanyAccess(parsed.data.companyId, "FULL");
  try {
    await db.upline.create({ data: { ...parsed.data, normalizedName: normalizeName(parsed.data.name) } });
    revalidatePath("/", "layout");
    revalidatePath(`/companies/${parsed.data.companyId}`);
    return { status: "success", message: `${parsed.data.name} was added.` };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { status: "error", message: "An upline with this name already exists." };
    throw error;
  }
}

export async function createUplineGroupAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requirePermission("uplines.create");
  const selectedUplineIds = formData.getAll("uplineIds").map(String);
  const parsed = uplineGroupSchema.safeParse({ companyId: formData.get("companyId"), name: formData.get("name"), uplineIds: selectedUplineIds, percentages: selectedUplineIds.map((id) => formData.get(`percentage-${id}`)) });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message };
  await requireCompanyAccess(parsed.data.companyId, "FULL");
  const validCount = await db.upline.count({ where: { id: { in: parsed.data.uplineIds }, companyId: parsed.data.companyId, deletedAt: null } });
  if (validCount !== parsed.data.uplineIds.length) return { status: "error", message: "One or more uplines do not belong to this company." };
  try { await db.uplineGroup.create({ data: { companyId: parsed.data.companyId, name: parsed.data.name, normalizedName: normalizeName(parsed.data.name), members: { create: parsed.data.uplineIds.map((uplineId, index) => ({ uplineId, percentageRate: parsed.data.percentages[index] })) } } }); revalidatePath(`/companies/${parsed.data.companyId}`); revalidatePath("/upline-groups"); return { status: "success", message: "Upline group created." }; } catch (error) { if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { status: "error", message: "An upline group with this name already exists." }; throw error; }
}

export async function createManualUplineEntryAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requirePermission("uplines.distribute");
  const parsed = manualUplineEntrySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message, fieldErrors: parsed.error.flatten().fieldErrors };
  await requireCompanyAccess(parsed.data.companyId, "FULL");
  const session = await requireSession();
  await financialTransaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${parsed.data.companyId}))`;
    await tx.$queryRaw`SELECT "id" FROM "uplines" WHERE "id" = ${parsed.data.uplineId}::uuid FOR UPDATE`;
    const upline = await tx.upline.findFirstOrThrow({ where: { id: parsed.data.uplineId, companyId: parsed.data.companyId, deletedAt: null } });
    const amount = decimal(parsed.data.amount).toDecimalPlaces(8);
    if (amount.isZero()) throw new Error("Amount must be at least 0.00000001 in magnitude.");
    const opening = decimal(upline.currentBalance.toString());
    const closing = opening.add(amount);
    const amounts = splitCreditDebit(amount);
    await tx.uplineEntry.create({ data: { companyId: parsed.data.companyId, uplineId: upline.id, source: "MANUAL", entryDate: parsed.data.entryDate, amount: new Prisma.Decimal(amount.toString()), remarks: parsed.data.remarks || null, createdById: session.userId } });
    await tx.ledgerEntry.create({ data: { companyId: parsed.data.companyId, entryType: "MANUAL_UPLINE", entryDate: parsed.data.entryDate, remarks: parsed.data.remarks || `Manual upline entry for ${upline.name}`, createdById: session.userId, lines: { create: { companyId: parsed.data.companyId, accountType: "UPLINE", uplineId: upline.id, coins: new Prisma.Decimal(amount.toString()), rate: 1, cashValue: new Prisma.Decimal(amount.toString()), credit: new Prisma.Decimal(amounts.credit.toString()), debit: new Prisma.Decimal(amounts.debit.toString()), openingBalance: new Prisma.Decimal(opening.toString()), closingBalance: new Prisma.Decimal(closing.toString()), sequence: 1 } } } });
    await tx.upline.update({ where: { id: upline.id }, data: { currentBalance: new Prisma.Decimal(closing.toString()) } });
    await recalculateNonAgentBalances(tx, parsed.data.companyId);
    await tx.auditLog.create({ data: { actorId: session.userId, companyId: parsed.data.companyId, action: "upline.manual_entry.create", entityType: "Upline", entityId: upline.id, requestId: randomUUID(), newValues: { amount: amount.toString(), excludedFromShareholderProfit: true } } });
  });
  revalidatePath(`/companies/${parsed.data.companyId}`);
  return { status: "success", message: "Manual upline entry posted. It is excluded from shareholder profit." };
}

export async function createShareholderAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requirePermission("shareholders.create");
  const parsed = shareholderSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message, fieldErrors: parsed.error.flatten().fieldErrors };
  await requireCompanyAccess(parsed.data.companyId, "FULL");
  try {
    await db.shareholder.create({ data: { companyId: parsed.data.companyId, name: parsed.data.name, normalizedName: normalizeName(parsed.data.name), percentage: parsed.data.percentage, phone: parsed.data.phone ? normalizePhone(parsed.data.phone) : null, email: parsed.data.email ? normalizeEmail(parsed.data.email) : null } });
    revalidatePath(`/companies/${parsed.data.companyId}`);
    return { status: "success", message: `${parsed.data.name} was added.` };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { status: "error", message: "A shareholder with this name already exists." };
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2004") return { status: "error", message: "Active shareholder percentages cannot exceed 100 percent." };
    if (error instanceof Error && error.message.includes("cannot exceed 100")) return { status: "error", message: "Active shareholder percentages cannot exceed 100 percent." };
    throw error;
  }
}

export async function distributeProfitAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requirePermission("shareholders.distribute");
  const parsed = profitDistributionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message, fieldErrors: parsed.error.flatten().fieldErrors };
  await requireCompanyAccess(parsed.data.companyId, "FULL");
  const session = await requireSession();
  try {
    const result = await distributeCompanyProfit({ ...parsed.data, actorId: session.userId, requestId: randomUUID() });
    revalidatePath(`/companies/${parsed.data.companyId}`);
    return { status: "success", message: result.duplicate ? "This profit period was already distributed." : `${result.companyProfit.toFixed(2)} distributed across ${result.allocationCount} shareholders.`, data: { idempotencyKey: randomUUID() } };
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "Profit could not be distributed." };
  }
}

function overHundred(error: unknown) {
  return (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2004") || (error instanceof Error && error.message.includes("cannot exceed 100"));
}

const updateUplineSchema = uplineSchema.omit({ companyId: true }).extend({ uplineId: z.string().uuid() });
const updateShareholderSchema = shareholderSchema.omit({ companyId: true }).extend({ shareholderId: z.string().uuid() });

async function auditCompany(companyId: string, action: string, entityType: string, entityId: string, values?: { oldValues?: Prisma.InputJsonValue; newValues?: Prisma.InputJsonValue }) {
  const session = await requireSession();
  await db.auditLog.create({ data: { actorId: session.userId, companyId, action, entityType, entityId, requestId: randomUUID(), ...values } });
}

export async function updateUplineAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requirePermission("uplines.update");
  const parsed = updateUplineSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message };
  const upline = await db.upline.findFirst({ where: { id: parsed.data.uplineId, deletedAt: null } });
  if (!upline) return { status: "error", message: "This upline no longer exists." };
  await requireCompanyAccess(upline.companyId, "FULL");
  try { await db.upline.update({ where: { id: upline.id }, data: { name: parsed.data.name, normalizedName: normalizeName(parsed.data.name), percentageRate: parsed.data.percentageRate } }); }
  catch (error) { if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { status: "error", message: "An upline with this name already exists." }; throw error; }
  await auditCompany(upline.companyId, "upline.update", "Upline", upline.id, { oldValues: { name: upline.name, percentageRate: upline.percentageRate.toString() }, newValues: { name: parsed.data.name, percentageRate: parsed.data.percentageRate } });
  revalidatePath(`/companies/${upline.companyId}`);
  return { status: "success", message: "Upline updated." };
}

export async function setUplineStatusAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requirePermission("uplines.update");
  const uplineId = String(formData.get("uplineId") || "");
  const status = formData.get("status") === "ACTIVE" ? "ACTIVE" : "INACTIVE";
  const upline = await db.upline.findFirst({ where: { id: uplineId, deletedAt: null } });
  if (!upline) return { status: "error", message: "This upline no longer exists." };
  await requireCompanyAccess(upline.companyId, "FULL");
  await db.upline.update({ where: { id: upline.id }, data: { status } });
  await auditCompany(upline.companyId, `upline.${status === "ACTIVE" ? "activate" : "deactivate"}`, "Upline", upline.id, { newValues: { status } });
  revalidatePath(`/companies/${upline.companyId}`);
  return { status: "success" };
}

export async function deleteUplineAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requirePermission("uplines.delete");
  const uplineId = String(formData.get("uplineId") || "");
  const upline = await db.upline.findFirst({ where: { id: uplineId, deletedAt: null }, include: { _count: { select: { entries: true, ledgerLines: true, groups: true } } } });
  if (!upline) return { status: "error", message: "This upline no longer exists." };
  await requireCompanyAccess(upline.companyId, "FULL");
  if (upline._count.entries || upline._count.ledgerLines) return { status: "error", message: "This upline has ledger history and cannot be removed. Deactivate it instead." };
  if (upline._count.groups) return { status: "error", message: "Remove this upline from its groups first." };
  if (!upline.currentBalance.isZero()) return { status: "error", message: "Clear the balance before removing this upline." };
  await db.upline.update({ where: { id: upline.id }, data: { deletedAt: new Date(), status: "INACTIVE", normalizedName: `${upline.normalizedName}~deleted-${upline.id.slice(0, 8)}` } });
  await auditCompany(upline.companyId, "upline.delete", "Upline", upline.id, { oldValues: { name: upline.name } });
  revalidatePath(`/companies/${upline.companyId}`);
  return { status: "success", message: `${upline.name} was removed.` };
}

export async function updateShareholderAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requirePermission("shareholders.update");
  const parsed = updateShareholderSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message };
  const shareholder = await db.shareholder.findFirst({ where: { id: parsed.data.shareholderId, deletedAt: null } });
  if (!shareholder) return { status: "error", message: "This shareholder no longer exists." };
  await requireCompanyAccess(shareholder.companyId, "FULL");
  try { await db.shareholder.update({ where: { id: shareholder.id }, data: { name: parsed.data.name, normalizedName: normalizeName(parsed.data.name), percentage: parsed.data.percentage, phone: parsed.data.phone ? normalizePhone(parsed.data.phone) : null, email: parsed.data.email ? normalizeEmail(parsed.data.email) : null } }); }
  catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { status: "error", message: "A shareholder with this name already exists." };
    if (overHundred(error)) return { status: "error", message: "Active shareholder percentages cannot exceed 100 percent." };
    throw error;
  }
  await auditCompany(shareholder.companyId, "shareholder.update", "Shareholder", shareholder.id, { oldValues: { name: shareholder.name, percentage: shareholder.percentage.toString() }, newValues: { name: parsed.data.name, percentage: parsed.data.percentage } });
  revalidatePath(`/companies/${shareholder.companyId}`);
  return { status: "success", message: "Shareholder updated." };
}

export async function setShareholderStatusAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requirePermission("shareholders.update");
  const shareholderId = String(formData.get("shareholderId") || "");
  const status = formData.get("status") === "ACTIVE" ? "ACTIVE" : "INACTIVE";
  const shareholder = await db.shareholder.findFirst({ where: { id: shareholderId, deletedAt: null } });
  if (!shareholder) return { status: "error", message: "This shareholder no longer exists." };
  await requireCompanyAccess(shareholder.companyId, "FULL");
  try { await db.shareholder.update({ where: { id: shareholder.id }, data: { status } }); }
  catch (error) { if (overHundred(error)) return { status: "error", message: "Active shareholder percentages cannot exceed 100 percent." }; throw error; }
  await auditCompany(shareholder.companyId, `shareholder.${status === "ACTIVE" ? "activate" : "deactivate"}`, "Shareholder", shareholder.id, { newValues: { status } });
  revalidatePath(`/companies/${shareholder.companyId}`);
  return { status: "success" };
}

export async function deleteShareholderAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requirePermission("shareholders.delete");
  const shareholderId = String(formData.get("shareholderId") || "");
  const shareholder = await db.shareholder.findFirst({ where: { id: shareholderId, deletedAt: null }, include: { _count: { select: { entries: true } } } });
  if (!shareholder) return { status: "error", message: "This shareholder no longer exists." };
  await requireCompanyAccess(shareholder.companyId, "FULL");
  if (shareholder._count.entries) return { status: "error", message: "This shareholder has profit entries and cannot be removed. Deactivate it instead." };
  if (!shareholder.currentBalance.isZero()) return { status: "error", message: "Clear the balance before removing this shareholder." };
  await db.shareholder.update({ where: { id: shareholder.id }, data: { deletedAt: new Date(), status: "INACTIVE", normalizedName: `${shareholder.normalizedName}~deleted-${shareholder.id.slice(0, 8)}` } });
  await auditCompany(shareholder.companyId, "shareholder.delete", "Shareholder", shareholder.id, { oldValues: { name: shareholder.name } });
  revalidatePath(`/companies/${shareholder.companyId}`);
  return { status: "success", message: `${shareholder.name} was removed.` };
}
