import "server-only";

import { Prisma, type PrismaClient } from "@prisma/client";

import { financialTransaction } from "@/lib/services/financial-transaction";
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
  const coins = decimal(input.coins).abs().toDecimalPlaces(8);
  const rate = decimal(input.rate).toDecimalPlaces(8);
  if (coins.lte(0)) throw new Error("Coins must be greater than zero.");
  if (rate.lt(0)) throw new Error("Rate cannot be negative.");

  return financialTransaction(
    async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${input.companyId}))`;
      const existing = await tx.ledgerEntry.findUnique({ where: { idempotencyKey: input.idempotencyKey }, include: { lines: true } });
      if (existing) {
        if (existing.companyId !== input.companyId) throw new Error("This idempotency key is already in use.");
        // Same submission retried: return the original. Different details under the same key are rejected, not ignored.
        const sender = existing.lines.find((line) => line.coins.isNegative());
        const receiver = existing.lines.find((line) => line.coins.isPositive());
        const unchanged = sender?.agentId === input.senderAgentId && receiver?.agentId === input.receiverAgentId && receiver.coins.eq(coins.toString());
        if (!unchanged) throw new Error("This submission was already posted with different details. Reload the form and submit again as a new entry.");
        return existing;
      }
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
      for (const agentId of lockIds) await recalculateAgentBalances(tx, input.companyId, agentId);
      return entry;
    },
  );
}

export async function recalculateAgentBalances(tx: TransactionClient, companyId: string, agentId: string) {
  const assignment = await tx.companyAgent.findUniqueOrThrow({ where: { companyId_agentId: { companyId, agentId } } });
  const lines = await tx.ledgerEntryLine.findMany({
    where: { companyId, agentId, entry: { deletedAt: null } },
    orderBy: [{ entry: { entryDate: "asc" } }, { entry: { createdAt: "asc" } }, { entryId: "asc" }, { sequence: "asc" }],
  });
  let balance = decimal(assignment.openingBalance.toString());
  for (const line of lines) {
    const openingBalance = balance;
    balance = openingBalance.add(line.coins.toString());
    if (!line.openingBalance.eq(openingBalance.toString()) || !line.closingBalance.eq(balance.toString())) {
      await tx.ledgerEntryLine.update({ where: { id: line.id }, data: { openingBalance: prismaDecimal(openingBalance), closingBalance: prismaDecimal(balance) } });
    }
  }
  await tx.companyAgent.update({ where: { companyId_agentId: { companyId, agentId } }, data: { currentBalance: prismaDecimal(balance) } });
}

export async function softDeleteLedgerEntry(entryId: string, actorId: string, requestId: string) {
  return financialTransaction(async (tx) => {
    const entry = await tx.ledgerEntry.findUniqueOrThrow({ where: { id: entryId }, include: { lines: { where: { agentId: { not: null } }, select: { agentId: true } } } });
    if (entry.entryType !== "TRANSACTION" && entry.entryType !== "MANUAL_AGENT") throw new Error("Use the source workflow to reverse this entry. Settlements must be reversed from Settlements.");
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${entry.companyId}))`;
    if (entry.deletedAt) return entry;
    await tx.ledgerEntry.update({ where: { id: entryId }, data: { deletedAt: new Date() } });
    for (const agentId of new Set(entry.lines.flatMap((line) => line.agentId ? [line.agentId] : []))) await recalculateAgentBalances(tx, entry.companyId, agentId);
    await tx.auditLog.create({ data: { actorId, companyId: entry.companyId, action: "ledger.entry.delete", entityType: "LedgerEntry", entityId: entryId, requestId } });
    return entry;
  });
}

