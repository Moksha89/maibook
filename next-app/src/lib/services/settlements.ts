import "server-only";

import { Prisma } from "@prisma/client";

import { financialTransaction } from "@/lib/services/financial-transaction";
import { calculateSettlement, decimal, effectiveAgentPercentage, payableShare, splitCreditDebit } from "@/lib/domain/finance";
import { recalculateAgentBalances, recalculateNonAgentBalances } from "@/lib/services/ledger";
import { identifierShareAt } from "@/lib/services/identifier-share-history";

export interface PostSettlementInput {
  companyId: string;
  identifierId: string;
  uplineId?: string;
  amount: string | number;
  settlementDate: Date;
  remarks?: string;
  idempotencyKey: string;
  actorId: string;
  requestId: string;
}

function pd(value: { toString(): string }) {
  return new Prisma.Decimal(value.toString());
}

export async function postSettlement(input: PostSettlementInput) {
  const amount = decimal(input.amount).toDecimalPlaces(8);
  if (amount.isZero()) throw new Error("Settlement amount cannot be zero.");

  return financialTransaction(
    async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${input.companyId}))`;
      const existing = await tx.settlement.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
      if (existing) {
        if (existing.companyId !== input.companyId) throw new Error("This idempotency key is already in use.");
        // A retry of the same submission returns the original result; a different payload must not be silently ignored.
        const sameDay = existing.settlementDate.toISOString().slice(0, 10) === input.settlementDate.toISOString().slice(0, 10);
        if (existing.identifierId !== input.identifierId || !existing.amount.eq(amount.toString()) || !sameDay) throw new Error("This submission was already posted with different details. Reload the form and submit again as a new settlement.");
        return existing;
      }
      await tx.$queryRaw`SELECT "id" FROM "agent_ids" WHERE "id" = ${input.identifierId}::uuid FOR UPDATE`;
      const identifier = await tx.agentIdentifier.findFirst({ where: { id: input.identifierId, companyId: input.companyId, deletedAt: null, status: "ACTIVE" }, include: { site: { select: { uplinePercentage: true } } } });
      if (!identifier) throw new Error("The selected ID is unavailable.");
      if (!identifier.agentId) throw new Error("Link an agent to this ID before posting a settlement.");
      await tx.$queryRaw`SELECT "agent_id" FROM "company_agents" WHERE "company_id" = ${input.companyId}::uuid AND "agent_id" = ${identifier.agentId}::uuid FOR UPDATE`;
      const assignment = await tx.companyAgent.findUnique({ where: { companyId_agentId: { companyId: input.companyId, agentId: identifier.agentId } } });
      if (!assignment || assignment.removedAt) throw new Error("The ID agent is not assigned to this company.");

      const upline = input.uplineId ? await tx.upline.findFirst({ where: { id: input.uplineId, companyId: input.companyId, status: "ACTIVE", deletedAt: null } }) : null;
      if (input.uplineId && !upline) throw new Error("The selected upline is unavailable.");
      if (upline) await tx.$queryRaw`SELECT "id" FROM "uplines" WHERE "id" = ${upline.id}::uuid FOR UPDATE`;
      // SubAgent IDs keep their percentage with the sub agent; the agent is posted the remainder.
      // Use the ID % in force at post time so a later % edit cannot change this settlement.
      const shareHistory = await tx.identifierShareHistory.findMany({ where: { identifierId: identifier.id }, orderBy: { effectiveFrom: "asc" } });
      const configuredPercentage = identifierShareAt(shareHistory, new Date(), Number(identifier.percentageRate.toString()));
      const appliedAgentPercentage = effectiveAgentPercentage(identifier.type, String(configuredPercentage));
      // The upline share comes from the ID's site upline %; an ID without a site falls back to the chosen upline's %.
      const uplinePercentage = identifier.site ? decimal(identifier.site.uplinePercentage.toString()) : decimal(upline?.percentageRate.toString() ?? 0);
      const calculation = calculateSettlement(amount, appliedAgentPercentage, uplinePercentage, identifier.type);
      const direction = amount.isNegative() ? -1 : 1;
      // Payable convention (same as the agent ledger): a profit settlement stores a negative upline amount — the company owes them.
      const signedUplineShare = payableShare(amount, calculation.uplineShare);
      const signedCompanyProfit = calculation.companyProfit.mul(direction);
      // Agent ledger line: coins are the settlement amount, the rate is the applied agent %. Regular IDs flip the sign (a positive settlement gives the agent a negative balance: company owes agent);
      // SubAgent IDs keep it (a positive settlement gives a positive balance: agent owes company).
      const agentCoins = identifier.type === "SUB_AGENT" ? amount : amount.neg();
      const agentRate = appliedAgentPercentage.div(100);
      const agentCash = agentCoins.mul(agentRate).toDecimalPlaces(8);
      const agentOpening = decimal(assignment.currentBalance.toString());
      const agentClosing = agentOpening.add(agentCash);
      const companyAggregation = await tx.ledgerEntryLine.aggregate({ where: { companyId: input.companyId, accountType: "COMPANY", entry: { deletedAt: null } }, _sum: { cashValue: true } });
      const companyOpening = decimal(companyAggregation._sum.cashValue?.toString() ?? 0);
      const companyClosing = companyOpening.add(signedCompanyProfit);
      const uplineOpening = decimal(upline?.currentBalance.toString() ?? 0);
      const uplineClosing = uplineOpening.add(signedUplineShare);
      const agentAmounts = splitCreditDebit(agentCash);
      const uplineAmounts = splitCreditDebit(signedUplineShare);
      const companyAmounts = splitCreditDebit(signedCompanyProfit);

      const settlement = await tx.settlement.create({
        data: {
          companyId: input.companyId,
          agentId: identifier.agentId,
          identifierId: identifier.id,
          settlementDate: input.settlementDate,
          amount: pd(amount),
          absoluteAmount: pd(calculation.absoluteAmount),
          agentPercentage: pd(appliedAgentPercentage),
          agentShare: pd(calculation.agentShare),
          companyShare: pd(calculation.companyShare),
          uplinePercentage: pd(uplinePercentage),
          uplineShare: pd(calculation.uplineShare),
          remarks: input.remarks || null,
          idempotencyKey: input.idempotencyKey,
          createdById: input.actorId,
        },
      });
      const lines: Prisma.LedgerEntryLineCreateWithoutEntryInput[] = [
        { company: { connect: { id: input.companyId } }, accountType: "AGENT", agent: { connect: { id: identifier.agentId } }, coins: pd(agentCoins), rate: pd(agentRate), cashValue: pd(agentCash), credit: pd(agentAmounts.credit), debit: pd(agentAmounts.debit), openingBalance: pd(agentOpening), closingBalance: pd(agentClosing), sequence: 1 },
      ];
      if (upline) lines.push({ company: { connect: { id: input.companyId } }, accountType: "UPLINE", upline: { connect: { id: upline.id } }, coins: pd(signedUplineShare), rate: 1, cashValue: pd(signedUplineShare), credit: pd(uplineAmounts.credit), debit: pd(uplineAmounts.debit), openingBalance: pd(uplineOpening), closingBalance: pd(uplineClosing), sequence: 2 });
      lines.push({ company: { connect: { id: input.companyId } }, accountType: "COMPANY", coins: pd(signedCompanyProfit), rate: 1, cashValue: pd(signedCompanyProfit), credit: pd(companyAmounts.credit), debit: pd(companyAmounts.debit), openingBalance: pd(companyOpening), closingBalance: pd(companyClosing), sequence: lines.length + 1 });
      await tx.ledgerEntry.create({
        data: {
          companyId: input.companyId,
          entryType: "SETTLEMENT",
          entryDate: input.settlementDate,
          remarks: input.remarks || `Settlement ${identifier.value}`,
          sourceEntity: "Settlement",
          sourceId: settlement.id,
          idempotencyKey: `settlement:${input.idempotencyKey}`,
          createdById: input.actorId,
          lines: {
            create: lines,
          },
        },
      });
      if (upline) {
        await tx.uplineEntry.create({ data: { companyId: input.companyId, uplineId: upline.id, settlementId: settlement.id, source: "SETTLEMENT", entryDate: input.settlementDate, amount: pd(signedUplineShare), remarks: input.remarks || `Settlement ${identifier.value}`, createdById: input.actorId } });
        await tx.upline.update({ where: { id: upline.id }, data: { currentBalance: pd(uplineClosing) } });
      }
      await Promise.all([
        tx.agentIdentifier.update({ where: { id: identifier.id }, data: { currentBalance: { increment: pd(amount) } } }),
        tx.companyAgent.update({ where: { companyId_agentId: { companyId: input.companyId, agentId: identifier.agentId } }, data: { currentBalance: pd(agentClosing) } }),
        tx.auditLog.create({ data: { actorId: input.actorId, companyId: input.companyId, action: "settlement.create", entityType: "Settlement", entityId: settlement.id, requestId: input.requestId, newValues: { identifierId: identifier.id, uplineId: upline?.id, amount: amount.toString(), agentPercentage: appliedAgentPercentage.toString(), configuredPercentage: identifier.percentageRate.toString(), identifierType: identifier.type, agentShare: calculation.agentShare.toString(), uplineShare: calculation.uplineShare.toString(), companyShare: calculation.companyShare.toString(), companyProfit: calculation.companyProfit.toString() } } }),
      ]);
      await recalculateAgentBalances(tx, input.companyId, identifier.agentId);
      await recalculateNonAgentBalances(tx, input.companyId);
      return settlement;
    },
  );
}

export async function reverseSettlement(settlementId: string, actorId: string, requestId: string, reason: string) {
  return financialTransaction(async (tx) => {
    const settlement = await tx.settlement.findUniqueOrThrow({ where: { id: settlementId }, include: { uplineEntries: { where: { deletedAt: null } } } });
    if (settlement.status === "REVERSED") return { duplicate: true };
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${settlement.companyId}))`;
    await tx.$queryRaw`SELECT "id" FROM "settlements" WHERE "id" = ${settlement.id}::uuid FOR UPDATE`;
    await tx.$queryRaw`SELECT "id" FROM "agent_ids" WHERE "id" = ${settlement.identifierId}::uuid FOR UPDATE`;
    await tx.$queryRaw`SELECT "agent_id" FROM "company_agents" WHERE "company_id" = ${settlement.companyId}::uuid AND "agent_id" = ${settlement.agentId}::uuid FOR UPDATE`;
    const settlementEntry = await tx.ledgerEntry.findFirst({ where: { sourceEntity: "Settlement", sourceId: settlement.id, deletedAt: null } });
    if (!settlementEntry) throw new Error("The settlement ledger entry is missing.");
    const distributions = await tx.shareholderEntry.findMany({ where: { companyId: settlement.companyId, source: "SETTLEMENT_PROFIT", deletedAt: null, periodStart: { lte: settlement.settlementDate }, periodEnd: { gte: settlement.settlementDate } } });
    const distributionPeriods = new Map(distributions.filter((entry) => entry.periodStart && entry.periodEnd).map((entry) => [`${entry.periodStart!.toISOString()}:${entry.periodEnd!.toISOString()}`, { start: entry.periodStart!, end: entry.periodEnd! }]));
    for (const entry of distributions) await tx.shareholder.update({ where: { id: entry.shareholderId }, data: { currentBalance: { decrement: entry.amount } } });
    if (distributions.length) await tx.shareholderEntry.updateMany({ where: { id: { in: distributions.map((entry) => entry.id) } }, data: { deletedAt: new Date() } });
    for (const period of distributionPeriods.values()) await tx.settlement.updateMany({ where: { companyId: settlement.companyId, settlementDate: { gte: period.start, lte: period.end } }, data: { profitDistributedAt: null } });
    for (const entry of settlement.uplineEntries) { await tx.$queryRaw`SELECT "id" FROM "uplines" WHERE "id" = ${entry.uplineId}::uuid FOR UPDATE`; await tx.upline.update({ where: { id: entry.uplineId }, data: { currentBalance: { decrement: entry.amount } } }); }
    await Promise.all([
      tx.uplineEntry.updateMany({ where: { settlementId: settlement.id, deletedAt: null }, data: { deletedAt: new Date() } }),
      tx.ledgerEntry.update({ where: { id: settlementEntry.id }, data: { deletedAt: new Date() } }),
      tx.agentIdentifier.update({ where: { id: settlement.identifierId }, data: { currentBalance: { decrement: settlement.amount } } }),
      tx.settlement.update({ where: { id: settlement.id }, data: { status: "REVERSED", reversedAt: new Date() } }),
    ]);
    await recalculateAgentBalances(tx, settlement.companyId, settlement.agentId);
    await recalculateNonAgentBalances(tx, settlement.companyId);
    await tx.auditLog.create({ data: { actorId, companyId: settlement.companyId, action: "settlement.reverse", entityType: "Settlement", entityId: settlement.id, requestId, oldValues: { status: settlement.status }, newValues: { status: "REVERSED", reason, reversedShareholderDistributions: distributions.length } } });
    return { duplicate: false };
  });
}
