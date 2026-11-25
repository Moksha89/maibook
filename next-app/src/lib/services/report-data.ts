import "server-only";

import { ReportType } from "@prisma/client";
import { db } from "@/lib/db";
import { payableShare, signedSettlementShare } from "@/lib/domain/finance";
import { whole } from "@/lib/format";
import { singleCompanyPnl } from "@/lib/services/expenses";
import { partnerSharesForEvents } from "@/lib/services/partner-pnl";
import { chooseOwner } from "@/lib/services/owner-shareholder-link";

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
    const records = await db.settlement.findMany({ where: { companyId: parameters.companyId, status: "POSTED", settlementDate: { gte: startDate, lte: endDate } }, include: { identifier: { select: { value: true } }, agent: { select: { name: true } } }, orderBy: [{ settlementDate: "asc" }, { createdAt: "asc" }] });
    return { title: "Settlement Report", subtitle, columns: ["Date", "ID", "Agent", "Amount", "Agent %", "Agent Share", "Upline Share", "Company Share", "Status"], rows: records.map((record) => [fmtDate(record.settlementDate), record.identifier.value, record.agent.name, whole(record.amount), record.agentPercentage.toFixed(2), whole(signedSettlementShare(record.amount, record.agentShare)), whole(payableShare(record.amount, record.uplineShare)), whole(signedSettlementShare(record.amount, record.companyShare)), record.status]) };
  }
  if (type === "UPLINE") {
    const records = await db.uplineEntry.findMany({ where: { companyId: parameters.companyId, deletedAt: null, entryDate: { gte: startDate, lte: endDate } }, include: { upline: { select: { name: true } } }, orderBy: [{ entryDate: "asc" }, { createdAt: "asc" }] });
    return { title: "Upline Report", subtitle, columns: ["Date", "Upline", "Source", "Amount", "Remarks"], rows: records.map((record) => [fmtDate(record.entryDate), record.upline.name, record.source.replaceAll("_", " "), whole(record.amount), record.remarks || ""]) };
  }
  if (type === "COMPANY_SUMMARY") {
    const [assignments, movement] = await Promise.all([
      db.companyAgent.findMany({ where: { companyId: parameters.companyId, removedAt: null }, include: { agent: { select: { name: true } } }, orderBy: { agent: { name: "asc" } } }),
      db.ledgerEntryLine.groupBy({ by: ["agentId"], where: { companyId: parameters.companyId, accountType: "AGENT", entry: { deletedAt: null, entryDate: { gte: startDate, lte: endDate } } }, _sum: { cashValue: true } }),
    ]);
    const moved = new Map(movement.map((row) => [row.agentId, whole(row._sum.cashValue)]));
    const position = (value: { isPositive: () => boolean; isNegative: () => boolean }) => value.isNegative() ? "Negative" : value.isPositive() ? "Positive" : "Zero";
    const ordered = [...assignments].sort((a, b) => position(a.currentBalance).localeCompare(position(b.currentBalance)) || a.agent.name.localeCompare(b.agent.name));
    return { title: "Agent Balance Summary", subtitle, columns: ["Agent", "Position", "Opening", "Movement in period", "Current balance"], rows: ordered.map((assignment) => [assignment.agent.name, position(assignment.currentBalance), whole(assignment.openingBalance), moved.get(assignment.agentId) ?? "0", whole(assignment.currentBalance)]) };
  }
  if (type === "COMPANY_PNL") {
    // Final PNL = company profit (posted settlements) - expenses in the period; shareholders split the final PNL.
    const [pnl, expenses, shareholders] = await Promise.all([
      singleCompanyPnl(parameters.companyId, { start: startDate, end: endDate }),
      db.expense.groupBy({ by: ["category"], where: { companyId: parameters.companyId, deletedAt: null, expenseDate: { gte: startDate, lte: endDate } }, _sum: { amount: true }, _count: true, orderBy: { category: "asc" } }),
      db.shareholder.findMany({ where: { companyId: parameters.companyId, status: "ACTIVE", deletedAt: null }, select: { name: true, normalizedName: true, percentage: true, createdAt: true }, orderBy: { name: "asc" } }),
    ]);
    const names = [...new Set(shareholders.map((shareholder) => shareholder.normalizedName))];
    const [periodSettlements, periodExpenses, histories, nameOwners] = await Promise.all([
      db.settlement.findMany({ where: { companyId: parameters.companyId, status: "POSTED", settlementDate: { gte: startDate, lte: endDate } }, select: { createdAt: true, amount: true, absoluteAmount: true, agentShare: true, uplineShare: true, companyShare: true } }),
      db.expense.findMany({ where: { companyId: parameters.companyId, deletedAt: null, expenseDate: { gte: startDate, lte: endDate } }, select: { createdAt: true, amount: true } }),
      names.length ? db.ownerShareHistory.findMany({ where: { companyId: parameters.companyId }, orderBy: { effectiveFrom: "asc" } }) : Promise.resolve([]),
      names.length ? db.owner.findMany({ where: { normalizedName: { in: names } }, include: { companyLinks: { select: { companyId: true } } }, orderBy: { createdAt: "asc" } }) : Promise.resolve([]),
    ]);
    const rows: string[][] = [["Company profit", "Settlements", "", whole(pnl.profit)]];
    for (const row of expenses) rows.push([`Expense: ${row.category}`, `${row._count} entr${row._count === 1 ? "y" : "ies"}`, "", whole(-Number(row._sum.amount ?? 0))]);
    rows.push(["Expenses total", `${pnl.expenseCount} entr${pnl.expenseCount === 1 ? "y" : "ies"}`, "", whole(-pnl.expenses)], ["Final PNL", "Profit - expenses", "", whole(pnl.finalPnl)]);
    for (const shareholder of shareholders) {
      const owner = chooseOwner(nameOwners.filter((row) => row.normalizedName === shareholder.normalizedName), { companyId: parameters.companyId });
      const history = owner ? histories.filter((row) => row.ownerId === owner.id) : [{ effectiveFrom: shareholder.createdAt, percentage: shareholder.percentage }];
      const share = partnerSharesForEvents(history.length ? history : [{ effectiveFrom: shareholder.createdAt, percentage: shareholder.percentage }], periodSettlements, periodExpenses);
      rows.push([shareholder.name, "Shareholder PNL share", shareholder.percentage.toFixed(2), whole(share.pnlShare)]);
    }
    return { title: "Company PNL Report", subtitle, columns: ["Item", "Detail", "Share %", "Amount"], rows };
  }
  if (type === "PROFIT_DISTRIBUTION") {
    const records = await db.shareholderEntry.findMany({ where: { companyId: parameters.companyId, deletedAt: null, entryDate: { gte: startDate, lte: endDate } }, include: { shareholder: { select: { name: true } } }, orderBy: [{ entryDate: "asc" }, { createdAt: "asc" }] });
    return { title: "Profit Distribution Report", subtitle, columns: ["Date", "Shareholder", "Source", "Company Profit", "Share %", "Amount", "Remarks"], rows: records.map((record) => [fmtDate(record.entryDate), record.shareholder.name, record.source.replaceAll("_", " "), whole(record.companyProfit), record.percentage.toFixed(2), whole(record.amount), record.remarks || ""]) };
  }
  const lines = await db.ledgerEntryLine.findMany({ where: { companyId: parameters.companyId, ...(type === "AGENT_LEDGER" ? { agentId: parameters.agentId } : {}), entry: { deletedAt: null, entryDate: { gte: startDate, lte: endDate } } }, include: { agent: { select: { name: true } }, upline: { select: { name: true } }, entry: { select: { entryDate: true, entryType: true, remarks: true } } }, orderBy: [{ entry: { entryDate: "asc" } }, { entry: { createdAt: "asc" } }, { sequence: "asc" }] });
  const agent = parameters.agentId ? await db.agent.findUnique({ where: { id: parameters.agentId }, select: { name: true } }) : null;
  return { title: type === "AGENT_LEDGER" ? `Agent Ledger · ${agent?.name || "Unknown"}` : "Company Ledger", subtitle, columns: ["Date", "Account", "Type", "Coins", "Rate", "Credit", "Debit", "Balance", "Remarks"], rows: lines.map((line) => [fmtDate(line.entry.entryDate), line.agent?.name || line.upline?.name || "Company", line.entry.entryType.replaceAll("_", " "), whole(line.coins), line.rate.toFixed(4), whole(line.credit), whole(line.debit), whole(line.closingBalance), line.entry.remarks || ""]) };
}
