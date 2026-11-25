import { revalidatePath } from "next/cache";

import { requirePermission } from "@/lib/auth/permissions";
import { requireSession } from "@/lib/auth/session";
import { importBackupArchive } from "@/lib/services/backups";

/**
 * Backup archive upload. This is the only endpoint that accepts a large body (BACKUP_UPLOAD_MAX_MB, default 512 MB);
 * Server Actions everywhere else keep a small limit (see next.config.ts). It is excluded from the proxy so the body is not truncated.
 */
const maxBytes = () => Number(process.env.BACKUP_UPLOAD_MAX_MB || 512) * 1024 * 1024;

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!origin || !host || new URL(origin).host !== host) return Response.json({ status: "error", message: "Cross-site upload rejected." }, { status: 403 });
  await requirePermission("backups.create");
  const session = await requireSession();
  const declared = Number(request.headers.get("content-length") || 0);
  if (declared > maxBytes() + 1024 * 1024) return Response.json({ status: "error", message: `The archive exceeds the ${Math.round(maxBytes() / 1024 / 1024)} MB upload limit.` }, { status: 413 });
  const formData = await request.formData().catch(() => null);
  const file = formData?.get("archive");
  if (!(file instanceof File) || !file.size) return Response.json({ status: "error", message: "Choose a .dump archive to upload." }, { status: 400 });
  try {
    await importBackupArchive(session.userId, file.name, Buffer.from(await file.arrayBuffer()), String(formData?.get("checksum") || ""));
  } catch (error) {
    return Response.json({ status: "error", message: error instanceof Error ? error.message : "The archive could not be validated." }, { status: 400 });
  }
  revalidatePath("/database");
  return Response.json({ status: "success", message: `${file.name} was validated and stored.` });
}
