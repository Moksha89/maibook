"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import type { ActionState } from "@/lib/actions/types";
import { requireCompanyAccess, requirePermission } from "@/lib/auth/permissions";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { normalizeEmail, normalizeName, normalizePhone } from "@/lib/domain/normalization";
import { recordOwnerShare } from "@/lib/services/owner-share-history";

const optionalCompany = z.string().uuid().or(z.literal(""));
const contact = { name: z.string().trim().min(2, "Name must be at least 2 characters.").max(120).transform((v) => v.toUpperCase()), email: z.string().trim().email("Enter a valid email address.").or(z.literal("")), phone: z.string().trim().max(30) };
const share = z.coerce.number({ message: "Enter the share %." }).min(0, "Share must be 0 or more.").max(100, "Share cannot exceed 100%.");
const createSchema = z.object({ companyId: optionalCompany, percentage: share.optional(), ...contact });
const updateSchema = z.object({ ownerId: z.string().uuid(), ...contact });
const linkSchema = z.object({ ownerId: z.string().uuid(), companyId: z.string().uuid() });
const assignSchema = linkSchema.extend({ percentage: share });
const entrySchema = z.object({ ownerId: z.string().uuid(), entryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date."), entryTime: z.string().regex(/^\d{2}:\d{2}$/, "Choose a time.").optional(), direction: z.enum(["PAID", "RECEIVED"]), amount: z.coerce.number({ message: "Enter an amount." }).positive("Amount must be more than 0.").max(1_000_000_000), remarks: z.string().trim().max(500).transform((v) => v.toUpperCase()) });
const updateEntrySchema = entrySchema.extend({ entryId: z.string().uuid() });
const transferSchema = z.object({ fromOwnerId: z.string().uuid(), toOwnerId: z.string().uuid(), entryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date."), entryTime: z.string().regex(/^\d{2}:\d{2}$/, "Choose a time.").optional(), amount: z.coerce.number({ message: "Enter an amount." }).positive("Amount must be more than 0.").max(1_000_000_000), remarks: z.string().trim().max(500).transform((v) => v.toUpperCase()) });
const updateTransferSchema = transferSchema.extend({ entryId: z.string().uuid() });

type OwnerAccess = { id: string; createdById: string | null; normalizedName: string; companyLinks: { companyId: string }[] };

/** Super admins, the person who created the owner, or anyone with full access to one of its companies (including shareholder partnerships). */
async function ownerCompanyIds(owner: OwnerAccess) {
  const ids = new Set(owner.companyLinks.map((link) => link.companyId));
  const shareholders = await db.shareholder.findMany({ where: { deletedAt: null, normalizedName: owner.normalizedName }, select: { companyId: true } });
  for (const row of shareholders) ids.add(row.companyId);
  return ids;
}

async function requireOwnerAccess(owner: OwnerAccess) {
  const session = await requireSession();
  if (session.user.roles.some(({ role }) => role.key === "superadmin") || owner.createdById === session.userId) return;
  for (const companyId of await ownerCompanyIds(owner)) if (await requireCompanyAccess(companyId, "FULL").then(() => true, () => false)) return;
  throw new Error("You do not have access to this owner.");
}

function entryPostedAt(entryDate: string, entryTime?: string) {
  const time = entryTime && /^\d{2}:\d{2}$/.test(entryTime) ? entryTime : "00:00";
  return new Date(`${entryDate}T${time}:00+05:30`);
}

/** Move the matching shareholder balance: paid increases it (we owe less), received decreases it. */
async function applyShareholderPayment(tx: Prisma.TransactionClient, input: { ownerName: string; companyId: string; entryId: string; direction: "PAID" | "RECEIVED"; amount: Prisma.Decimal | number | string; entryDate: Date; remarks: string | null; reverse?: boolean }) {
  const shareholder = await tx.shareholder.findFirst({ where: { companyId: input.companyId, normalizedName: normalizeName(input.ownerName), deletedAt: null } });
  if (!shareholder) return;
  const signed = Number(input.amount.toString()) * (input.direction === "PAID" ? 1 : -1) * (input.reverse ? -1 : 1);
  const key = `owner-entry:${input.entryId}`;
  const existing = await tx.shareholderEntry.findFirst({ where: { distributionKey: key } });
  if (input.reverse) {
    if (existing && !existing.deletedAt) {
      await tx.shareholderEntry.update({ where: { id: existing.id }, data: { deletedAt: new Date() } });
      await tx.shareholder.update({ where: { id: shareholder.id }, data: { currentBalance: { increment: new Prisma.Decimal((-Number(existing.amount.toString())).toString()) } } });
    }
    return;
  }
  const data = { companyId: input.companyId, shareholderId: shareholder.id, source: "MANUAL_ADJUSTMENT" as const, entryDate: input.entryDate, companyProfit: 0, percentage: 0, amount: signed, remarks: input.remarks, deletedAt: null };
  if (existing) {
    if (!existing.deletedAt) await tx.shareholder.update({ where: { id: shareholder.id }, data: { currentBalance: { increment: new Prisma.Decimal((-Number(existing.amount.toString())).toString()) } } });
    await tx.shareholderEntry.update({ where: { id: existing.id }, data });
  } else {
    await tx.shareholderEntry.create({ data: { ...data, distributionKey: key } });
  }
  await tx.shareholder.update({ where: { id: shareholder.id }, data: { currentBalance: { increment: new Prisma.Decimal(signed.toString()) } } });
}

function revalidateOwnerAndCompany(ownerId: string, companyId: string | null) {
  revalidatePath(`/owners/${ownerId}`);
  revalidatePath("/owners");
  if (companyId) revalidatePath(`/companies/${companyId}`);
}

async function audit(companyId: string | null, action: string, ownerId: string, values: { oldValues?: object; newValues?: object }) {
  const session = await requireSession();
  await db.auditLog.create({ data: { actorId: session.userId, companyId, action, entityType: "Owner", entityId: ownerId, requestId: randomUUID(), ...values } });
}

const isUnique = (error: unknown) => error instanceof Error && error.message.includes("Unique");
const overHundred = (error: unknown) => error instanceof Error && (error.message.includes("cannot exceed 100") || error.message.includes("P2004"));

/** An owner assigned to a company is also that company's shareholder (same name), so it shows in the Shareholders tab and gets profit distributions. */
async function linkShareholder(tx: Prisma.TransactionClient, owner: { name: string; email: string | null; phone: string | null }, companyId: string, percentage: number) {
  const normalizedName = normalizeName(owner.name);
  const existing = await tx.shareholder.findUnique({ where: { companyId_normalizedName: { companyId, normalizedName } } });
  if (existing) return tx.shareholder.update({ where: { id: existing.id }, data: { percentage, status: "ACTIVE", deletedAt: null, phone: existing.phone ?? owner.phone, email: existing.email ?? owner.email } });
  return tx.shareholder.create({ data: { companyId, name: owner.name, normalizedName, percentage, phone: owner.phone, email: owner.email } });
}

export async function createOwnerAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requirePermission("owners.create");
  const parsed = createSchema.safeParse({ companyId: formData.get("companyId") || "", percentage: formData.get("companyId") ? formData.get("percentage") || 0 : undefined, name: formData.get("name"), email: formData.get("email") || "", phone: formData.get("phone") || "" });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message };
  const companyId = parsed.data.companyId || null;
  const session = await requireSession();
  if (companyId) await requireCompanyAccess(companyId, "FULL");
  try {
    const owner = await db.$transaction(async (tx) => {
      const created = await tx.owner.create({ data: { createdById: session.userId, name: parsed.data.name, normalizedName: normalizeName(parsed.data.name), email: parsed.data.email ? normalizeEmail(parsed.data.email) : null, phoneNumbers: parsed.data.phone ? { create: { phone: normalizePhone(parsed.data.phone), isPrimary: true } } : undefined, companyLinks: companyId ? { create: { companyId, percentage: parsed.data.percentage ?? 0 } } : undefined } });
      if (companyId) await recordOwnerShare(tx, created.id, companyId, Number(parsed.data.percentage ?? 0));
      if (companyId) await linkShareholder(tx, { name: created.name, email: created.email, phone: parsed.data.phone ? normalizePhone(parsed.data.phone) : null }, companyId, Number(parsed.data.percentage ?? 0));
      return created;
    });
    await audit(companyId, "owner.create", owner.id, { newValues: { name: owner.name, companyId, percentage: parsed.data.percentage ?? null } });
  } catch (error) { return { status: "error", message: overHundred(error) ? "Shareholder percentages for that company would go over 100%." : isUnique(error) ? "That owner already exists." : "The owner could not be created." }; }
  if (companyId) revalidatePath(`/companies/${companyId}`);
  revalidatePath("/owners");
  return { status: "success", message: "Owner or business partner created." };
}

export async function updateOwnerAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requirePermission("owners.update");
  const parsed = updateSchema.safeParse({ ownerId: formData.get("ownerId"), name: formData.get("name"), email: formData.get("email") || "", phone: formData.get("phone") || "" });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message };
  const owner = await db.owner.findUnique({ where: { id: parsed.data.ownerId }, include: { phoneNumbers: true, companyLinks: true } });
  if (!owner) return { status: "error", message: "This owner no longer exists." };
  await requireOwnerAccess(owner);
  const phone = parsed.data.phone ? normalizePhone(parsed.data.phone) : null;
  try {
    await db.$transaction([
      db.owner.update({ where: { id: owner.id }, data: { name: parsed.data.name, normalizedName: normalizeName(parsed.data.name), email: parsed.data.email ? normalizeEmail(parsed.data.email) : null } }),
      db.shareholder.updateMany({ where: { companyId: { in: owner.companyLinks.map((link) => link.companyId) }, normalizedName: owner.normalizedName, deletedAt: null }, data: { name: parsed.data.name, normalizedName: normalizeName(parsed.data.name) } }),
      db.ownerPhoneNumber.deleteMany({ where: { ownerId: owner.id } }),
      ...(phone ? [db.ownerPhoneNumber.create({ data: { ownerId: owner.id, phone, isPrimary: true } })] : []),
    ]);
  } catch (error) { return { status: "error", message: isUnique(error) ? "Another owner already has that name." : "The owner could not be updated." }; }
  await audit(owner.companyLinks[0]?.companyId ?? null, "owner.update", owner.id, { oldValues: { name: owner.name, email: owner.email, phones: owner.phoneNumbers.map((p) => p.phone) }, newValues: { name: parsed.data.name, email: parsed.data.email || null, phones: phone ? [phone] : [] } });
  revalidatePath("/owners");
  return { status: "success", message: "Owner updated." };
}

