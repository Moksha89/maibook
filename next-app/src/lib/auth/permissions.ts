import "server-only";

import { cache } from "react";

import { db } from "@/lib/db";
import { forbidden } from "next/navigation";
import { requireSession } from "./session";

export const hasPermission = cache(async function hasPermission(permissionKey: string) {
  const session = await requireSession();
  if (session.user.roles.some(({ role }) => role.key === "superadmin")) return true;

  const override = session.user.permissionOverrides.find(
    ({ permission }) => permission.key === permissionKey,
  );
  if (override) return override.effect === "GRANT";

  const roleIds = session.user.roles.map(({ roleId }) => roleId);
  return Boolean(
    await db.rolePermission.findFirst({
      where: { roleId: { in: roleIds }, permission: { key: permissionKey } },
      select: { roleId: true },
    }),
  );
});

export async function requirePermission(permissionKey: string) {
  if (!(await hasPermission(permissionKey))) forbidden();
}

export async function requireCompanyAccess(companyId: string, required: "READ" | "FULL" = "READ") {
  const session = await requireSession();
  if (session.user.roles.some(({ role }) => role.key === "superadmin")) return;

  const access = await db.companyAccess.findUnique({
    where: { userId_companyId: { userId: session.userId, companyId } },
  });
  if (!access || (required === "FULL" && access.level !== "FULL")) forbidden();
}

/** Companies the signed-in user may see: `null` means every company (SuperAdmin), otherwise the explicit company grants. */
export const accessibleCompanyIds = cache(async function accessibleCompanyIds(): Promise<string[] | null> {
  const session = await requireSession();
  if (session.user.roles.some(({ role }) => role.key === "superadmin")) return null;
  const rows = await db.companyAccess.findMany({ where: { userId: session.userId }, select: { companyId: true } });
  return rows.map(({ companyId }) => companyId);
});

/** Company-less groups are visible to anyone with the page permission; company-tied groups follow company grants. `null` companyIds means SuperAdmin (everything). */
export function groupAccessWhere(companyIds: string[] | null) {
  if (companyIds === null) return {};
  return { OR: [{ companyId: null }, { company: { deletedAt: null, id: { in: companyIds } } }] };
}

export function siteAccessWhere(companyIds: string[] | null) {
  if (companyIds === null) return {};
  return { OR: [{ uplineGroupId: null }, { uplineGroup: groupAccessWhere(companyIds) }] };
}

export async function requireGroupAccess(companyId: string | null, required: "READ" | "FULL" = "READ") {
  if (!companyId) return;
  await requireCompanyAccess(companyId, required);
}
