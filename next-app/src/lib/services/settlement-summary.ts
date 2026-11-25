import "server-only";

import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

const zero = (value: Prisma.Decimal | null | undefined) => Number(value ?? 0);

/** Totals for posted settlements where losses (negative settlements) subtract: shares carry the sign of their settlement. */
export async function signedSettlementTotals(where: Prisma.SettlementWhereInput) {
  const select = { agentShare: true, uplineShare: true, companyShare: true, amount: true } as const;
  const [gains, losses] = await Promise.all([
    db.settlement.aggregate({ where: { ...where, status: "POSTED", amount: { gt: 0 } }, _count: true, _sum: select }),
    db.settlement.aggregate({ where: { ...where, status: "POSTED", amount: { lt: 0 } }, _count: true, _sum: select }),
  ]);
  const net = (key: keyof typeof select) => zero(gains._sum[key]) - zero(losses._sum[key]);
  return { count: gains._count + losses._count, amount: net("amount"), agentShare: net("agentShare"), uplineShare: -net("uplineShare") || 0, companyShare: net("companyShare") };
}
