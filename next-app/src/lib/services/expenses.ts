import "server-only";

import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { allocateShareholderProfit, decimal } from "@/lib/domain/finance";
import { financialTransaction } from "@/lib/services/financial-transaction";

type Tx = Prisma.TransactionClient;

/** Expenses belong to a company only: amount, category and remarks. The date is recorded automatically. */
export interface ExpenseInput {
  companyId: string;
  amount: string;
  category: string;
  remarks: string | null;
}

/** Today's calendar day in India time, stored as the expense date when an expense is entered. */
export function todayIstDate() {
  const ist = new Date(Date.now() + 5.5 * 3600_000);
  return new Date(Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate()));
}

/** Charges an expense to the company's active shareholders by percentage (negative entries) and updates their balances. */
async function chargeShareholders(tx: Tx, expense: { id: string; companyId: string; amount: Prisma.Decimal; expenseDate: Date; category: string; remarks: string | null }) {
  const shareholders = await tx.shareholder.findMany({ where: { companyId: expense.companyId, status: "ACTIVE", deletedAt: null }, orderBy: { name: "asc" } });
  if (!shareholders.length) return 0;
  const charge = decimal(expense.amount.toString()).neg();
  const allocations = allocateShareholderProfit(charge, shareholders.map((shareholder) => ({ shareholderId: shareholder.id, percentage: shareholder.percentage.toString() })));
  const version = Date.now().toString(36);
  for (const allocation of allocations) {
    await tx.shareholderEntry.create({
      data: {
        companyId: expense.companyId,
        shareholderId: allocation.shareholderId,
        expenseId: expense.id,
        distributionKey: `expense:${expense.id}:${version}:${allocation.shareholderId}`,
        source: "EXPENSE",
        entryDate: expense.expenseDate,
        companyProfit: new Prisma.Decimal(charge.toString()),
        percentage: new Prisma.Decimal(allocation.percentage.toString()),
        amount: new Prisma.Decimal(allocation.amount.toString()),
        remarks: `Expense ${expense.category}${expense.remarks ? `: ${expense.remarks}` : ""}`.slice(0, 500),
      },
    });
    await tx.shareholder.update({ where: { id: allocation.shareholderId }, data: { currentBalance: { increment: new Prisma.Decimal(allocation.amount.toString()) } } });
  }
  return allocations.length;
}

/** Reverses an expense's live shareholder charges (soft-deletes the entries, restores balances). */
async function reverseCharges(tx: Tx, expenseId: string) {
  const entries = await tx.shareholderEntry.findMany({ where: { expenseId, deletedAt: null } });
  for (const entry of entries) await tx.shareholder.update({ where: { id: entry.shareholderId }, data: { currentBalance: { decrement: entry.amount } } });
  if (entries.length) await tx.shareholderEntry.updateMany({ where: { id: { in: entries.map((entry) => entry.id) } }, data: { deletedAt: new Date() } });
  return entries.length;
}

