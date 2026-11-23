import "server-only";

import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { allocateShareholderProfit, decimal } from "@/lib/domain/finance";

export interface DistributeProfitInput {
  companyId: string;
  periodStart: Date;
  periodEnd: Date;
  idempotencyKey: string;
  actorId: string;
  requestId: string;
}

export async function distributeCompanyProfit(input: DistributeProfitInput) {
  return db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${input.companyId}))`;
    const existing = await tx.shareholderEntry.findFirst({ where: { companyId: input.companyId, source: "SETTLEMENT_PROFIT", periodStart: input.periodStart, periodEnd: input.periodEnd, deletedAt: null } });
    if (existing) return { duplicate: true, companyProfit: existing.companyProfit, allocationCount: 0 };

    const [settlements, shareholders] = await Promise.all([
      tx.settlement.findMany({
        where: { companyId: input.companyId, status: "POSTED", settlementDate: { gte: input.periodStart, lte: input.periodEnd } },
        select: { id: true, absoluteAmount: true, agentShare: true, uplineShare: true, profitDistributedAt: true },
      }),
      tx.shareholder.findMany({ where: { companyId: input.companyId, status: "ACTIVE", deletedAt: null }, orderBy: { name: "asc" } }),
    ]);
    if (!shareholders.length) throw new Error("Add at least one active shareholder before distributing profit.");
    if (!settlements.length) throw new Error("No posted settlements exist in this period.");
    if (settlements.some((settlement) => settlement.profitDistributedAt)) throw new Error("This period includes settlements whose profit was already distributed.");
    const totalSettlements = settlements.reduce((sum, settlement) => sum.add(settlement.absoluteAmount.toString()), decimal(0));
    const agentShare = settlements.reduce((sum, settlement) => sum.add(settlement.agentShare.toString()), decimal(0));
    const uplineShare = settlements.reduce((sum, settlement) => sum.add(settlement.uplineShare.toString()), decimal(0));
    const companyProfit = totalSettlements.sub(agentShare).sub(uplineShare);
    const allocations = allocateShareholderProfit(companyProfit, shareholders.map((shareholder) => ({ shareholderId: shareholder.id, percentage: shareholder.percentage.toString() })));
    const period = `${input.periodStart.toISOString().slice(0, 10)} to ${input.periodEnd.toISOString().slice(0, 10)}`;

    for (const allocation of allocations) {
      await tx.shareholderEntry.create({
        data: {
          companyId: input.companyId,
          shareholderId: allocation.shareholderId,
          distributionKey: `${input.idempotencyKey}:${allocation.shareholderId}`,
          source: "SETTLEMENT_PROFIT",
          entryDate: input.periodEnd,
          periodStart: input.periodStart,
          periodEnd: input.periodEnd,
          companyProfit: new Prisma.Decimal(companyProfit.toString()),
          percentage: new Prisma.Decimal(allocation.percentage.toString()),
          amount: new Prisma.Decimal(allocation.amount.toString()),
          remarks: `Settlement profit distribution for ${period}`,
        },
      });
      await tx.shareholder.update({ where: { id: allocation.shareholderId }, data: { currentBalance: { increment: new Prisma.Decimal(allocation.amount.toString()) } } });
    }
    await tx.settlement.updateMany({ where: { id: { in: settlements.map((settlement) => settlement.id) } }, data: { profitDistributedAt: new Date() } });
    await tx.auditLog.create({ data: { actorId: input.actorId, companyId: input.companyId, action: "shareholder.profit.distribute", entityType: "Company", entityId: input.companyId, requestId: input.requestId, newValues: { period, totalSettlements: totalSettlements.toString(), agentShare: agentShare.toString(), uplineShare: uplineShare.toString(), companyProfit: companyProfit.toString(), allocationCount: allocations.length } } });
    return { duplicate: false, companyProfit: new Prisma.Decimal(companyProfit.toString()), allocationCount: allocations.length };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}
