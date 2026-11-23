import "server-only";

import { createHash, randomUUID } from "node:crypto";
import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, stat } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";

import { db } from "@/lib/db";

function storageRoot() { return process.env.STORAGE_ROOT ? path.resolve(/* turbopackIgnore: true */ process.env.STORAGE_ROOT) : path.join(process.cwd(), "storage"); }
export function resolveBackupPath(storageKey: string) { const root = storageRoot(); const resolved = path.resolve(root, storageKey); if (!resolved.startsWith(`${root}${path.sep}`)) throw new Error("Invalid backup path."); return resolved; }

async function checksum(filePath: string) {
  const hash = createHash("sha256");
  await new Promise<void>((resolve, reject) => { const stream = createReadStream(filePath); stream.on("data", (chunk) => hash.update(chunk)); stream.on("end", resolve); stream.on("error", reject); });
  return hash.digest("hex");
}

export async function createDatabaseBackup(actorId: string) {
  const backup = await db.backup.create({ data: { requestedById: actorId, status: "RUNNING", startedAt: new Date() } });
  const directory = path.join(storageRoot(), "backups");
  await mkdir(directory, { recursive: true });
  const storageKey = path.join("backups", `ibook-${new Date().toISOString().replace(/[:.]/g, "-")}-${backup.id}.dump`);
  const filePath = resolveBackupPath(storageKey);
  try {
    await new Promise<void>((resolve, reject) => {
      const child = spawn("docker", ["compose", "exec", "-T", "postgres", "pg_dump", "-U", process.env.POSTGRES_USER || "ibook", "-d", process.env.POSTGRES_DB || "ibook", "-Fc"], { cwd: process.cwd(), windowsHide: true });
      const output = createWriteStream(filePath, { flags: "wx" });
      let errorText = "";
      child.stdout.pipe(output);
      child.stderr.on("data", (chunk) => { errorText += String(chunk).slice(0, 2000); });
      child.on("error", reject);
      child.on("close", (code) => code === 0 ? resolve() : reject(new Error(errorText || `pg_dump exited with ${code}.`)));
    });
    const [fileStat, digest] = await Promise.all([stat(filePath), checksum(filePath)]);
    await db.$transaction([
      db.backup.update({ where: { id: backup.id }, data: { status: "COMPLETED", storageKey, checksum: digest, sizeBytes: BigInt(fileStat.size), completedAt: new Date() } }),
      db.auditLog.create({ data: { actorId, action: "backup.create", entityType: "Backup", entityId: backup.id, requestId: randomUUID(), newValues: { checksum: digest, sizeBytes: fileStat.size } } }),
    ]);
    return backup.id;
  } catch (error) {
    await db.backup.update({ where: { id: backup.id }, data: { status: "FAILED", errorMessage: error instanceof Error ? error.message.slice(0, 2000) : "Backup failed.", completedAt: new Date() } });
    throw error;
  }
}

export async function verifyDatabaseBackup(backupId: string, actorId: string) {
  const backup = await db.backup.findUniqueOrThrow({ where: { id: backupId } });
  if (!backup.storageKey || !backup.checksum || backup.status !== "COMPLETED") throw new Error("Only completed backups can be verified.");
  const digest = await checksum(resolveBackupPath(backup.storageKey));
  if (digest !== backup.checksum) throw new Error("Backup checksum does not match.");
  await db.$transaction([
    db.backup.update({ where: { id: backup.id }, data: { verifiedAt: new Date() } }),
    db.auditLog.create({ data: { actorId, action: "backup.verify", entityType: "Backup", entityId: backup.id, requestId: randomUUID(), newValues: { checksum: digest } } }),
  ]);
}
