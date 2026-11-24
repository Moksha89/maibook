import { redirect } from "next/navigation";
import { connection } from "next/server";

import { AppShell } from "@/components/layout/app-shell";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";

export default async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  await connection();
  const session = await getSession();
  if (!session) redirect("/login");
  const roles = session.user.roles.map(({ role }) => role);
  const primaryRole = roles.find((role) => role.key === "superadmin") ?? roles[0];
  const isSuperAdmin = primaryRole?.key === "superadmin";
  const permissions = isSuperAdmin ? (await db.permission.findMany({ select: { key: true } })).map(({ key }) => key) : (await db.permission.findMany({ where: { roles: { some: { roleId: { in: session.user.roles.map(({ roleId }) => roleId) } } } }, select: { key: true } })).map(({ key }) => key);
  for (const override of session.user.permissionOverrides) { const index = permissions.indexOf(override.permission.key); if (override.effect === "GRANT" && index === -1) permissions.push(override.permission.key); if (override.effect === "DENY" && index !== -1) permissions.splice(index, 1); }

  return <AppShell displayName={session.user.displayName} roleName={primaryRole?.name ?? "User"} isSuperAdmin={isSuperAdmin} permissions={permissions}>{children}</AppShell>;
}
