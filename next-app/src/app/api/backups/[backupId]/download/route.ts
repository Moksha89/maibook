import { createReadStream } from "node:fs";
import { Readable } from "node:stream";
import path from "node:path";
import { stat } from "node:fs/promises";
import { z } from "zod";
import { requirePermission } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import { resolveBackupPath } from "@/lib/services/backups";

export async function GET(_: Request, { params }: { params: Promise<{ backupId: string }> }) {
  await requirePermission("backups.download");
  const { backupId } = await params;
  if (!z.string().uuid().safeParse(backupId).success) return new Response("Backup not found", { status: 404 });
  const backup = await db.backup.findUnique({ where: { id: backupId } });
  if (!backup?.storageKey || backup.status !== "COMPLETED") return new Response("Backup not found", { status: 404 });
  const filePath = resolveBackupPath(backup.storageKey);
  const file = await stat(filePath).catch(() => null);
  if (!file?.isFile()) return new Response("Backup file not found", { status: 404 });
  const body = Readable.toWeb(createReadStream(filePath)) as ReadableStream;
  return new Response(body, { headers: { "content-type": "application/octet-stream", "content-disposition": `attachment; filename="${path.basename(filePath)}"`, "x-checksum-sha256": backup.checksum || "" } });
}
