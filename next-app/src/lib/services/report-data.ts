import "server-only";

import { ReportType } from "@prisma/client";
import { db } from "@/lib/db";
import { signedSettlementShare } from "@/lib/domain/finance";

export interface ReportParameters { companyId: string; agentId?: string; startDate: string; endDate: string }
export interface ReportTable { title: string; subtitle: string; columns: string[]; rows: string[][] }

const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Asia/Kolkata" });
/** Reports use the Indian DD/MM/YYYY format regardless of the server's locale. */
export function fmtDate(value: Date | string) { return dateFormat.format(new Date(value)); }

export async function loadReportTable(type: ReportType, parameters: ReportParameters): Promise<ReportTable> {
  const company = await db.company.findUniqueOrThrow({ where: { id: parameters.companyId }, select: { name: true, currency: true } });
  const startDate = new Date(parameters.startDate);
  const endDate = new Date(parameters.endDate);
  const subtitle = `${company.name} · ${fmtDate(startDate)} to ${fmtDate(endDate)}`;
  if (type === "SETTLEMENT") {
    const records = await db.settlement.findMany({ where: { companyId: parameters.companyId, settlementDate: { gte: startDate, lte: endDate } }, include: { identifier: { select: { value: true } }, agent: { select: { name: true } } }, orderBy: [{ settlementDate: "asc" }, { createdAt: "asc" }] });
    return { title: "Settlement Report", subtitle, columns: ["Date", "ID", "Agent", "Amount", "Agent %", "Agent Share", "Upline Share", "Company Share", "Status"], rows: records.map((record) => [fmtDate(record.settlementDate), record.identifier.value, record.agent.name, record.amount.toFixed(2), record.agentPercentage.toFixed(2), signedSettlementShare(record.amount, record.agentShare).toFixed(2), signedSettlementShare(record.amount, record.uplineShare).toFixed(2), signedSettlementShare(record.amount, record.companyShare).toFixed(2), record.status]) };
  }
  if (type === "UPLINE") {
    const records = await db.uplineEntry.findMany({ where: { companyId: parameters.companyId, deletedAt: null, entryDate: { gte: startDate, lte: endDate } }, include: { upline: { select: { name: true } } }, orderBy: [{ entryDate: "asc" }, { createdAt: "asc" }] });
    return { title: "Upline Report", subtitle, columns: ["Date", "Upline", "Source", "Amount", "Remarks"], rows: records.map((record) => [fmtDate(record.entryDate), record.upline.name, record.source.replaceAll("_", " "), record.amount.toFixed(2), record.remarks || ""]) };
  }
  if (type === "COMPANY_SUMMARY") {
    const [assignments, movement] = await Promise.all([
      db.companyAgent.findMany({ where: { companyId: parameters.companyId, removedAt: null }, include: { agent: { select: { name: true } } }, orderBy: { agent: { name: "asc" } } }),
      db.ledgerEntryLine.groupBy({ by: ["agentId"], where: { companyId: parameters.companyId, accountType: "AGENT", entry: { deletedAt: null, entryDate: { gte: startDate, lte: endDate } } }, _sum: { coins: true } }),
    ]);
    const moved = new Map(movement.map((row) => [row.agentId, row._sum.coins?.toFixed(2) ?? "0.00"]));
    const position = (value: { isPositive: () => boolean; isNegative: () => boolean }) => value.isNegative() ? "Negative" : value.isPositive() ? "Positive" : "Zero";
    const ordered = [...assignments].sort((a, b) => position(a.currentBalance).localeCompare(position(b.currentBalance)) || a.agent.name.localeCompare(b.agent.name));
    return { title: "Agent Balance Summary", subtitle, columns: ["Agent", "Position", "Opening", "Movement in period", "Current balance"], rows: ordered.map((assignment) => [assignment.agent.name, position(assignment.currentBalance), assignment.openingBalance.toFixed(2), moved.get(assignment.agentId) ?? "0.00", assignment.currentBalance.toFixed(2)]) };
  }
  if (type === "PROFIT_DISTRIBUTION") {
    const records = await db.shareholderEntry.findMany({ where: { companyId: parameters.companyId, deletedAt: null, entryDate: { gte: startDate, lte: endDate } }, include: { shareholder: { select: { name: true } } }, orderBy: [{ entryDate: "asc" }, { createdAt: "asc" }] });
    return { title: "Profit Distribution Report", subtitle, columns: ["Date", "Shareholder", "Source", "Company Profit", "Share %", "Amount", "Remarks"], rows: records.map((record) => [fmtDate(record.entryDate), record.shareholder.name, record.source.replaceAll("_", " "), record.companyProfit.toFixed(2), record.percentage.toFixed(2), record.amount.toFixed(2), record.remarks || ""]) };
  }
  const lines = await db.ledgerEntryLine.findMany({ where: { companyId: parameters.companyId, ...(type === "AGENT_LEDGER" ? { agentId: parameters.agentId } : {}), entry: { deletedAt: null, entryDate: { gte: startDate, lte: endDate } } }, include: { agent: { select: { name: true } }, upline: { select: { name: true } }, entry: { select: { entryDate: true, entryType: true, remarks: true } } }, orderBy: [{ entry: { entryDate: "asc" } }, { entry: { createdAt: "asc" } }, { sequence: "asc" }] });
  const agent = parameters.agentId ? await db.agent.findUnique({ where: { id: parameters.agentId }, select: { name: true } }) : null;
  return { title: type === "AGENT_LEDGER" ? `Agent Ledger · ${agent?.name || "Unknown"}` : "Company Ledger", subtitle, columns: ["Date", "Account", "Type", "Coins", "Rate", "Credit", "Debit", "Balance", "Remarks"], rows: lines.map((line) => [fmtDate(line.entry.entryDate), line.agent?.name || line.upline?.name || "Company", line.entry.entryType.replaceAll("_", " "), line.coins.toFixed(2), line.rate.toFixed(4), line.credit.toFixed(2), line.debit.toFixed(2), line.closingBalance.toFixed(2), line.entry.remarks || ""]) };
}
