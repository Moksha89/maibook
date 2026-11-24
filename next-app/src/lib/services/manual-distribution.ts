import "server-only";

import { Prisma } from "@prisma/client";
import { financialTransaction } from "@/lib/services/financial-transaction";
import { recalculateAgentBalances } from "@/lib/services/ledger";
import { allocateManualAgentAmount, decimal, splitCreditDebit } from "@/lib/domain/finance";

export async function distributeManualAgentAmount(input: { agentId: string; amount: string | number; entryDate: Date; remarks?: string; idempotencyKey: string; actorId: string; requestId: string }) {
  return financialTransaction(async (tx) => {
    const companyAssignments = await tx.companyAgent.findMany({ where: { agentId: input.agentId, removedAt: null }, select: { companyId: true }, orderBy: { companyId: "asc" } });
    for (const { companyId } of companyAssignments) await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${companyId}))`;
    await tx.$queryRaw`SELECT "company_id" FROM "company_agents" WHERE "agent_id" = ${input.agentId}::uuid AND "removed_at" IS NULL ORDER BY "company_id" FOR UPDATE`;
    const existing = await tx.ledgerEntry.findFirst({ where: { idempotencyKey: { startsWith: `${input.idempotencyKey}:` } } });
    if (existing) return { duplicate: true, allocations: [] };
    const agent = await tx.agent.findFirstOrThrow({ where: { id: input.agentId, deletedAt: null } });
    const assignments = await tx.companyAgent.findMany({ where: { agentId: input.agentId, removedAt: null }, orderBy: { companyId: "asc" } });
    const allocations = allocateManualAgentAmount(input.amount, assignments.map((item) => ({ companyId: item.companyId, balance: item.currentBalance.toString() })));
    for (const allocation of allocations) {
      const assignment = assignments.find((item) => item.companyId === allocation.companyId)!;
      const opening = decimal(assignment.currentBalance.toString());
      const closing = opening.add(allocation.amount);
      const amounts = splitCreditDebit(allocation.amount);
      await tx.ledgerEntry.create({ data: { companyId: allocation.companyId, entryType: "MANUAL_AGENT", entryDate: input.entryDate, remarks: input.remarks || `Manual distribution for ${agent.name}`, idempotencyKey: `${input.idempotencyKey}:${allocation.companyId}`, createdById: input.actorId, lines: { create: { companyId: allocation.companyId, accountType: "AGENT", agentId: agent.id, coins: new Prisma.Decimal(allocation.amount.toString()), rate: 1, cashValue: new Prisma.Decimal(allocation.amount.toString()), credit: new Prisma.Decimal(amounts.credit.toString()), debit: new Prisma.Decimal(amounts.debit.toString()), openingBalance: new Prisma.Decimal(opening.toString()), closingBalance: new Prisma.Decimal(closing.toString()), sequence: 1 } } } });
      await tx.companyAgent.update({ where: { companyId_agentId: { companyId: allocation.companyId, agentId: agent.id } }, data: { currentBalance: new Prisma.Decimal(closing.toString()) } });
      await recalculateAgentBalances(tx, allocation.companyId, agent.id);
    }
    // One audit row per company so the Audit page shows the right company instead of "Global".
    for (const allocation of allocations) await tx.auditLog.create({ data: { actorId: input.actorId, companyId: allocation.companyId, action: "agent.manual_distribution.create", entityType: "Agent", entityId: agent.id, requestId: `${input.requestId}:${allocation.companyId}`, newValues: { totalAmount: String(input.amount), allocatedAmount: allocation.amount.toString(), excludedFromShareholderProfit: true } } });
    return { duplicate: false, allocations };
  });
}