export async function restoreLedgerEntry(entryId: string, actorId: string, requestId: string) {
  return financialTransaction(async (tx) => {
    const entry = await tx.ledgerEntry.findUniqueOrThrow({ where: { id: entryId }, include: { lines: { where: { agentId: { not: null } }, select: { agentId: true } } } });
    if (entry.entryType !== "TRANSACTION" && entry.entryType !== "MANUAL_AGENT") throw new Error("Use the source workflow to restore this entry.");
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${entry.companyId}))`;
    if (!entry.deletedAt) return entry;
    await tx.ledgerEntry.update({ where: { id: entryId }, data: { deletedAt: null } });
    for (const agentId of new Set(entry.lines.flatMap((line) => line.agentId ? [line.agentId] : []))) await recalculateAgentBalances(tx, entry.companyId, agentId);
    await tx.auditLog.create({ data: { actorId, companyId: entry.companyId, action: "ledger.entry.restore", entityType: "LedgerEntry", entityId: entryId, requestId } });
    return entry;
  });
}

export async function updateAgentTransfer(entryId: string, input: { coins: string | number; rate: string | number; entryDate: Date; remarks?: string; actorId: string; requestId: string }) {
  const coins = decimal(input.coins).abs().toDecimalPlaces(8);
  const rate = decimal(input.rate).toDecimalPlaces(8);
  if (coins.lte(0)) throw new Error("Coins must be greater than zero.");
  if (rate.lt(0)) throw new Error("Rate cannot be negative.");
  return financialTransaction(async (tx) => {
    const entry = await tx.ledgerEntry.findUniqueOrThrow({ where: { id: entryId }, include: { lines: { where: { accountType: "AGENT" }, orderBy: { sequence: "asc" } } } });
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${entry.companyId}))`;
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
  });
}

export async function recalculateNonAgentBalances(tx: TransactionClient, companyId: string) {
  const lines = await tx.ledgerEntryLine.findMany({
    where: { companyId, accountType: { in: ["UPLINE", "COMPANY"] }, entry: { deletedAt: null } },
    orderBy: [{ entry: { entryDate: "asc" } }, { entry: { createdAt: "asc" } }, { entryId: "asc" }, { sequence: "asc" }],
  });
  const balances = new Map<string, ReturnType<typeof decimal>>();
  for (const line of lines) {
    const account = line.uplineId ?? "COMPANY";
    const opening = balances.get(account) ?? decimal(0);
    const closing = opening.add(line.coins.toString());
    if (!line.openingBalance.eq(opening.toString()) || !line.closingBalance.eq(closing.toString())) {
      await tx.ledgerEntryLine.update({ where: { id: line.id }, data: { openingBalance: prismaDecimal(opening), closingBalance: prismaDecimal(closing) } });
    }
    balances.set(account, closing);
  }
  const uplines = await tx.upline.findMany({ where: { companyId }, select: { id: true, currentBalance: true } });
  for (const upline of uplines) {
    const balance = balances.get(upline.id) ?? decimal(0);
    if (!upline.currentBalance.eq(balance.toString())) await tx.upline.update({ where: { id: upline.id }, data: { currentBalance: prismaDecimal(balance) } });
  }
}

/** Edits one manual agent allocation (a signed amount posted by Manual distribution). */
export async function updateManualAgentEntry(entryId: string, input: { amount: string | number; entryDate: Date; remarks?: string; actorId: string; requestId: string }) {
  const amount = decimal(input.amount).toDecimalPlaces(8);
  if (amount.isZero()) throw new Error("Amount cannot be zero.");
  return financialTransaction(async (tx) => {
    const entry = await tx.ledgerEntry.findUniqueOrThrow({ where: { id: entryId }, include: { lines: { where: { accountType: "AGENT" }, orderBy: { sequence: "asc" } } } });
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${entry.companyId}))`;
    if (entry.deletedAt) throw new Error("Restore the entry before editing it.");
    if (entry.entryType !== "MANUAL_AGENT" || entry.lines.length !== 1 || !entry.lines[0].agentId) throw new Error("Only manual agent allocations can be edited here.");
    const line = entry.lines[0];
    await tx.$queryRaw`SELECT "agent_id" FROM "company_agents" WHERE "company_id" = ${entry.companyId}::uuid AND "agent_id" = ${line.agentId!}::uuid FOR UPDATE`;
    const split = splitCreditDebit(amount);
    await tx.ledgerEntry.update({ where: { id: entryId }, data: { entryDate: input.entryDate, remarks: input.remarks || null } });
    await tx.ledgerEntryLine.update({ where: { id: line.id }, data: { coins: prismaDecimal(amount), cashValue: prismaDecimal(amount), rate: 1, credit: prismaDecimal(split.credit), debit: prismaDecimal(split.debit) } });
    await recalculateAgentBalances(tx, entry.companyId, line.agentId!);
    await tx.auditLog.create({ data: { actorId: input.actorId, companyId: entry.companyId, action: "ledger.manual_agent.update", entityType: "LedgerEntry", entityId: entryId, requestId: input.requestId, oldValues: { amount: line.coins.toString(), entryDate: entry.entryDate.toISOString(), remarks: entry.remarks }, newValues: { amount: amount.toString(), entryDate: input.entryDate.toISOString(), remarks: input.remarks || null } } });
    return entry;
  });
}
