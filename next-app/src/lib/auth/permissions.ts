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
