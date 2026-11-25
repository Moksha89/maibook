import { z } from "zod";

import { requireCompanyAccess, requirePermission } from "@/lib/auth/permissions";
import { csvCell } from "@/lib/csv";
import { db } from "@/lib/db";
import { renderPdf, renderPng } from "@/lib/services/report-render";
import { whole, dayStamp } from "@/lib/format";

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
    include: { agent: { select: { name: true } }, upline: { select: { name: true } }, entry: { select: { entryDate: true, createdAt: true, remarks: true, entryType: true, reference: true } } },
    orderBy: [{ entry: { entryDate: "asc" } }, { createdAt: "asc" }, { sequence: "asc" }],
    take: 50_000,
  });
  const format = new URL(request.url).searchParams.get("format");
  const name = fileSafe(`${company.name}${agent ? `-${agent.name}` : ""}-ledger`);
  if (format === "pdf" || format === "png") {
    const others = await db.ledgerEntryLine.findMany({ where: { entryId: { in: [...new Set(lines.map((line) => line.entryId))] } }, select: { id: true, entryId: true, agentId: true, agent: { select: { name: true } }, upline: { select: { name: true } } } });
    const byEntry = new Map<string, typeof others>();
    for (const other of others) byEntry.set(other.entryId, [...(byEntry.get(other.entryId) ?? []), other]);
    const label = (line: { agent: { name: string } | null; upline: { name: string } | null }) => line.agent?.name ?? line.upline?.name ?? "Company";
    const fmt = (value: { toString(): string }) => Number(value.toString()).toLocaleString("en-IN", { maximumFractionDigits: 0, signDisplay: "negative" });
    const rows = lines.map((line) => {
      const counterparty = agentId ? [...new Set((byEntry.get(line.entryId) ?? []).filter((other) => other.id !== line.id && other.agentId !== line.agentId).map(label))].join(", ") : "";
      return [dayStamp(line.entry.entryDate, line.entry.createdAt), counterparty || label(line), line.entry.remarks ?? "", fmt(line.coins), fmt(line.rate), fmt(line.credit), fmt(line.debit), fmt(line.closingBalance)];
    });
    const balance = agentId ? (await db.companyAgent.findFirst({ where: { companyId, agentId }, select: { currentBalance: true } }))?.currentBalance : (await db.companyAgent.aggregate({ where: { companyId, removedAt: null }, _sum: { currentBalance: true } }))._sum.currentBalance;
    const table = { title: agent ? `${agent.name} ledger entries` : `${company.name} ledger entries`, subtitle: `${company.name} · Closing balance ${fmt(balance ?? 0)} · ${rows.length} entries`, columns: ["Date", "Name", "Remarks", "Coins", "Rate", "Credit", "Debit", "Balance"], rows };
    if (format === "pdf") return new Response(new Uint8Array(await renderPdf(table, { title: "Maibook", footer: "" })), { headers: { "content-type": "application/pdf", "content-disposition": `attachment; filename="${name}.pdf"` } });
    return new Response(new Uint8Array(await renderPng(table)), { headers: { "content-type": "image/png", "content-disposition": `attachment; filename="${name}.png"` } });
  }
  const header = ["Date", "Account", "Type", "Reference", "Coins", "Rate", "Credit", "Debit", "Closing balance", "Remarks"];
  const rows = lines.map((line) => [dayStamp(line.entry.entryDate, line.entry.createdAt), line.agent?.name ?? line.upline?.name ?? "Company", line.entry.entryType.replaceAll("_", " "), line.entry.reference ?? "", whole(line.coins), line.rate.toString(), whole(line.credit), whole(line.debit), whole(line.closingBalance), line.entry.remarks ?? ""]);
  const body = `\uFEFF${[header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n")}`;
  return new Response(body, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="${name}.csv"` } });
}