export async function assignOwnerCompanyAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requirePermission("owners.update");
  const parsed = assignSchema.safeParse({ ownerId: formData.get("ownerId"), companyId: formData.get("companyId"), percentage: formData.get("percentage") });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Choose a company to assign." };
  const owner = await db.owner.findUnique({ where: { id: parsed.data.ownerId }, include: { companyLinks: true } });
  if (!owner) return { status: "error", message: "This owner no longer exists." };
  await requireOwnerAccess(owner);
  await requireCompanyAccess(parsed.data.companyId, "FULL");
  if (owner.companyLinks.some((link) => link.companyId === parsed.data.companyId)) return { status: "error", message: "Already assigned to that company." };
  try {
    await db.$transaction(async (tx) => {
      await tx.ownerCompany.create({ data: parsed.data });
      await recordOwnerShare(tx, parsed.data.ownerId, parsed.data.companyId, Number(parsed.data.percentage));
      const phone = await tx.ownerPhoneNumber.findFirst({ where: { ownerId: owner.id }, orderBy: { isPrimary: "desc" }, select: { phone: true } });
      await linkShareholder(tx, { name: owner.name, email: owner.email, phone: phone?.phone ?? null }, parsed.data.companyId, Number(parsed.data.percentage));
    });
  } catch (error) { if (overHundred(error)) return { status: "error", message: "Shareholder percentages for that company would go over 100%." }; throw error; }
  revalidatePath(`/companies/${parsed.data.companyId}`);
  await audit(parsed.data.companyId, "owner.company.assign", owner.id, { newValues: { companyId: parsed.data.companyId, percentage: parsed.data.percentage } });
  revalidatePath(`/owners/${owner.id}`);
  revalidatePath("/owners");
  return { status: "success", message: "Company assigned." };
}

