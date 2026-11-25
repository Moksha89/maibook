/** Pure role rules for user administration (kept free of server imports so they can be unit tested). */

export const SUPER_ADMIN_ROLE = "superadmin";

type RoleHolder = { roles: { role: { key: string } }[] };

export function isSuperAdmin(user: RoleHolder | null | undefined) {
  return Boolean(user?.roles.some(({ role }) => role.key === SUPER_ADMIN_ROLE));
}

/** Only a SuperAdmin may create or promote anyone to SuperAdmin. */
export function canAssignRole(actorIsSuperAdmin: boolean, roleKey: string | null | undefined) {
  return roleKey !== SUPER_ADMIN_ROLE || actorIsSuperAdmin;
}

/** Only a SuperAdmin may edit, suspend, activate or sign out a SuperAdmin account. */
export function canManageUser(actorIsSuperAdmin: boolean, targetIsSuperAdmin: boolean) {
  return actorIsSuperAdmin || !targetIsSuperAdmin;
}
