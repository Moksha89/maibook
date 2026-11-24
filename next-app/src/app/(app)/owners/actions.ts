"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
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
const entrySchema = z.object({ ownerId: z.string().uuid(), companyId: optionalCompany, entryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date."), direction: z.enum(["PAID", "RECEIVED"]), amount: z.coerce.number({ message: "Enter an amount." }).positive("Amount must be more than 0.").max(1_000_000_000), remarks: z.string().trim().max(500).transform((v) => v.toUpperCase()) });

type OwnerAccess = { id: string; createdById: string | null; companyLinks: { companyId: string }[] };

/** Super admins, the person who created the owner, or anyone with full access to one of its companies. */
async function requireOwnerAccess(owner: OwnerAccess) {
  const session = await requireSession();
  if (session.user.roles.some(({ role }) => role.key === "superadmin") || owner.createdById === session.userId) return;
  for (const link of owner.companyLinks) if (await requireCompanyAccess(link.companyId, "FULL").then(() => true, () => false)) return;
  throw new Error("You do not have access to this owner.");
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
  const parsed = entrySchema.safeParse({ ownerId: formData.get("ownerId"), companyId: formData.get("companyId") || "", entryDate: formData.get("entryDate"), direction: formData.get("direction"), amount: formData.get("amount"), remarks: formData.get("remarks") || "" });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message };
  const owner = await db.owner.findUnique({ where: { id: parsed.data.ownerId }, include: { companyLinks: true } });
  if (!owner) return { status: "error", message: "This owner no longer exists." };
  await requireOwnerAccess(owner);
  const companyId = parsed.data.companyId || null;
  if (companyId && !owner.companyLinks.some((link) => link.companyId === companyId)) return { status: "error", message: "That company is not assigned to this owner." };
  const session = await requireSession();
  const entry = await db.ownerEntry.create({ data: { ownerId: owner.id, companyId, entryDate: new Date(`${parsed.data.entryDate}T00:00:00Z`), direction: parsed.data.direction, amount: parsed.data.amount, remarks: parsed.data.remarks || null, createdById: session.userId } });
  await audit(companyId, "owner.entry.create", owner.id, { newValues: { entryId: entry.id, direction: entry.direction, amount: parsed.data.amount, entryDate: parsed.data.entryDate } });
  revalidatePath(`/owners/${owner.id}`);
  return { status: "success", message: parsed.data.direction === "PAID" ? "Payment to partner saved." : "Receipt from partner saved." };
}

export async function deleteOwnerEntryAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requirePermission("owners.update");
  const entry = await db.ownerEntry.findUnique({ where: { id: String(formData.get("entryId") || "") }, include: { owner: { include: { companyLinks: true } } } });
  if (!entry || entry.deletedAt) return { status: "error", message: "This entry no longer exists." };
  await requireOwnerAccess(entry.owner);
  await db.ownerEntry.update({ where: { id: entry.id }, data: { deletedAt: new Date() } });
  await audit(entry.companyId, "owner.entry.delete", entry.ownerId, { oldValues: { entryId: entry.id, direction: entry.direction, amount: entry.amount.toString() } });
  revalidatePath(`/owners/${entry.ownerId}`);
  return { status: "success", message: "Entry deleted." };
}