export async function unassignOwnerCompanyAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requirePermission("owners.update");
  const parsed = linkSchema.safeParse({ ownerId: formData.get("ownerId"), companyId: formData.get("companyId") });
  if (!parsed.success) return { status: "error", message: "Invalid company." };
  await requireCompanyAccess(parsed.data.companyId, "FULL");
  const owner = await db.owner.findUnique({ where: { id: parsed.data.ownerId }, select: { normalizedName: true } });
  const removed = await db.$transaction(async (tx) => {
    const result = await tx.ownerCompany.deleteMany({ where: parsed.data });
    if (result.count) await recordOwnerShare(tx, parsed.data.ownerId, parsed.data.companyId, 0);
    if (result.count && owner) await tx.shareholder.updateMany({ where: { companyId: parsed.data.companyId, normalizedName: owner.normalizedName, deletedAt: null }, data: { status: "INACTIVE", deletedAt: new Date() } });
    return result;
  });
  if (!removed.count) return { status: "error", message: "That company is not assigned." };
  revalidatePath(`/companies/${parsed.data.companyId}`);
  await audit(parsed.data.companyId, "owner.company.unassign", parsed.data.ownerId, { oldValues: { companyId: parsed.data.companyId } });
  revalidatePath(`/owners/${parsed.data.ownerId}`);
  revalidatePath("/owners");
  return { status: "success", message: "Company unassigned." };
}

