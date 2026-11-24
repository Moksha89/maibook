"use server";

import { randomUUID } from "node:crypto";
import { hash } from "bcryptjs";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

import type { ActionState } from "@/lib/actions/types";
import { requirePermission } from "@/lib/auth/permissions";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { normalizeEmail, normalizeName, normalizePhone } from "@/lib/domain/normalization";
import { createUserSchema, updateUserSchema } from "@/lib/validation/user";

export async function createUserAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requirePermission("users.create");
  const parsed = createUserSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message, fieldErrors: parsed.error.flatten().fieldErrors };
  const actor = await requireSession();
  const companyIds = [...new Set(formData.getAll("companyIds").map(String))];
  const accessLevel: "READ" | "FULL" = formData.get("accessLevel") === "READ" ? "READ" : "FULL";
  try {
    const user = await db.user.create({
      data: {
        username: parsed.data.username,
        normalizedUsername: normalizeName(parsed.data.username),
        displayName: parsed.data.displayName,
        email: parsed.data.email || null,
        normalizedEmail: parsed.data.email ? normalizeEmail(parsed.data.email) : null,
        phone: parsed.data.phone || null,
        normalizedPhone: parsed.data.phone ? normalizePhone(parsed.data.phone) : null,
        passwordHash: await hash(parsed.data.password, 12),
        maxDevices: parsed.data.maxDevices,
        expiresAt: parsed.data.expiresAt,
        roles: { create: { roleId: parsed.data.roleId } },
        companyAccess: { create: companyIds.map((companyId) => ({ company: { connect: { id: companyId } }, level: accessLevel })) },
      },
    });
    await db.auditLog.create({ data: { actorId: actor.userId, action: "user.create", entityType: "User", entityId: user.id, requestId: randomUUID(), newValues: { username: user.username, roleId: parsed.data.roleId, companyIds, accessLevel } } });
    revalidatePath("/users");
    return { status: "success", message: `${user.displayName} was created.` };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { status: "error", message: "That username, email, or phone is already in use." };
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") return { status: "error", message: "One of the selected companies or roles is unavailable." };
    throw error;
  }
}

export async function changeUserStatusAction(formData: FormData) {
  await requirePermission("users.update");
  const actor = await requireSession();
  const userId = String(formData.get("userId") || "");
  const status = formData.get("status") === "ACTIVE" ? "ACTIVE" : "SUSPENDED";
  if (userId === actor.userId && status === "SUSPENDED") throw new Error("You cannot suspend your own account.");
  await db.$transaction([
    db.user.update({ where: { id: userId }, data: { status } }),
    ...(status === "SUSPENDED" ? [db.session.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } })] : []),
    db.auditLog.create({ data: { actorId: actor.userId, action: `user.${status.toLowerCase()}`, entityType: "User", entityId: userId, requestId: randomUUID() } }),
  ]);
  revalidatePath("/users");
}

export async function revokeUserSessionsAction(formData: FormData) {
  await requirePermission("users.revoke_sessions");
  const actor = await requireSession();
  const userId = String(formData.get("userId") || "");
  await db.$transaction([
    db.session.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } }),
    db.deviceRegistration.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } }),
    db.auditLog.create({ data: { actorId: actor.userId, action: "user.sessions.revoke", entityType: "User", entityId: userId, requestId: randomUUID() } }),
  ]);
  revalidatePath("/users");
}

export async function updateUserAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requirePermission("users.update");
  const parsed = updateUserSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message, fieldErrors: parsed.error.flatten().fieldErrors };
  const actor = await requireSession();
  const data = parsed.data;
  const user = await db.user.findUnique({ where: { id: data.userId }, include: { roles: { include: { role: true } }, companyAccess: true } });
  if (!user) return { status: "error", message: "This user no longer exists." };
  const actorIsSuperAdmin = actor.user.roles.some(({ role }) => role.key === "superadmin");
  const targetIsSuperAdmin = user.roles.some(({ role }) => role.key === "superadmin");
  if (targetIsSuperAdmin && !actorIsSuperAdmin) return { status: "error", message: "Only a SuperAdmin can change a SuperAdmin account." };
  const newRole = await db.role.findUnique({ where: { id: data.roleId } });
  if (!newRole) return { status: "error", message: "The selected role is unavailable." };
  if (newRole.key === "superadmin" && !actorIsSuperAdmin) return { status: "error", message: "Only a SuperAdmin can grant the SuperAdmin role." };
  if (user.id === actor.userId && targetIsSuperAdmin && newRole.key !== "superadmin") return { status: "error", message: "You cannot remove your own SuperAdmin role." };
  const companyIds = [...new Set(formData.getAll("companyIds").map(String))];
  const accessLevel: "READ" | "FULL" = formData.get("accessLevel") === "READ" ? "READ" : "FULL";
  const modules = [...new Set(formData.getAll("overrideModules").map(String))];
  const permissions = await db.permission.findMany({ select: { id: true, module: true } });
  const overrides = modules.flatMap((module) => {
    const effect = formData.get(`override.${module}`);
    if (effect !== "GRANT" && effect !== "DENY") return [];
    return permissions.filter((permission) => permission.module === module).map((permission) => ({ userId: user.id, permissionId: permission.id, effect: effect as "GRANT" | "DENY" }));
  });
  const roleChanged = !user.roles.some(({ roleId }) => roleId === data.roleId) || user.roles.length !== 1;
  const passwordChanged = Boolean(data.newPassword);
  try {
    await db.$transaction([
      db.user.update({ where: { id: user.id }, data: { displayName: data.displayName, email: data.email || null, normalizedEmail: data.email ? normalizeEmail(data.email) : null, phone: data.phone || null, normalizedPhone: data.phone ? normalizePhone(data.phone) : null, maxDevices: data.maxDevices, expiresAt: data.expiresAt ?? null, otpEnabled: formData.has("otpEnabled"), ...(passwordChanged ? { passwordHash: await hash(data.newPassword!, 12), passwordChangedAt: new Date(), failedLoginAttempts: 0, lockedUntil: null } : {}) } }),
      db.userRole.deleteMany({ where: { userId: user.id } }),
      db.userRole.create({ data: { userId: user.id, roleId: data.roleId } }),
      db.companyAccess.deleteMany({ where: { userId: user.id } }),
      db.companyAccess.createMany({ data: companyIds.map((companyId) => ({ userId: user.id, companyId, level: accessLevel })) }),
      db.userPermissionOverride.deleteMany({ where: { userId: user.id } }),
      db.userPermissionOverride.createMany({ data: overrides }),
      // Keep the signed-in admin's own session; everyone else must re-authenticate after a role or password change.
      ...(user.id !== actor.userId && (roleChanged || passwordChanged) ? [db.session.updateMany({ where: { userId: user.id, revokedAt: null }, data: { revokedAt: new Date() } })] : []),
      db.auditLog.create({ data: { actorId: actor.userId, action: "user.update", entityType: "User", entityId: user.id, requestId: randomUUID(), oldValues: { roles: user.roles.map(({ role }) => role.key), maxDevices: user.maxDevices, companyIds: user.companyAccess.map((access) => access.companyId) }, newValues: { role: newRole.key, maxDevices: data.maxDevices, otpEnabled: formData.has("otpEnabled"), expiresAt: data.expiresAt ?? null, companyIds, accessLevel, overriddenModules: modules, passwordReset: passwordChanged } } }),
    ]);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { status: "error", message: "That email or phone is already in use." };
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") return { status: "error", message: "One of the selected companies or roles is unavailable." };
    throw error;
  }
  revalidatePath("/users");
  return { status: "success", message: `${data.displayName} was updated.` };
}
