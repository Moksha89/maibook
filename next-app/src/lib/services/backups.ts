import "server-only";

import { createHash, randomUUID } from "node:crypto";
import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { pipeline } from "node:stream/promises";

import { db } from "../db";
import { minutesSinceScheduledTime, parsePgConnection } from "./backup-schedule";

export const BACKUP_RETENTION_DAYS = Number(process.env.BACKUP_RETENTION_DAYS || 30);
export const BACKUP_HOUR = Number(process.env.BACKUP_SCHEDULE_HOUR ?? 2);
export const BACKUP_TIMEZONE = process.env.BACKUP_TIMEZONE || "Asia/Kolkata";
const STALE_HOURS = 26;
const FAILED_RETRY_MINUTES = 30;

function storageRoot() { return process.env.STORAGE_ROOT ? path.resolve(/* turbopackIgnore: true */ process.env.STORAGE_ROOT) : path.join(process.cwd(), "storage"); }
export function resolveBackupPath(storageKey: string) { const root = storageRoot(); const resolved = path.resolve(root, storageKey); if (!resolved.startsWith(`${root}${path.sep}`)) throw new Error("Invalid backup path."); return resolved; }

async function checksum(filePath: string) {
  const hash = createHash("sha256");
  await new Promise<void>((resolve, reject) => { const stream = createReadStream(filePath); stream.on("data", (chunk) => hash.update(chunk)); stream.on("end", resolve); stream.on("error", reject); });
  return hash.digest("hex");
}

function dumpCommand(): { command: string; args: string[]; env: NodeJS.ProcessEnv } {
  if (process.env.BACKUP_MODE === "docker") {
    return { command: "docker", args: ["compose", "exec", "-T", "postgres", "pg_dump", "-U", process.env.POSTGRES_USER || "ibook", "-d", process.env.POSTGRES_DB || "ibook", "-Fc"], env: process.env };
  }
  const connection = parsePgConnection(process.env.DATABASE_URL || "");
  const args = ["--format=custom", "--no-owner", "--dbname", connection.database];
  if (connection.host) args.push("--host", connection.host);
  if (connection.port) args.push("--port", connection.port);
  if (connection.user) args.push("--username", connection.user);
  return { command: process.env.PG_DUMP_PATH || "pg_dump", args, env: { ...process.env, ...(connection.password ? { PGPASSWORD: connection.password } : {}) } };
}

/** Confirms a file is a readable PostgreSQL custom-format archive that contains tables. */
export async function validateArchive(filePath: string) {
  const handle = await import("node:fs/promises").then((fs) => fs.open(filePath, "r"));
  try {
    const head = Buffer.alloc(5);
    await handle.read(head, 0, 5, 0);
    if (head.toString("latin1") !== "PGDMP") throw new Error("The file is not a PostgreSQL custom-format (pg_dump -Fc) archive.");
  } finally { await handle.close(); }
  const restoreBinary = process.env.PG_RESTORE_PATH || "pg_restore";
  const listing = await new Promise<string | null>((resolve, reject) => {
    const child = spawn(restoreBinary, ["--list", filePath], { windowsHide: true });
    let out = "";
    let error = "";
    child.stdout.on("data", (chunk) => { out += String(chunk); });
    child.stderr.on("data", (chunk) => { error += String(chunk).slice(0, 1000); });
    child.on("error", (spawnError: NodeJS.ErrnoException) => spawnError.code === "ENOENT" ? resolve(null) : reject(spawnError));
    child.on("close", (code) => code === 0 ? resolve(out) : reject(new Error(error.trim() || "The archive could not be read by pg_restore.")));
  });
  if (listing !== null && !/\bTABLE\b/.test(listing)) throw new Error("The archive does not contain any tables.");
}