export async function deleteOwnerAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requirePermission("owners.delete");
  const ownerId = String(formData.get("ownerId") || "");
  const owner = await db.owner.findUnique({ where: { id: ownerId }, include: { phoneNumbers: true, companyLinks: true } });
  if (!owner) return { status: "error", message: "This owner no longer exists." };
  await requireOwnerAccess(owner);
  if (await db.ownerEntry.count({ where: { ownerId: owner.id } })) return { status: "error", message: "This owner has payment entries, so it cannot be deleted." };
  await db.owner.delete({ where: { id: owner.id } });
  await audit(owner.companyLinks[0]?.companyId ?? null, "owner.delete", owner.id, { oldValues: { name: owner.name, email: owner.email, phones: owner.phoneNumbers.map((p) => p.phone), companyIds: owner.companyLinks.map((l) => l.companyId) } });
  revalidatePath("/owners");
  return { status: "success", message: `${owner.name} was removed.` };
}

export async function createOwnerEntryAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requirePermission("owners.update");
  const parsed = entrySchema.safeParse({ ownerId: formData.get("ownerId"), entryDate: formData.get("entryDate"), entryTime: formData.get("entryTime") || undefined, direction: formData.get("direction"), amount: formData.get("amount"), remarks: formData.get("remarks") || "" });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message };
  const owner = await db.owner.findUnique({ where: { id: parsed.data.ownerId }, include: { companyLinks: true } });
  if (!owner) return { status: "error", message: "This owner no longer exists." };
  await requireOwnerAccess(owner);
  const session = await requireSession();
  const entryDate = new Date(`${parsed.data.entryDate}T00:00:00Z`);
  const postedAt = entryPostedAt(parsed.data.entryDate, parsed.data.entryTime);
  const entry = await db.ownerEntry.create({ data: { ownerId: owner.id, companyId: null, entryDate, direction: parsed.data.direction, amount: parsed.data.amount, remarks: parsed.data.remarks || null, createdById: session.userId, createdAt: postedAt } });
  await audit(null, "owner.entry.create", owner.id, { newValues: { entryId: entry.id, direction: entry.direction, amount: parsed.data.amount, entryDate: parsed.data.entryDate, entryTime: parsed.data.entryTime } });
  revalidateOwnerAndCompany(owner.id, null);
  return { status: "success", message: parsed.data.direction === "PAID" ? "Payment to partner saved." : "Receipt from partner saved." };
}

