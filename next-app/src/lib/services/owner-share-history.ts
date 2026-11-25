import type { Prisma } from "@prisma/client";

type Tx = Prisma.TransactionClient;

export type ShareHistoryRow = { effectiveFrom: Date; effectiveTo?: Date | null; percentage: { toString(): string } };

/**
 * Records the share % an owner holds in a company from `effectiveFrom` (default: now).
 * The previous open row is closed at that time. Settlements posted before the first row earn 0.
 * Later changes apply only to settlements posted from then on; stored settlement shares are never rewritten.
 */
export async function recordOwnerShare(
  tx: Tx,
  ownerId: string,
  companyId: string,
  percentage: Prisma.Decimal | number | string,
  effectiveFrom?: Date,
) {
  const at = effectiveFrom ?? new Date();
  const open = await tx.ownerShareHistory.findMany({
    where: { ownerId, companyId, effectiveTo: null },
    orderBy: { effectiveFrom: "desc" },
  });
  for (const row of open) {
    if (row.effectiveFrom.getTime() >= at.getTime()) continue;
    await tx.ownerShareHistory.update({ where: { id: row.id }, data: { effectiveTo: at } });
  }
  await tx.ownerShareHistory.create({ data: { ownerId, companyId, percentage, effectiveFrom: at } });
}

/** Share % in force at a moment. Settlements before the first history row earn 0 (not the current %). */
export function shareAt(history: ShareHistoryRow[], at: Date, fallback = 0) {
  const rows = [...history].sort((left, right) => left.effectiveFrom.getTime() - right.effectiveFrom.getTime());
  let value: number | null = null;
  for (const row of rows) {
    const start = row.effectiveFrom.getTime();
    const end = row.effectiveTo ? row.effectiveTo.getTime() : Number.POSITIVE_INFINITY;
    if (start <= at.getTime() && at.getTime() < end) value = Number(row.percentage.toString());
  }
  if (value != null) return value;
  return rows.length ? 0 : fallback;
}

/** Partner share of one signed company-profit amount: negative when the company owes the partner. */
export function partnerShareAmount(profit: number, history: ShareHistoryRow[], at: Date) {
  return -((profit * shareAt(history, at, 0)) / 100) || 0;
}
