import { requirePermission } from "@/lib/auth/permissions";
import { csvCell } from "@/lib/csv";
import { db } from "@/lib/db";

const allowlist = new Set(["companies", "agents", "settlements", "audit_logs", "users"]);
function value(input: unknown) { if (input === null || input === undefined) return ""; if (input instanceof Date) return input.toISOString(); if (typeof input === "bigint") return input.toString(); if (typeof input === "object" && "toString" in input) return String(input); return String(input); }
function csv(records: Record<string, unknown>[]) { if (!records.length) return ""; const columns = Object.keys(records[0]); const row = (items: unknown[]) => items.map((item) => csvCell(value(item))).join(","); return `\uFEFF${row(columns)}\r\n${records.map((record) => row(columns.map((column) => record[column]))).join("\r\n")}`; }

/** CSV exports contain live records only; soft-deleted rows stay in full database backups (pg_dump), which restore uses. */
export async function GET(request: Request) {
  await requirePermission("database.export");
  const table = new URL(request.url).searchParams.get("table") || "";
  if (!allowlist.has(table)) return Response.json({ error: "Table is not exportable." }, { status: 400 });
  let records: Record<string, unknown>[] = [];
  if (table === "companies") records = await db.company.findMany({ where: { deletedAt: null }, select: { id: true, name: true, code: true, slug: true, currency: true, defaultRate: true, status: true, createdAt: true, updatedAt: true } });
  if (table === "agents") records = await db.agent.findMany({ where: { deletedAt: null }, select: { id: true, name: true, phone: true, email: true, status: true, createdAt: true, updatedAt: true } });
  if (table === "settlements") records = await db.settlement.findMany({ select: { id: true, companyId: true, agentId: true, identifierId: true, settlementDate: true, amount: true, absoluteAmount: true, agentPercentage: true, agentShare: true, uplinePercentage: true, uplineShare: true, companyShare: true, status: true, remarks: true, createdAt: true } });
  if (table === "audit_logs") records = await db.auditLog.findMany({ select: { id: true, actorId: true, companyId: true, action: true, entityType: true, entityId: true, requestId: true, ipAddress: true, createdAt: true }, orderBy: { createdAt: "desc" } });
  if (table === "users") records = await db.user.findMany({ where: { deletedAt: null }, select: { id: true, username: true, displayName: true, email: true, phone: true, status: true, maxDevices: true, otpEnabled: true, expiresAt: true, lastLoginAt: true, createdAt: true, updatedAt: true } });
  return new Response(csv(records), { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="${table}.csv"` } });
}