export async function updateOwnerEntryAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requirePermission("owners.update");
  const parsed = updateEntrySchema.safeParse({ entryId: formData.get("entryId"), ownerId: formData.get("ownerId"), entryDate: formData.get("entryDate"), entryTime: formData.get("entryTime") || undefined, direction: formData.get("direction"), amount: formData.get("amount"), remarks: formData.get("remarks") || "" });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message };
  const existing = await db.ownerEntry.findUnique({ where: { id: parsed.data.entryId }, include: { owner: { include: { companyLinks: true } } } });
  if (!existing || existing.deletedAt) return { status: "error", message: "This entry no longer exists." };
  if (existing.ownerId !== parsed.data.ownerId) return { status: "error", message: "This entry no longer exists." };
  if (existing.direction === "TRANSFER_OUT" || existing.direction === "TRANSFER_IN") return { status: "error", message: "Edit this transfer from the transfer form." };
  await requireOwnerAccess(existing.owner);
  const entryDate = new Date(`${parsed.data.entryDate}T00:00:00Z`);
  const postedAt = entryPostedAt(parsed.data.entryDate, parsed.data.entryTime);
  await db.$transaction(async (tx) => {
    if (existing.companyId) await applyShareholderPayment(tx, { ownerName: existing.owner.name, companyId: existing.companyId, entryId: existing.id, direction: existing.direction === "RECEIVED" ? "RECEIVED" : "PAID", amount: existing.amount, entryDate: existing.entryDate, remarks: existing.remarks, reverse: true });
    await tx.ownerEntry.update({ where: { id: existing.id }, data: { companyId: null, entryDate, direction: parsed.data.direction, amount: parsed.data.amount, remarks: parsed.data.remarks || null, createdAt: postedAt } });
  });
  await audit(null, "owner.entry.update", existing.ownerId, { oldValues: { entryId: existing.id, direction: existing.direction, amount: existing.amount.toString(), companyId: existing.companyId }, newValues: { direction: parsed.data.direction, amount: parsed.data.amount, entryDate: parsed.data.entryDate } });
  revalidateOwnerAndCompany(existing.ownerId, existing.companyId);
  return { status: "success", message: "Entry updated." };
}

export async function deleteOwnerEntryAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requirePermission("owners.update");
  const entry = await db.ownerEntry.findUnique({ where: { id: String(formData.get("entryId") || "") }, include: { owner: { include: { companyLinks: true } } } });
  if (!entry || entry.deletedAt) return { status: "error", message: "This entry no longer exists." };
  await requireOwnerAccess(entry.owner);
  const group = await db.$transaction(async (tx) => {
    const rows = entry.groupId ? await tx.ownerEntry.findMany({ where: { groupId: entry.groupId, deletedAt: null }, include: { owner: { include: { companyLinks: true } } } }) : [entry];
    for (const row of rows) {
      if (row.ownerId !== entry.ownerId) await requireOwnerAccess(row.owner);
      if (row.companyId) await applyShareholderPayment(tx, { ownerName: row.owner.name, companyId: row.companyId, entryId: row.id, direction: row.direction === "RECEIVED" ? "RECEIVED" : "PAID", amount: row.amount, entryDate: row.entryDate, remarks: row.remarks, reverse: true });
      await tx.ownerEntry.update({ where: { id: row.id }, data: { deletedAt: new Date() } });
    }
    return rows;
  });
  await audit(entry.companyId, "owner.entry.delete", entry.ownerId, { oldValues: { entryId: entry.id, groupId: entry.groupId, direction: entry.direction, amount: entry.amount.toString() } });
  for (const row of group) revalidateOwnerAndCompany(row.ownerId, row.companyId);
  return { status: "success", message: group.length > 1 ? "Transfer deleted." : "Entry deleted." };
}

export async function createOwnerTransferAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requirePermission("owners.update");
  const parsed = transferSchema.safeParse({ fromOwnerId: formData.get("fromOwnerId"), toOwnerId: formData.get("toOwnerId"), entryDate: formData.get("entryDate"), entryTime: formData.get("entryTime") || undefined, amount: formData.get("amount"), remarks: formData.get("remarks") || "" });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message };
  if (parsed.data.fromOwnerId === parsed.data.toOwnerId) return { status: "error", message: "Choose two different partners." };
  const [fromOwner, toOwner] = await Promise.all([
    db.owner.findUnique({ where: { id: parsed.data.fromOwnerId }, include: { companyLinks: true } }),
    db.owner.findUnique({ where: { id: parsed.data.toOwnerId }, include: { companyLinks: true } }),
  ]);
  if (!fromOwner || !toOwner) return { status: "error", message: "That partner no longer exists." };
  await requireOwnerAccess(fromOwner);
  await requireOwnerAccess(toOwner);
  const session = await requireSession();
  const entryDate = new Date(`${parsed.data.entryDate}T00:00:00Z`);
  const postedAt = entryPostedAt(parsed.data.entryDate, parsed.data.entryTime);
  const remarks = parsed.data.remarks || null;
  const groupId = randomUUID();
  // Amount is not capped by the from-partner's balance; a larger amount may flip the sign.
  await db.$transaction(async (tx) => {
    await tx.ownerEntry.create({ data: { ownerId: fromOwner.id, companyId: null, entryDate, direction: "TRANSFER_OUT", amount: parsed.data.amount, remarks, createdById: session.userId, createdAt: postedAt, groupId } });
    await tx.ownerEntry.create({ data: { ownerId: toOwner.id, companyId: null, entryDate, direction: "TRANSFER_IN", amount: parsed.data.amount, remarks, createdById: session.userId, createdAt: postedAt, groupId } });
  });
  await audit(null, "owner.entry.transfer", fromOwner.id, { newValues: { groupId, fromOwnerId: fromOwner.id, toOwnerId: toOwner.id, amount: parsed.data.amount, entryDate: parsed.data.entryDate } });
  revalidateOwnerAndCompany(fromOwner.id, null);
  revalidateOwnerAndCompany(toOwner.id, null);
  return { status: "success", message: `Transfer from ${fromOwner.name} to ${toOwner.name} saved.` };
}

