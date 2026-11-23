import "server-only";

import { ReportType } from "@prisma/client";
import { db } from "@/lib/db";

export interface ReportParameters { companyId: string; agentId?: string; startDate: string; endDate: string }
export interface ReportTable { title: string; subtitle: string; columns: string[]; rows: string[][] }

export async function loadReportTable(type: ReportType, parameters: ReportParameters): Promise<ReportTable> {
  const company = await db.company.findUniqueOrThrow({ where: { id: parameters.companyId }, select: { name: true, currency: true } });
  const startDate = new Date(parameters.startDate);
  const endDate = new Date(parameters.endDate);
  const subtitle = `${company.name} · ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`;
  if (type === "SETTLEMENT") {
    const records = await db.settlement.findMany({ where: { companyId: parameters.companyId, settlementDate: { gte: startDate, lte: endDate } }, include: { identifier: { select: { value: true } }, agent: { select: { name: true } } }, orderBy: [{ settlementDate: "asc" }, { createdAt: "asc" }] });
    return { title: "Settlement Report", subtitle, columns: ["Date", "ID", "Agent", "Amount", "Agent %", "Agent Share", "Upline Share", "Company Share", "Status"], rows: records.map((record) => [record.settlementDate.toLocaleDateString(), record.identifier.value, record.agent.name, record.amount.toFixed(2), record.agentPercentage.toFixed(2), record.agentShare.toFixed(2), record.uplineShare.toFixed(2), record.companyShare.toFixed(2), record.status]) };
  }
  if (type === "PROFIT_DISTRIBUTION") {
    const records = await db.shareholderEntry.findMany({ where: { companyId: parameters.companyId, entryDate: { gte: startDate, lte: endDate } }, include: { shareholder: { select: { name: true } } }, orderBy: [{ entryDate: "asc" }, { createdAt: "asc" }] });
    return { title: "Profit Distribution Report", subtitle, columns: ["Date", "Shareholder", "Source", "Company Profit", "Share %", "Amount", "Remarks"], rows: records.map((record) => [record.entryDate.toLocaleDateString(), record.shareholder.name, record.source.replaceAll("_", " "), record.companyProfit.toFixed(2), record.percentage.toFixed(2), record.amount.toFixed(2), record.remarks || ""]) };
  }
  const lines = await db.ledgerEntryLine.findMany({ where: { companyId: parameters.companyId, ...(type === "AGENT_LEDGER" ? { agentId: parameters.agentId } : {}), entry: { deletedAt: null, entryDate: { gte: startDate, lte: endDate } } }, include: { agent: { select: { name: true } }, upline: { select: { name: true } }, entry: { select: { entryDate: true, entryType: true, remarks: true } } }, orderBy: [{ entry: { entryDate: "asc" } }, { entry: { createdAt: "asc" } }, { sequence: "asc" }] });
  const agent = parameters.agentId ? await db.agent.findUnique({ where: { id: parameters.agentId }, select: { name: true } }) : null;
  return { title: type === "AGENT_LEDGER" ? `Agent Ledger · ${agent?.name || "Unknown"}` : "Company Ledger", subtitle, columns: ["Date", "Account", "Type", "Coins", "Rate", "Credit", "Debit", "Balance", "Remarks"], rows: lines.map((line) => [line.entry.entryDate.toLocaleDateString(), line.agent?.name || line.upline?.name || "Company", line.entry.entryType.replaceAll("_", " "), line.coins.toFixed(2), line.rate.toFixed(4), line.credit.toFixed(2), line.debit.toFixed(2), line.closingBalance.toFixed(2), line.entry.remarks || ""]) };
}
