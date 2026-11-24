"use server";

import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { requireCompanyAccess, requirePermission } from "@/lib/auth/permissions";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { normalizeName } from "@/lib/domain/normalization";
import type { ActionState } from "@/lib/actions/types";
import { companySchema, updateCompanySchema } from "@/lib/validation/company";

function slugify(value: string) {
  const base = normalizeName(value).replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return `${base || "company"}-${randomUUID().slice(0, 6)}`;
}

export async function createCompanyAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requirePermission("companies.create");
  const session = await requireSession();
  const parsed = companySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", fieldErrors: parsed.error.flatten().fieldErrors };

  try {
    const company = await db.company.create({
      data: {
        name: parsed.data.name,
        normalizedName: normalizeName(parsed.data.name),
        slug: slugify(parsed.data.name),
        code: parsed.data.code || null,
        notes: parsed.data.notes || null,
        currency: "INR",
        defaultRate: null,
        auditLogs: { create: { actorId: session.userId, action: "company.create", entityType: "Company", requestId: randomUUID(), newValues: { name: parsed.data.name, code: parsed.data.code, notes: parsed.data.notes } } },
      },
    });
    revalidatePath("/", "layout");
    return { status: "success", message: `${company.name} was created.` };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { status: "error", message: "A company with this name or code already exists." };
    throw error;
  }
}

export async function changeCompanyStatusAction(formData: FormData) {
  await requirePermission("companies.update");
  const session = await requireSession();
  const companyId = String(formData.get("companyId") || "");
  await requireCompanyAccess(companyId, "FULL");
  const status = formData.get("status") === "ACTIVE" ? "ACTIVE" : "INACTIVE";
  await db.company.update({
    where: { id: companyId },
    data: {
      status,
      auditLogs: { create: { actorId: session.userId, action: "company.status.update", entityType: "Company", requestId: randomUUID(), newValues: { status } } },
    },
  });
  revalidatePath("/companies");
}

export async function updateCompanyAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requirePermission("companies.update");
  const parsed = updateCompanySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message, fieldErrors: parsed.error.flatten().fieldErrors };
  await requireCompanyAccess(parsed.data.companyId, "FULL");
  const session = await requireSession();
  const existing = await db.company.findFirst({ where: { id: parsed.data.companyId, deletedAt: null } });
  if (!existing) return { status: "error", message: "This company no longer exists." };
  const defaultRate = parsed.data.defaultRate === "" || parsed.data.defaultRate === undefined ? null : parsed.data.defaultRate;
  try {
    await db.company.update({
      where: { id: existing.id },
      data: {
        name: parsed.data.name,
        normalizedName: normalizeName(parsed.data.name),
        code: parsed.data.code || null,
        contactPhone: parsed.data.contactPhone || null,
        contactEmail: parsed.data.contactEmail || null,
        notes: parsed.data.notes || null,
        currency: parsed.data.currency,
        defaultRate,
        reportHeader: parsed.data.reportHeader || null,
        reportFooter: parsed.data.reportFooter || null,
        auditLogs: { create: { actorId: session.userId, action: "company.update", entityType: "Company", requestId: randomUUID(), oldValues: { name: existing.name, code: existing.code, currency: existing.currency, defaultRate: existing.defaultRate?.toString() ?? null }, newValues: { name: parsed.data.name, code: parsed.data.code || null, currency: parsed.data.currency, defaultRate } } },
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { status: "error", message: "A company with this name or code already exists." };
    throw error;
  }
  revalidatePath("/companies");
  revalidatePath(`/companies/${existing.id}`);
  return { status: "success", message: "Company updated." };
}

export async function setCompanyStatusAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await changeCompanyStatusAction(formData);
  return { status: "success" };
}

export async function deleteCompanyAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requirePermission("companies.delete");
  const companyId = String(formData.get("companyId") || "");
  await requireCompanyAccess(companyId, "FULL");
  const session = await requireSession();
  const company = await db.company.findFirst({ where: { id: companyId, deletedAt: null }, include: { _count: { select: { ledgerEntries: true, settlements: true } } } });
  if (!company) return { status: "error", message: "This company no longer exists." };
  const [activeAgents, activeIdentifiers] = await Promise.all([db.companyAgent.count({ where: { companyId, removedAt: null } }), db.agentIdentifier.count({ where: { companyId, deletedAt: null } })]);
  if (company._count.ledgerEntries || company._count.settlements) return { status: "error", message: "This company has ledger or settlement history and cannot be removed. Deactivate it instead." };
  if (activeAgents || activeIdentifiers) return { status: "error", message: "Remove its agents and IDs first, or deactivate the company." };
  const suffix = `~deleted-${company.id.slice(0, 8)}`;
  await db.company.update({
    where: { id: company.id },
    data: { deletedAt: new Date(), status: "INACTIVE", normalizedName: `${company.normalizedName}${suffix}`, slug: `${company.slug}${suffix}`, code: null, auditLogs: { create: { actorId: session.userId, action: "company.delete", entityType: "Company", requestId: randomUUID(), oldValues: { name: company.name, code: company.code } } } },
  });
  revalidatePath("/companies");
  revalidatePath("/dashboard");
  return { status: "success", message: `${company.name} was removed.` };
}