/** actorId is null for the scheduled worker backup. */
export async function createDatabaseBackup(actorId: string | null) {
  const backup = await db.backup.create({ data: { requestedById: actorId, status: "RUNNING", startedAt: new Date() } });
  const directory = path.join(storageRoot(), "backups");
  await mkdir(directory, { recursive: true });
  const storageKey = path.join("backups", `maibook-${new Date().toISOString().replace(/[:.]/g, "-")}-${backup.id}.dump`);
  const filePath = resolveBackupPath(storageKey);
  try {
    const { command, args, env } = dumpCommand();
    await new Promise<void>((resolve, reject) => {
      const child = spawn(command, args, { cwd: process.cwd(), windowsHide: true, env });
      const output = createWriteStream(filePath, { flags: "wx" });
      let errorText = "";
      const written = pipeline(child.stdout, output);
      child.stderr.on("data", (chunk) => { errorText += String(chunk).slice(0, 2000); });
      child.on("error", reject);
      written.catch(reject);
      child.on("close", (code) => {
        if (code !== 0) { reject(new Error(errorText || `pg_dump exited with ${code}.`)); return; }
        written.then(() => resolve(), reject);
      });
    });
    await validateArchive(filePath);
    const [fileStat, digest] = await Promise.all([stat(filePath), checksum(filePath)]);
    await db.$transaction([
      db.backup.update({ where: { id: backup.id }, data: { status: "COMPLETED", storageKey, checksum: digest, sizeBytes: BigInt(fileStat.size), completedAt: new Date(), verifiedAt: new Date() } }),
      db.auditLog.create({ data: { actorId, action: actorId ? "backup.create" : "backup.schedule.create", entityType: "Backup", entityId: backup.id, requestId: randomUUID(), newValues: { checksum: digest, sizeBytes: fileStat.size } } }),
    ]);
    return backup.id;
  } catch (error) {
    await unlink(filePath).catch(() => undefined);
    await db.backup.update({ where: { id: backup.id }, data: { status: "FAILED", errorMessage: error instanceof Error ? error.message.slice(0, 2000) : "Backup failed.", completedAt: new Date() } });
    throw error;
  }
}

export async function verifyDatabaseBackup(backupId: string, actorId: string | null) {
  const backup = await db.backup.findUniqueOrThrow({ where: { id: backupId } });
  if (!backup.storageKey || !backup.checksum || backup.status !== "COMPLETED") throw new Error("Only completed backups can be verified.");
  const filePath = resolveBackupPath(backup.storageKey);
  const digest = await checksum(filePath);
  if (digest !== backup.checksum) throw new Error("Backup checksum does not match.");
  await validateArchive(filePath);
  await db.$transaction([
    db.backup.update({ where: { id: backup.id }, data: { verifiedAt: new Date() } }),
    db.auditLog.create({ data: { actorId, action: "backup.verify", entityType: "Backup", entityId: backup.id, requestId: randomUUID(), newValues: { checksum: digest } } }),
  ]);
}

/** Accepts an uploaded pg_dump archive, validates its format and optional SHA-256, stores it, and audits the upload. */
export async function importBackupArchive(actorId: string, originalName: string, data: Buffer, expectedChecksum?: string) {
  const maxBytes = Number(process.env.BACKUP_UPLOAD_MAX_MB || 512) * 1024 * 1024;
  if (!data.length) throw new Error("The uploaded file is empty.");
  if (data.length > maxBytes) throw new Error(`The archive exceeds the ${Math.round(maxBytes / 1024 / 1024)} MB upload limit.`);
  const directory = path.join(storageRoot(), "backups");
  await mkdir(directory, { recursive: true });
  const id = randomUUID();
  const storageKey = path.join("backups", `maibook-upload-${new Date().toISOString().replace(/[:.]/g, "-")}-${id}.dump`);
  const filePath = resolveBackupPath(storageKey);
  await writeFile(filePath, data, { flag: "wx" });
  try {
    const digest = await checksum(filePath);
    const expected = expectedChecksum?.trim().toLowerCase();
    if (expected && expected !== digest) throw new Error("The SHA-256 checksum does not match the uploaded file.");
    await validateArchive(filePath);
    const now = new Date();
    await db.$transaction([
      db.backup.create({ data: { id, requestedById: actorId, status: "COMPLETED", storageKey, checksum: digest, sizeBytes: BigInt(data.length), startedAt: now, completedAt: now, verifiedAt: now } }),
      db.auditLog.create({ data: { actorId, action: "backup.upload", entityType: "Backup", entityId: id, requestId: randomUUID(), newValues: { fileName: originalName.slice(0, 200), checksum: digest, sizeBytes: data.length } } }),
    ]);
    return id;
  } catch (error) {
    await unlink(filePath).catch(() => undefined);
    throw error;
  }
}