export async function updateOwnerTransferAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requirePermission("owners.update");
  const parsed = updateTransferSchema.safeParse({ entryId: formData.get("entryId"), fromOwnerId: formData.get("fromOwnerId"), toOwnerId: formData.get("toOwnerId"), entryDate: formData.get("entryDate"), entryTime: formData.get("entryTime") || undefined, amount: formData.get("amount"), remarks: formData.get("remarks") || "" });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message };
  if (parsed.data.fromOwnerId === parsed.data.toOwnerId) return { status: "error", message: "Choose two different partners." };
  const existing = await db.ownerEntry.findUnique({ where: { id: parsed.data.entryId }, include: { owner: { include: { companyLinks: true } } } });
  if (!existing || existing.deletedAt) return { status: "error", message: "This entry no longer exists." };
  if (existing.direction !== "TRANSFER_OUT" && existing.direction !== "TRANSFER_IN") return { status: "error", message: "This is not a transfer." };
  const group = existing.groupId ? await db.ownerEntry.findMany({ where: { groupId: existing.groupId, deletedAt: null }, include: { owner: { include: { companyLinks: true } } } }) : [existing];
  for (const row of group) await requireOwnerAccess(row.owner);
  const [fromOwner, toOwner] = await Promise.all([
    db.owner.findUnique({ where: { id: parsed.data.fromOwnerId }, include: { companyLinks: true } }),
    db.owner.findUnique({ where: { id: parsed.data.toOwnerId }, include: { companyLinks: true } }),
  ]);
  if (!fromOwner || !toOwner) return { status: "error", message: "That partner no longer exists." };
  await requireOwnerAccess(fromOwner);
  await requireOwnerAccess(toOwner);
  const session = await requireSession();
  const entryDate = new Date(`${parsed.data.entryDate}T00:00:00Z`);
  const postedAt = entryPostedAt(parsed.data.entryDate, parsed.data.entryTime);
  const remarks = parsed.data.remarks || null;
  const groupId = randomUUID();
  await db.$transaction(async (tx) => {
    for (const row of group) {
      if (row.companyId) await applyShareholderPayment(tx, { ownerName: row.owner.name, companyId: row.companyId, entryId: row.id, direction: row.direction === "RECEIVED" ? "RECEIVED" : "PAID", amount: row.amount, entryDate: row.entryDate, remarks: row.remarks, reverse: true });
      await tx.ownerEntry.update({ where: { id: row.id }, data: { deletedAt: new Date() } });
    }
    await tx.ownerEntry.create({ data: { ownerId: fromOwner.id, companyId: null, entryDate, direction: "TRANSFER_OUT", amount: parsed.data.amount, remarks, createdById: session.userId, createdAt: postedAt, groupId } });
    await tx.ownerEntry.create({ data: { ownerId: toOwner.id, companyId: null, entryDate, direction: "TRANSFER_IN", amount: parsed.data.amount, remarks, createdById: session.userId, createdAt: postedAt, groupId } });
  });
  await audit(null, "owner.entry.transfer.update", fromOwner.id, { oldValues: { entryId: existing.id, groupId: existing.groupId }, newValues: { groupId, fromOwnerId: fromOwner.id, toOwnerId: toOwner.id, amount: parsed.data.amount } });
  for (const row of group) revalidateOwnerAndCompany(row.ownerId, row.companyId);
  revalidateOwnerAndCompany(fromOwner.id, null);
  revalidateOwnerAndCompany(toOwner.id, null);
  return { status: "success", message: `Transfer from ${fromOwner.name} to ${toOwner.name} saved.` };
}
