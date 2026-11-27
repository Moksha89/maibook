"use server";

import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { ActionState } from "@/lib/actions/types";
import { requireGroupAccess, requirePermission } from "@/lib/auth/permissions";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { money } from "@/lib/validation/common";
import { recalculateUplineGroupBalance } from "@/lib/services/upline-group-entries";

const createSchema = z.object({
  groupId: z.string().uuid(),
  direction: z.enum(["PAID", "RECEIVED"]),
  amount: money("Amount", { positive: true }),
  remarks: z.string().trim().max(500).transform((value) => value.toUpperCase()).optional(),
});

export async function createUplineGroupEntryAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requirePermission("uplines.update");
  const parsed = createSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message };
  const group = await db.uplineGroup.findUnique({ where: { id: parsed.data.groupId } });
  if (!group) return { status: "error", message: "This upline group no longer exists." };
  await requireGroupAccess(group.companyId, "FULL");
  const session = await requireSession();
  const amount = new Prisma.Decimal(parsed.data.amount.toString());
  await db.$transaction(async (tx) => {
    const entry = await tx.uplineGroupEntry.create({
      data: {
        groupId: group.id,
        direction: parsed.data.direction,
        amount,
        remarks: parsed.data.remarks || null,
        createdById: session.userId,
      },
    });
    await recalculateUplineGroupBalance(tx, group.id);
    await tx.auditLog.create({
      data: {
        actorId: session.userId,
        companyId: group.companyId,
        action: "upline_group.entry.create",
        entityType: "UplineGroupEntry",
        entityId: entry.id,
        requestId: randomUUID(),
        newValues: { groupId: group.id, direction: parsed.data.direction, amount: amount.toString(), remarks: parsed.data.remarks || null },
      },
    });
  });
  revalidatePath(`/upline-groups/${group.id}`);
  revalidatePath("/upline-groups");
  return { status: "success", message: "Entry saved." };
}

export async function deleteUplineGroupEntryAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requirePermission("uplines.update");
  const entryId = String(formData.get("entryId") || "");
  const entry = await db.uplineGroupEntry.findUnique({ where: { id: entryId }, include: { group: { select: { id: true, companyId: true } } } });
  if (!entry) return { status: "error", message: "This entry no longer exists." };
  await requireGroupAccess(entry.group.companyId, "FULL");
  if (entry.deletedAt) return { status: "success", message: "This entry is already deleted." };
  const session = await requireSession();
  await db.$transaction(async (tx) => {
    await tx.uplineGroupEntry.update({ where: { id: entry.id }, data: { deletedAt: new Date() } });
    await recalculateUplineGroupBalance(tx, entry.groupId);
    await tx.auditLog.create({
      data: {
        actorId: session.userId,
        companyId: entry.group.companyId,
        action: "upline_group.entry.delete",
        entityType: "UplineGroupEntry",
        entityId: entry.id,
        requestId: randomUUID(),
        oldValues: { direction: entry.direction, amount: entry.amount.toString(), remarks: entry.remarks },
      },
    });
  });
  revalidatePath(`/upline-groups/${entry.groupId}`);
  revalidatePath("/upline-groups");
  return { status: "success", message: "Entry deleted." };
}

export async function restoreUplineGroupEntryAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requirePermission("uplines.update");
  const entryId = String(formData.get("entryId") || "");
  const entry = await db.uplineGroupEntry.findUnique({ where: { id: entryId }, include: { group: { select: { id: true, companyId: true } } } });
  if (!entry) return { status: "error", message: "This entry no longer exists." };
  await requireGroupAccess(entry.group.companyId, "FULL");
  if (!entry.deletedAt) return { status: "success", message: "This entry is already active." };
  const session = await requireSession();
  await db.$transaction(async (tx) => {
    await tx.uplineGroupEntry.update({ where: { id: entry.id }, data: { deletedAt: null } });
    await recalculateUplineGroupBalance(tx, entry.groupId);
    await tx.auditLog.create({
      data: {
        actorId: session.userId,
        companyId: entry.group.companyId,
        action: "upline_group.entry.restore",
        entityType: "UplineGroupEntry",
        entityId: entry.id,
        requestId: randomUUID(),
        newValues: { direction: entry.direction, amount: entry.amount.toString() },
      },
    });
  });
  revalidatePath(`/upline-groups/${entry.groupId}`);
  revalidatePath("/upline-groups");
  return { status: "success", message: "Entry restored." };
}
