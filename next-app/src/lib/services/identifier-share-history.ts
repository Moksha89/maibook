import type { Prisma } from "@prisma/client";

import { shareAt, type ShareHistoryRow } from "@/lib/services/owner-share-history";

type Tx = Prisma.TransactionClient;

/** Records the configured ID/agent % from `effectiveFrom` (default: now). Previous open row is closed. Posted settlements are never rewritten. */
export async function recordIdentifierShare(
  tx: Tx,
  identifierId: string,
  percentage: Prisma.Decimal | number | string,
  effectiveFrom?: Date,
) {
  const at = effectiveFrom ?? new Date();
  const open = await tx.identifierShareHistory.findMany({
    where: { identifierId, effectiveTo: null },
    orderBy: { effectiveFrom: "desc" },
  });
  for (const row of open) {
    if (row.effectiveFrom.getTime() >= at.getTime()) continue;
    await tx.identifierShareHistory.update({ where: { id: row.id }, data: { effectiveTo: at } });
  }
  await tx.identifierShareHistory.create({ data: { identifierId, percentage, effectiveFrom: at } });
}

export function identifierShareAt(history: ShareHistoryRow[], at: Date, fallback = 0) {
  return shareAt(history, at, fallback);
}
