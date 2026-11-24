import { z } from "zod";

import { requireCompanyAccess, requirePermission } from "@/lib/auth/permissions";
import { db } from "@/lib/db";

function cell(value: string) { return `"${value.replaceAll('"', '""')}"`; }
function fileSafe(value: string) { return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "ledger"; }

export async function GET(request: Request, { params }: { params: Promise<{ companyId: string }> }) {
  await requirePermission("ledger.read");
  const { companyId } = await params;
  if (!z.string().uuid().safeParse(companyId).success) return new Response("Company not found", { status: 404 });
  await requireCompanyAccess(companyId, "READ");
  const agentParam = new URL(request.url).searchParams.get("agent");
  const agentId = agentParam && z.string().uuid().safeParse(agentParam).success ? agentParam : undefined;
  const company = await db.company.findFirst({ where: { id: companyId, deletedAt: null }, select: { name: true } });
  if (!company) return new Response("Company not found", { status: 404 });
  const agent = agentId ? await db.agent.findUnique({ where: { id: agentId }, select: { name: true } }) : null;
  const lines = await db.ledgerEntryLine.findMany({
    where: { companyId, entry: { deletedAt: null }, ...(agentId ? { agentId } : {}) },
    include: { agent: { select: { name: true } }, upline: { select: { name: true } }, entry: { select: { entryDate: true, remarks: true, entryType: true, reference: true } } },
    orderBy: [{ entry: { entryDate: "asc" } }, { createdAt: "asc" }, { sequence: "asc" }],
    take: 50_000,
  });
  const header = ["Date", "Account", "Type", "Reference", "Coins", "Rate", "Credit", "Debit", "Closing balance", "Remarks"];
  const rows = lines.map((line) => [line.entry.entryDate.toISOString().slice(0, 10), line.agent?.name ?? line.upline?.name ?? "Company", line.entry.entryType.replaceAll("_", " "), line.entry.reference ?? "", line.coins.toFixed(2), line.rate.toString(), line.credit.toFixed(2), line.debit.toFixed(2), line.closingBalance.toFixed(2), line.entry.remarks ?? ""]);
  const body = `\uFEFF${[header, ...rows].map((row) => row.map(cell).join(",")).join("\r\n")}`;
  const name = fileSafe(`${company.name}${agent ? `-${agent.name}` : ""}-ledger`);
  return new Response(body, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="${name}.csv"` } });
}
