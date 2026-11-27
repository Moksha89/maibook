import { Prisma, type PrismaClient } from "@prisma/client";

import { payableShare } from "@/lib/domain/finance";
import { partnerEntryShare } from "@/lib/services/partner-entries";

type TransactionClient = Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

/** Same sign convention as partner entries: received from the group is negative, paid to the group is positive. A negative balance means the company side owes the upline group. */
export function groupEntryShare(direction: string, amount: number) {
  return partnerEntryShare(direction, amount);
}

/** Balance after already-signed settlement upline shares (payableShare) and payment entries. */
export function groupBalanceDue(settlementShares: number[], payments: { direction: string; amount: number }[]) {
  const earned = settlementShares.reduce((sum, share) => sum + share, 0);
  return payments.reduce((total, payment) => total + groupEntryShare(payment.direction, payment.amount), earned);
}

export function groupRunningBalances<T extends { share: number }>(rowsOldestFirst: T[]) {
  let balance = 0;
  return rowsOldestFirst.map((row) => {
    balance += row.share;
    return { ...row, balance };
  });
}

export async function recalculateUplineGroupBalance(tx: TransactionClient, groupId: string) {
  const [settlements, payments] = await Promise.all([
    tx.settlement.findMany({
      where: { status: "POSTED", identifier: { site: { uplineGroupId: groupId } } },
      select: { amount: true, uplineShare: true },
    }),
    tx.uplineGroupEntry.findMany({
      where: { groupId, deletedAt: null },
      select: { direction: true, amount: true },
    }),
  ]);
  const settlementShares = settlements.map((row) => Number(payableShare(row.amount, row.uplineShare).toString()));
  const balance = groupBalanceDue(
    settlementShares,
    payments.map((row) => ({ direction: row.direction, amount: Number(row.amount.toString()) })),
  );
  await tx.uplineGroup.update({ where: { id: groupId }, data: { currentBalance: new Prisma.Decimal(balance.toString()) } });
  return balance;
}
