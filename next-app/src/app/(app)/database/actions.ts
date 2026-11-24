"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth/permissions";
import { requireSession } from "@/lib/auth/session";
import { createDatabaseBackup, verifyDatabaseBackup } from "@/lib/services/backups";

export async function createBackupAction() { await requirePermission("backups.create"); const session = await requireSession(); await createDatabaseBackup(session.userId); revalidatePath("/database"); }
export async function verifyBackupAction(formData: FormData) { await requirePermission("backups.read"); const session = await requireSession(); await verifyDatabaseBackup(String(formData.get("backupId") || ""), session.userId); revalidatePath("/database"); }
