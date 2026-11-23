import "server-only";

import { Prisma, type PrismaClient } from "@prisma/client";

import { db } from "@/lib/db";
import { calculateCashValue, decimal, splitCreditDebit } from "@/lib/domain/finance";

type TransactionClient = Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

export interface PostAgentTransferInput {
  companyId: string;
  senderAgentId: string;
  receiverAgentId: string;
  coins: string | number;
  rate: string | number;
  entryDate: Date;
  remarks?: string;
  idempotencyKey: string;
  actorId: string;
  requestId: string;
}

function prismaDecimal(value: { toString(): string }) {
  return new Prisma.Decimal(value.toString());
}

export async function postAgentTransfer(input: PostAgentTransferInput) {
  if (input.senderAgentId === input.receiverAgentId) throw new Error("Sender and receiver must be different agents.");
  const coins = decimal(input.coins).abs();
  const rate = decimal(input.rate);
  if (coins.lte(0)) throw new Error("Coins must be greater than zero.");
  if (rate.lt(0)) throw new Error("Rate cannot be negative.");

  return db.$transaction(
    async (tx) => {
      const lockIds = [input.senderAgentId, input.receiverAgentId].sort();
      await tx.$queryRaw`SELECT "agent_id" FROM "company_agents" WHERE "company_id" = ${input.companyId}::uuid AND "agent_id" IN (${Prisma.join(lockIds.map((id) => Prisma.sql`${id}::uuid`))}) ORDER BY "agent_id" FOR UPDATE`;
      const assignments = await tx.companyAgent.findMany({ where: { companyId: input.companyId, agentId: { in: lockIds }, removedAt: null } });
      if (assignments.length !== 2) throw new Error("Both agents must be assigned to the selected company.");
      const sender = assignments.find((assignment) => assignment.agentId === input.senderAgentId)!;
      const receiver = assignments.find((assignment) => assignment.agentId === input.receiverAgentId)!;
      const senderOpening = decimal(sender.currentBalance.toString());
      const receiverOpening = decimal(receiver.currentBalance.toString());
      const senderClosing = senderOpening.sub(coins);
      const receiverClosing = receiverOpening.add(coins);
      const senderCash = calculateCashValue(coins.neg(), rate);
      const receiverCash = calculateCashValue(coins, rate);
      const senderAmounts = splitCreditDebit(senderCash);
      const receiverAmounts = splitCreditDebit(receiverCash);

      const entry = await tx.ledgerEntry.create({
        data: {
          companyId: input.companyId,
          entryType: "TRANSACTION",
          entryDate: input.entryDate,
          remarks: input.remarks || null,
          idempotencyKey: input.idempotencyKey,
          createdById: input.actorId,
          lines: {
            create: [
              { companyId: input.companyId, accountType: "AGENT", agentId: sender.agentId, coins: prismaDecimal(coins.neg()), rate: prismaDecimal(rate), cashValue: prismaDecimal(senderCash), credit: prismaDecimal(senderAmounts.credit), debit: prismaDecimal(senderAmounts.debit), openingBalance: prismaDecimal(senderOpening), closingBalance: prismaDecimal(senderClosing), sequence: 1 },
              { companyId: input.companyId, accountType: "AGENT", agentId: receiver.agentId, coins: prismaDecimal(coins), rate: prismaDecimal(rate), cashValue: prismaDecimal(receiverCash), credit: prismaDecimal(receiverAmounts.credit), debit: prismaDecimal(receiverAmounts.debit), openingBalance: prismaDecimal(receiverOpening), closingBalance: prismaDecimal(receiverClosing), sequence: 2 },
            ],
          },
        },
      });
      await Promise.all([
        tx.companyAgent.update({ where: { companyId_agentId: { companyId: input.companyId, agentId: sender.agentId } }, data: { currentBalance: prismaDecimal(senderClosing) } }),
        tx.companyAgent.update({ where: { companyId_agentId: { companyId: input.companyId, agentId: receiver.agentId } }, data: { currentBalance: prismaDecimal(receiverClosing) } }),
        tx.auditLog.create({ data: { actorId: input.actorId, companyId: input.companyId, action: "ledger.transfer.create", entityType: "LedgerEntry", entityId: entry.id, requestId: input.requestId, newValues: { senderAgentId: sender.agentId, receiverAgentId: receiver.agentId, coins: coins.toString(), rate: rate.toString() } } }),
      ]);
      return entry;
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}

export async function recalculateAgentBalances(tx: TransactionClient, companyId: string, agentId: string) {
  const assignment = await tx.companyAgent.findUniqueOrThrow({ where: { companyId_agentId: { companyId, agentId } } });
  const lines = await tx.ledgerEntryLine.findMany({
    where: { companyId, agentId, entry: { deletedAt: null } },
    include: { entry: { select: { entryDate: true, createdAt: true } } },
    orderBy: [{ entry: { entryDate: "asc" } }, { entry: { createdAt: "asc" } }, { sequence: "asc" }],
  });
  let balance = decimal(assignment.openingBalance.toString());
  for (const line of lines) {
    const openingBalance = balance;
    balance = openingBalance.add(line.coins.toString());
    await tx.ledgerEntryLine.update({ where: { id: line.id }, data: { openingBalance: prismaDecimal(openingBalance), closingBalance: prismaDecimal(balance) } });
  }
  await tx.companyAgent.update({ where: { companyId_agentId: { companyId, agentId } }, data: { currentBalance: prismaDecimal(balance) } });
}

export async function softDeleteLedgerEntry(entryId: string, actorId: string, requestId: string) {
  return db.$transaction(async (tx) => {
    const entry = await tx.ledgerEntry.findUniqueOrThrow({ where: { id: entryId }, include: { lines: { where: { agentId: { not: null } }, select: { agentId: true } } } });
    if (entry.deletedAt) return entry;
    await tx.ledgerEntry.update({ where: { id: entryId }, data: { deletedAt: new Date() } });
    for (const agentId of new Set(entry.lines.flatMap((line) => line.agentId ? [line.agentId] : []))) await recalculateAgentBalances(tx, entry.companyId, agentId);
    await tx.auditLog.create({ data: { actorId, companyId: entry.companyId, action: "ledger.entry.delete", entityType: "LedgerEntry", entityId: entryId, requestId } });
    return entry;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function restoreLedgerEntry(entryId: string, actorId: string, requestId: string) {
  return db.$transaction(async (tx) => {
    const entry = await tx.ledgerEntry.findUniqueOrThrow({ where: { id: entryId }, include: { lines: { where: { agentId: { not: null } }, select: { agentId: true } } } });
    if (!entry.deletedAt) return entry;
    await tx.ledgerEntry.update({ where: { id: entryId }, data: { deletedAt: null } });
    for (const agentId of new Set(entry.lines.flatMap((line) => line.agentId ? [line.agentId] : []))) await recalculateAgentBalances(tx, entry.companyId, agentId);
    await tx.auditLog.create({ data: { actorId, companyId: entry.companyId, action: "ledger.entry.restore", entityType: "LedgerEntry", entityId: entryId, requestId } });
    return entry;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function updateAgentTransfer(entryId: string, input: { coins: string | number; rate: string | number; entryDate: Date; remarks?: string; actorId: string; requestId: string }) {
  const coins = decimal(input.coins).abs();
  const rate = decimal(input.rate);
  if (coins.lte(0)) throw new Error("Coins must be greater than zero.");
  if (rate.lt(0)) throw new Error("Rate cannot be negative.");
  return db.$transaction(async (tx) => {
    const entry = await tx.ledgerEntry.findUniqueOrThrow({ where: { id: entryId }, include: { lines: { where: { accountType: "AGENT" }, orderBy: { sequence: "asc" } } } });
    if (entry.deletedAt) throw new Error("Restore the entry before editing it.");
    if (entry.entryType !== "TRANSACTION" || entry.lines.length !== 2 || !entry.lines[0].agentId || !entry.lines[1].agentId) throw new Error("Only two-agent transfers can be edited here.");
    const agentIds = entry.lines.map((line) => line.agentId!).sort();
    await tx.$queryRaw`SELECT "agent_id" FROM "company_agents" WHERE "company_id" = ${entry.companyId}::uuid AND "agent_id" IN (${Prisma.join(agentIds.map((id) => Prisma.sql`${id}::uuid`))}) ORDER BY "agent_id" FOR UPDATE`;
    const senderLine = entry.lines.find((line) => line.coins.isNegative()) || entry.lines[0];
    const receiverLine = entry.lines.find((line) => line.id !== senderLine.id)!;
    const senderCash = calculateCashValue(coins.neg(), rate);
    const receiverCash = calculateCashValue(coins, rate);
    const senderAmounts = splitCreditDebit(senderCash);
    const receiverAmounts = splitCreditDebit(receiverCash);
    await Promise.all([
      tx.ledgerEntry.update({ where: { id: entryId }, data: { entryDate: input.entryDate, remarks: input.remarks || null } }),
      tx.ledgerEntryLine.update({ where: { id: senderLine.id }, data: { coins: prismaDecimal(coins.neg()), rate: prismaDecimal(rate), cashValue: prismaDecimal(senderCash), credit: prismaDecimal(senderAmounts.credit), debit: prismaDecimal(senderAmounts.debit) } }),
      tx.ledgerEntryLine.update({ where: { id: receiverLine.id }, data: { coins: prismaDecimal(coins), rate: prismaDecimal(rate), cashValue: prismaDecimal(receiverCash), credit: prismaDecimal(receiverAmounts.credit), debit: prismaDecimal(receiverAmounts.debit) } }),
    ]);
    for (const agentId of agentIds) await recalculateAgentBalances(tx, entry.companyId, agentId);
    await tx.auditLog.create({ data: { actorId: input.actorId, companyId: entry.companyId, action: "ledger.transfer.update", entityType: "LedgerEntry", entityId: entryId, requestId: input.requestId, oldValues: { coins: senderLine.coins.abs().toString(), rate: senderLine.rate.toString(), entryDate: entry.entryDate.toISOString(), remarks: entry.remarks }, newValues: { coins: coins.toString(), rate: rate.toString(), entryDate: input.entryDate.toISOString(), remarks: input.remarks || null } } });
    return entry;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}
