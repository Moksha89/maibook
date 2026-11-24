"use server";

import { randomUUID } from "node:crypto";
import { compare, hash } from "bcryptjs";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

import type { ActionState } from "@/lib/actions/types";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { normalizeEmail, normalizePhone } from "@/lib/domain/normalization";
import { changePasswordSchema, profileSchema } from "@/lib/validation/user";

export async function updateProfileAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireSession();
  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message, fieldErrors: parsed.error.flatten().fieldErrors };
  try {
    await db.$transaction([
      db.user.update({ where: { id: session.userId }, data: { displayName: parsed.data.displayName, email: parsed.data.email || null, normalizedEmail: parsed.data.email ? normalizeEmail(parsed.data.email) : null, phone: parsed.data.phone || null, normalizedPhone: parsed.data.phone ? normalizePhone(parsed.data.phone) : null } }),
      db.auditLog.create({ data: { actorId: session.userId, action: "profile.update", entityType: "User", entityId: session.userId, requestId: randomUUID() } }),
    ]);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { status: "error", message: "That email or phone is already in use." };
    throw error;
  }
  revalidatePath("/profile");
  return { status: "success", message: "Profile updated." };
}

export async function changePasswordAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireSession();
  const parsed = changePasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message, fieldErrors: parsed.error.flatten().fieldErrors };
  const user = await db.user.findUniqueOrThrow({ where: { id: session.userId }, select: { passwordHash: true } });
  if (!(await compare(parsed.data.currentPassword, user.passwordHash))) return { status: "error", message: "The current password is incorrect." };
  const passwordHash = await hash(parsed.data.newPassword, 12);
  // Other devices must sign in again; the session making the change stays active.
  await db.$transaction([
    db.user.update({ where: { id: session.userId }, data: { passwordHash, passwordChangedAt: new Date(), failedLoginAttempts: 0, lockedUntil: null } }),
    db.session.updateMany({ where: { userId: session.userId, revokedAt: null, id: { not: session.id } }, data: { revokedAt: new Date() } }),
    db.auditLog.create({ data: { actorId: session.userId, action: "profile.password.change", entityType: "User", entityId: session.userId, requestId: randomUUID() } }),
  ]);
  return { status: "success", message: "Password changed. Other devices were signed out." };
}
