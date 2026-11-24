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
import { createUserSchema } from "@/lib/validation/user";

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