/** Removes backup files and rows older than the retention window, always keeping the newest completed backup. */
export async function applyBackupRetention(now = new Date()) {
  const cutoff = new Date(now.getTime() - BACKUP_RETENTION_DAYS * 86_400_000);
  const newest = await db.backup.findFirst({ where: { status: "COMPLETED" }, orderBy: { createdAt: "desc" }, select: { id: true } });
  const expired = await db.backup.findMany({ where: { createdAt: { lt: cutoff }, status: { in: ["COMPLETED", "FAILED", "VERIFIED"] }, ...(newest ? { id: { not: newest.id } } : {}) } });
  for (const backup of expired) {
    if (backup.storageKey) await unlink(resolveBackupPath(backup.storageKey)).catch((error: NodeJS.ErrnoException) => { if (error.code !== "ENOENT") throw error; });
  }
  if (expired.length) {
    await db.$transaction([
      db.backup.deleteMany({ where: { id: { in: expired.map((backup) => backup.id) } } }),
      db.auditLog.create({ data: { action: "backup.retention.purge", entityType: "Backup", requestId: randomUUID(), newValues: { removed: expired.length, retentionDays: BACKUP_RETENTION_DAYS } } }),
    ]);
  }
  return expired.length;
}

/** Starts the daily scheduled backup once the configured local time has passed and none has run since. */
export async function runScheduledBackupIfDue(now = new Date()) {
  const elapsed = minutesSinceScheduledTime(now, BACKUP_TIMEZONE, BACKUP_HOUR);
  const windowStart = new Date(now.getTime() - elapsed * 60_000);
  const existing = await db.backup.findFirst({ where: { requestedById: null, createdAt: { gte: windowStart }, status: { in: ["PENDING", "RUNNING", "COMPLETED", "VERIFIED"] } }, select: { id: true } });
  if (existing) return null;
  const lastFailure = await db.backup.findFirst({ where: { requestedById: null, status: "FAILED", createdAt: { gte: new Date(now.getTime() - FAILED_RETRY_MINUTES * 60_000) } }, select: { id: true } });
  if (lastFailure) return null;
  const id = await createDatabaseBackup(null);
  await applyBackupRetention(now);
  return id;
}

export async function getBackupHealth(now = new Date()) {
  const [lastCompleted, lastFailed] = await Promise.all([
    db.backup.findFirst({ where: { status: "COMPLETED" }, orderBy: { createdAt: "desc" }, select: { createdAt: true, verifiedAt: true } }),
    db.backup.findFirst({ where: { status: "FAILED" }, orderBy: { createdAt: "desc" }, select: { createdAt: true, errorMessage: true } }),
  ]);
  const stale = !lastCompleted || now.getTime() - lastCompleted.createdAt.getTime() > STALE_HOURS * 3_600_000;
  const failedSince = lastFailed && (!lastCompleted || lastFailed.createdAt > lastCompleted.createdAt) ? lastFailed : null;
  return { lastCompletedAt: lastCompleted?.createdAt ?? null, stale, failedSince, scheduleLabel: `Daily at ${String(BACKUP_HOUR).padStart(2, "0")}:00 ${BACKUP_TIMEZONE}, kept ${BACKUP_RETENTION_DAYS} days` };
}
