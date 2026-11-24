import type { Prisma } from "@prisma/client";

type Tx = Prisma.TransactionClient;

/**
 * Records the share % an owner holds in a company from now on. The first record for a pair covers
 * all settlements (as assignment always has); later changes apply only to settlements posted after them.
 */
export async function recordOwnerShare(tx: Tx, ownerId: string, companyId: string, percentage: Prisma.Decimal | number | string) {
  const prior = await tx.ownerShareHistory.count({ where: { ownerId, companyId } });
  await tx.ownerShareHistory.create({ data: { ownerId, companyId, percentage, effectiveFrom: prior ? new Date() : new Date(0) } });
}

/** Share % that applied at a moment, from history sorted by effectiveFrom ascending. */
export function shareAt(history: { effectiveFrom: Date; percentage: { toString(): string } }[], at: Date, fallback: number) {
  let value: number | null = null;
  for (const row of history) { if (row.effectiveFrom.getTime() <= at.getTime()) value = Number(row.percentage.toString()); else break; }
  return value ?? (history.length ? 0 : fallback);
}
