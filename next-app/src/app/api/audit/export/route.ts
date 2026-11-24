import { requirePermission } from "@/lib/auth/permissions";
import { csvResponse } from "@/lib/csv";
import { db } from "@/lib/db";
import { auditWhere } from "@/lib/services/audit-query";

export async function GET(request: Request) {
  await requirePermission("audit.read");
  const params = new URL(request.url).searchParams;
  const get = (key: string) => params.get(key) || undefined;
  const logs = await db.auditLog.findMany({
    where: auditWhere({ q: get("q"), action: get("action"), entity: get("entity"), company: get("company"), user: get("user"), from: get("from"), to: get("to") }),
    include: { actor: { select: { displayName: true, username: true } }, company: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 20_000,
  });
  const rows = logs.map((log) => [log.createdAt.toISOString(), log.actor?.username ?? "system", log.actor?.displayName ?? "System", log.action, log.company?.name ?? "", log.entityType, log.entityId ?? "", log.requestId ?? "", log.ipAddress ?? ""]);
  return csvResponse("audit-log", [["Time (UTC)", "Username", "Actor", "Action", "Company", "Entity type", "Entity ID", "Request ID", "IP address"], ...rows]);
}
