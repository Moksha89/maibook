"use server";

import { revalidatePath } from "next/cache";

import type { ActionState } from "@/lib/actions/types";
import { requirePermission } from "@/lib/auth/permissions";
import { requireSession } from "@/lib/auth/session";
import { createDatabaseBackup, importBackupArchive, verifyDatabaseBackup } from "@/lib/services/backups";

export async function createBackupAction() { await requirePermission("backups.create"); const session = await requireSession(); await createDatabaseBackup(session.userId); revalidatePath("/database"); }
export async function verifyBackupAction(formData: FormData) { await requirePermission("backups.read"); const session = await requireSession(); await verifyDatabaseBackup(String(formData.get("backupId") || ""), session.userId); revalidatePath("/database"); }

export async function uploadBackupAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requirePermission("backups.create");
  const session = await requireSession();
  const file = formData.get("archive");
  if (!(file instanceof File) || !file.size) return { status: "error", message: "Choose a .dump archive to upload." };
  try {
    await importBackupArchive(session.userId, file.name, Buffer.from(await file.arrayBuffer()), String(formData.get("checksum") || ""));
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "The archive could not be validated." };
  }
  revalidatePath("/database");
  return { status: "success", message: `${file.name} was validated and stored.` };
}
