import type { Prisma } from "@prisma/client";

import { chooseOwner } from "@/lib/services/owner-shareholder-link";
import { shareAt } from "@/lib/services/owner-share-history";

type Tx = Prisma.TransactionClient;

/**
 * Shareholder split in force at `at`. Each partner's % comes from owner share history
 * (entries before they joined are 0). If history was never recorded, the current % is used.
 */
export async function shareholderRatesAt(
  tx: Tx,
  companyId: string,
  at: Date,
  shareholders: { id: string; normalizedName: string; percentage: { toString(): string } }[],
) {
  if (!shareholders.length) return [];
  const owners = await tx.owner.findMany({
    where: { normalizedName: { in: shareholders.map((row) => row.normalizedName) } },
    include: { companyLinks: { select: { companyId: true } } },
    orderBy: { createdAt: "asc" },
  });
  const histories = owners.length
    ? await tx.ownerShareHistory.findMany({ where: { companyId, ownerId: { in: owners.map((owner) => owner.id) } }, orderBy: { effectiveFrom: "asc" } })
    : [];
  return shareholders.map((shareholder) => {
    const owner = chooseOwner(owners.filter((row) => row.normalizedName === shareholder.normalizedName), { companyId });
    const history = owner ? histories.filter((row) => row.ownerId === owner.id) : [];
    const percentage = shareAt(history, at, Number(shareholder.percentage.toString()));
    return { shareholderId: shareholder.id, percentage: String(percentage) };
  });
}