const lock = (tx: Tx, companyId: string) => tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${companyId}))`;

export async function createExpense(input: ExpenseInput, actorId: string, requestId: string) {
  return financialTransaction(async (tx) => {
    await lock(tx, input.companyId);
    const expense = await tx.expense.create({ data: { ...input, amount: new Prisma.Decimal(input.amount), expenseDate: todayIstDate(), createdById: actorId } });
    const charged = await chargeShareholders(tx, expense);
    await tx.auditLog.create({ data: { actorId, companyId: input.companyId, action: "expense.create", entityType: "Expense", entityId: expense.id, requestId, newValues: { amount: input.amount, expenseDate: expense.expenseDate.toISOString().slice(0, 10), category: input.category, remarks: input.remarks, shareholderCharges: charged } } });
    return expense;
  });
}

export async function updateExpense(expenseId: string, input: Omit<ExpenseInput, "companyId">, actorId: string, requestId: string) {
  return financialTransaction(async (tx) => {
    const existing = await tx.expense.findFirst({ where: { id: expenseId, deletedAt: null } });
    if (!existing) throw new Error("This expense no longer exists.");
    await lock(tx, existing.companyId);
    const expense = await tx.expense.update({ where: { id: existing.id }, data: { ...input, amount: new Prisma.Decimal(input.amount) } });
    // Re-charge so shareholder balances follow the edited amount (and today's active shareholders).
    await reverseCharges(tx, expense.id);
    const charged = await chargeShareholders(tx, expense);
    await tx.auditLog.create({ data: { actorId, companyId: existing.companyId, action: "expense.update", entityType: "Expense", entityId: expense.id, requestId, oldValues: { amount: existing.amount.toString(), category: existing.category, remarks: existing.remarks }, newValues: { amount: input.amount, category: input.category, remarks: input.remarks, shareholderCharges: charged } } });
    return expense;
  });
}

/** Soft delete: the row stays (deletedAt + deletedById) and its shareholder charges are reversed. */
export async function deleteExpense(expenseId: string, actorId: string, requestId: string) {
  return financialTransaction(async (tx) => {
    const existing = await tx.expense.findFirst({ where: { id: expenseId, deletedAt: null } });
    if (!existing) throw new Error("This expense no longer exists.");
    await lock(tx, existing.companyId);
    const reversed = await reverseCharges(tx, existing.id);
    await tx.expense.update({ where: { id: existing.id }, data: { deletedAt: new Date(), deletedById: actorId } });
    await tx.auditLog.create({ data: { actorId, companyId: existing.companyId, action: "expense.delete", entityType: "Expense", entityId: existing.id, requestId, oldValues: { amount: existing.amount.toString(), expenseDate: existing.expenseDate.toISOString().slice(0, 10), category: existing.category, remarks: existing.remarks }, newValues: { reversedShareholderCharges: reversed } } });
    return existing;
  });
}

export interface CompanyPnl { profit: number; expenses: number; expenseCount: number; finalPnl: number }

/**
 * Company PNL: profit = net company share of posted settlements (losses subtract), expenses = live expenses,
 * final PNL = profit - expenses. Shareholder splits are taken from the final PNL.
 */
export async function companyPnl(companyIds: string[], range?: { start: Date; end: Date }): Promise<Map<string, CompanyPnl>> {
  const result = new Map<string, CompanyPnl>(companyIds.map((id) => [id, { profit: 0, expenses: 0, expenseCount: 0, finalPnl: 0 }]));
  if (!companyIds.length) return result;
  const settlementDate = range ? { gte: range.start, lte: range.end } : undefined;
  const expenseDate = range ? { gte: range.start, lte: range.end } : undefined;
  const [gains, losses, spent] = await Promise.all([
    db.settlement.groupBy({ by: ["companyId"], where: { companyId: { in: companyIds }, status: "POSTED", amount: { gt: 0 }, settlementDate }, _sum: { companyShare: true } }),
    db.settlement.groupBy({ by: ["companyId"], where: { companyId: { in: companyIds }, status: "POSTED", amount: { lt: 0 }, settlementDate }, _sum: { companyShare: true } }),
    db.expense.groupBy({ by: ["companyId"], where: { companyId: { in: companyIds }, deletedAt: null, expenseDate }, _sum: { amount: true }, _count: true }),
  ]);
  for (const row of gains) result.get(row.companyId)!.profit += Number(row._sum.companyShare ?? 0);
  for (const row of losses) result.get(row.companyId)!.profit -= Number(row._sum.companyShare ?? 0);
  for (const row of spent) { const item = result.get(row.companyId)!; item.expenses = Number(row._sum.amount ?? 0); item.expenseCount = row._count; }
  for (const item of result.values()) item.finalPnl = item.profit - item.expenses;
  return result;
}

export async function singleCompanyPnl(companyId: string, range?: { start: Date; end: Date }) {
  return (await companyPnl([companyId], range)).get(companyId)!;
}
