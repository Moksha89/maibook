"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { forbidden } from "next/navigation";
import { z } from "zod";

import type { ActionState } from "@/lib/actions/types";
import { accessibleCompanyIds, requireGroupAccess, requirePermission } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import { normalizeName } from "@/lib/domain/normalization";

const siteSchema = z.object({
  name: z.string().trim().min(1, "Enter a site name.").max(120),
  uplinePercentage: z.coerce.number({ message: "Enter the upline percentage." }).min(0, "Percentage must be 0 to 100.").max(100, "Percentage must be 0 to 100."),
});

function refresh(groupIds: (string | null | undefined)[] = [], siteId?: string) {
  revalidatePath("/sites"); revalidatePath("/upline-groups");
  for (const id of groupIds) if (id) revalidatePath(`/upline-groups/${id}`);
  if (siteId) revalidatePath(`/sites/${siteId}`);
}

/**
 * A site assigned to a company-tied upline group needs FULL access to that company.
 * A site in a company-less group, or an unassigned site, is shared; a scoped user may only change it when none of its IDs sit in a company they cannot access.
 */
async function requireSiteAccess(site: { id: string; uplineGroupId: string | null }) {
  if (site.uplineGroupId) {
    const group = await db.uplineGroup.findUnique({ where: { id: site.uplineGroupId }, select: { companyId: true } });
    if (group?.companyId) { await requireGroupAccess(group.companyId, "FULL"); return; }
  }
  const companyIds = await accessibleCompanyIds();
  if (companyIds === null) return;
  const outside = await db.agentIdentifier.findFirst({ where: { siteId: site.id, companyId: { notIn: companyIds, not: null } }, select: { id: true } });
  if (outside) forbidden();
}

function duplicate(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export async function createSiteAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requirePermission("uplines.create");
  const parsed = siteSchema.safeParse({ name: formData.get("name"), uplinePercentage: formData.get("uplinePercentage") });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message };
  const groupId = String(formData.get("uplineGroupId") || "") || null;
  if (groupId) {
    const group = await db.uplineGroup.findUnique({ where: { id: groupId } });
    if (!group) return { status: "error", message: "This upline group no longer exists." };
    await requireGroupAccess(group.companyId, "FULL");
  }
  try {
    const created = await db.site.create({ data: { name: parsed.data.name, normalizedName: normalizeName(parsed.data.name), uplinePercentage: parsed.data.uplinePercentage, uplineGroupId: groupId } });
    refresh([groupId], created.id);
  } catch (error) { if (duplicate(error)) return { status: "error", message: "A site with this name already exists." }; throw error; }
  return { status: "success", message: `${parsed.data.name} was added.` };
}

export async function updateSiteAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requirePermission("uplines.update");
  const site = await db.site.findUnique({ where: { id: String(formData.get("siteId") || "") } });
  if (!site) return { status: "error", message: "This site no longer exists." };
  await requireSiteAccess(site);
  const parsed = siteSchema.safeParse({ name: formData.get("name"), uplinePercentage: formData.get("uplinePercentage") });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message };
  const groupChange = formData.has("uplineGroupId") ? String(formData.get("uplineGroupId") || "") || null : undefined;
  if (groupChange) {
    const group = await db.uplineGroup.findUnique({ where: { id: groupChange } });
    if (!group) return { status: "error", message: "This upline group no longer exists." };
    await requireGroupAccess(group.companyId, "FULL");
  }
  try {
    await db.site.update({ where: { id: site.id }, data: { name: parsed.data.name, normalizedName: normalizeName(parsed.data.name), uplinePercentage: parsed.data.uplinePercentage, ...(groupChange !== undefined ? { uplineGroupId: groupChange } : {}) } });
  } catch (error) { if (duplicate(error)) return { status: "error", message: "A site with this name already exists." }; throw error; }
  refresh([site.uplineGroupId, groupChange], site.id);
  return { status: "success", message: "Site updated." };
}

export async function assignSiteGroupAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requirePermission("uplines.update");
  const site = await db.site.findUnique({ where: { id: String(formData.get("siteId") || "") } });
  if (!site) return { status: "error", message: "This site no longer exists." };
  await requireSiteAccess(site);
  const groupId = String(formData.get("uplineGroupId") || "") || null;
  if (groupId) {
    const group = await db.uplineGroup.findUnique({ where: { id: groupId } });
    if (!group) return { status: "error", message: "This upline group no longer exists." };
    await requireGroupAccess(group.companyId, "FULL");
  }
  await db.site.update({ where: { id: site.id }, data: { uplineGroupId: groupId } });
  refresh([site.uplineGroupId, groupId], site.id);
  return { status: "success", message: groupId ? "Site assigned." : "Site unassigned." };
}

export async function deleteSiteAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requirePermission("uplines.delete");
  const site = await db.site.findUnique({ where: { id: String(formData.get("siteId") || "") } });
  if (!site) return { status: "error", message: "This site no longer exists." };
  await requireSiteAccess(site);
  await db.site.delete({ where: { id: site.id } });
  refresh([site.uplineGroupId], site.id);
  return { status: "success", message: `${site.name} was deleted.` };
}
