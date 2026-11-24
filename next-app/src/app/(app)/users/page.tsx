import type { Metadata } from "next";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { hasPermission, requirePermission } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import { changeUserStatusAction, revokeUserSessionsAction } from "./actions";
import { FormModal } from "@/components/ui/form-modal";
import { EditUserForm } from "./edit-user-form";
import { UserForm } from "./user-form";

export const metadata: Metadata = { title: "Users" };

export default async function UsersPage() {
  await requirePermission("users.read");
  const [canCreate, canUpdate, canRevoke, roles, companies, users, permissions] = await Promise.all([
    hasPermission("users.create"),
    hasPermission("users.update"),
    hasPermission("users.revoke_sessions"),
    db.role.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.company.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.user.findMany({ include: { permissionOverrides: { include: { permission: { select: { module: true } } } }, roles: { include: { role: true } }, companyAccess: { include: { company: { select: { name: true } } } }, sessions: { where: { revokedAt: null, expiresAt: { gt: new Date() } }, select: { id: true } }, devices: { where: { revokedAt: null }, select: { id: true } } }, orderBy: { displayName: "asc" }, take: 200 }),
    db.permission.findMany({ select: { module: true }, orderBy: { module: "asc" } }),
  ]);
  const modules = [...new Set(permissions.map((permission) => permission.module))];
  return <><PageHeader title="Users" description="Role, company access, account expiry, device limits, and session security." />{canCreate ? <UserForm roles={roles} companies={companies} /> : null}<section className="mt-3 overflow-hidden rounded-lg border bg-white"><div className="border-b px-3 py-2"><h2 className="text-sm font-bold">User directory</h2></div><div className="overflow-x-auto"><table className="w-full min-w-[1050px] text-left text-xs"><thead className="bg-[#fff4d7] text-[#59400f]"><tr><th className="px-3 py-2">User</th><th className="px-3 py-2">Role</th><th className="px-3 py-2">Company access</th><th className="px-3 py-2">Sessions</th><th className="px-3 py-2">Devices</th><th className="px-3 py-2">Last login</th><th className="px-3 py-2">Status</th><th className="sticky right-0 bg-[#fff4d7] px-3 py-2">Actions</th></tr></thead><tbody>{users.map((user) => <tr key={user.id} className="border-t hover:bg-[#fafbfc]"><td className="px-3 py-2"><div className="font-semibold">{user.displayName}</div><div className="text-[11px] text-[#647386]">{user.username}{user.email ? ` · ${user.email}` : ""}</div></td><td className="px-3 py-2">{user.roles.map(({ role }) => role.name).join(", ") || "—"}</td><td className="max-w-[280px] px-3 py-2">{user.companyAccess.map((access) => `${access.company.name} (${access.level.toLowerCase()})`).join(", ") || "All or role default"}</td><td className="px-3 py-2 font-mono">{user.sessions.length}</td><td className="px-3 py-2 font-mono">{user.devices.length}/{user.maxDevices}</td><td className="px-3 py-2">{user.lastLoginAt?.toLocaleString() || "Never"}</td><td className="px-3 py-2"><StatusBadge tone={user.status === "ACTIVE" ? "success" : "neutral"}>{user.status}</StatusBadge></td><td className="sticky right-0 bg-white px-3 py-2"><div className="flex gap-1">{canUpdate ? <FormModal compact size="xl" trigger="Edit" title={`Edit ${user.displayName}`}><EditUserForm modules={modules} roles={roles} companies={companies} user={{ id: user.id, displayName: user.displayName, username: user.username, email: user.email, phone: user.phone, roleId: user.roles[0]?.roleId ?? "", maxDevices: user.maxDevices, expiresAt: user.expiresAt ? user.expiresAt.toISOString().slice(0, 10) : "", otpEnabled: user.otpEnabled, accessLevel: user.companyAccess[0]?.level ?? "FULL", companyIds: user.companyAccess.map((access) => access.companyId), overrides: Object.fromEntries(modules.flatMap((module) => { const items = user.permissionOverrides.filter((override) => override.permission.module === module); return items.length && items.every((item) => item.effect === items[0].effect) ? [[module, items[0].effect]] : []; })) }} /></FormModal> : null}{canUpdate ? <form action={changeUserStatusAction}><input type="hidden" name="userId" value={user.id} /><input type="hidden" name="status" value={user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE"} /><Button type="submit" size="xs" iconOnly variant="secondary">{user.status === "ACTIVE" ? "Suspend" : "Activate"}</Button></form> : null}{canRevoke ? <form action={revokeUserSessionsAction}><input type="hidden" name="userId" value={user.id} /><Button type="submit" size="xs" iconOnly variant="secondary">Revoke sessions</Button></form> : null}</div></td></tr>)}</tbody></table></div></section></>;
}
