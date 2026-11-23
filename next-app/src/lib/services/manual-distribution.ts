import "server-only";

import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { allocateManualAgentAmount, decimal, splitCreditDebit } from "@/lib/domain/finance";

export async function distributeManualAgentAmount(input: { agentId: string; amount: string | number; entryDate: Date; remarks?: string; idempotencyKey: string; actorId: string; requestId: string }) {
  return db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "company_id" FROM "company_agents" WHERE "agent_id" = ${input.agentId}::uuid AND "removed_at" IS NULL ORDER BY "company_id" FOR UPDATE`;
    const agent = await tx.agent.findFirstOrThrow({ where: { id: input.agentId, deletedAt: null } });
    const assignments = await tx.companyAgent.findMany({ where: { agentId: input.agentId, removedAt: null }, orderBy: { companyId: "asc" } });
    const allocations = allocateManualAgentAmount(input.amount, assignments.map((item) => ({ companyId: item.companyId, balance: item.currentBalance.toString() })));
    const existing = await tx.ledgerEntry.findFirst({ where: { idempotencyKey: `${input.idempotencyKey}:${allocations[0]?.companyId}` } });
    if (existing) return { duplicate: true, allocations: [] };
    for (const allocation of allocations) {
      const assignment = assignments.find((item) => item.companyId === allocation.companyId)!;
      const opening = decimal(assignment.currentBalance.toString());
      const closing = opening.add(allocation.amount);
      const amounts = splitCreditDebit(allocation.amount);
      await tx.ledgerEntry.create({ data: { companyId: allocation.companyId, entryType: "MANUAL_AGENT", entryDate: input.entryDate, remarks: input.remarks || `Manual distribution for ${agent.name}`, idempotencyKey: `${input.idempotencyKey}:${allocation.companyId}`, createdById: input.actorId, lines: { create: { companyId: allocation.companyId, accountType: "AGENT", agentId: agent.id, coins: new Prisma.Decimal(allocation.amount.toString()), rate: 1, cashValue: new Prisma.Decimal(allocation.amount.toString()), credit: new Prisma.Decimal(amounts.credit.toString()), debit: new Prisma.Decimal(amounts.debit.toString()), openingBalance: new Prisma.Decimal(opening.toString()), closingBalance: new Prisma.Decimal(closing.toString()), sequence: 1 } } } });
      await tx.companyAgent.update({ where: { companyId_agentId: { companyId: allocation.companyId, agentId: agent.id } }, data: { currentBalance: new Prisma.Decimal(closing.toString()) } });
    }
    await tx.auditLog.create({ data: { actorId: input.actorId, action: "agent.manual_distribution.create", entityType: "Agent", entityId: agent.id, requestId: input.requestId, newValues: { amount: String(input.amount), allocations: allocations.map((item) => ({ companyId: item.companyId, amount: item.amount.toString() })), excludedFromShareholderProfit: true } } });
    return { duplicate: false, allocations };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}
