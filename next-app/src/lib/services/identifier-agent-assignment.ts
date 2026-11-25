import type { Prisma } from "@prisma/client";

type Tx = Prisma.TransactionClient;

export type AgentAssignmentRow = { effectiveFrom: Date; effectiveTo?: Date | null; agentId: string | null };

/** Agent assigned to an ID at a moment. Settlements posted after an unassign have no agent until a new assignment. */
export function agentAt(history: AgentAssignmentRow[], at: Date): string | null {
  const rows = [...history].sort((left, right) => left.effectiveFrom.getTime() - right.effectiveFrom.getTime());
  let value: string | null = null;
  let found = false;
  for (const row of rows) {
    const start = row.effectiveFrom.getTime();
    const end = row.effectiveTo ? row.effectiveTo.getTime() : Number.POSITIVE_INFINITY;
    if (start <= at.getTime() && at.getTime() < end) {
      value = row.agentId;
      found = true;
    }
  }
  return found ? value : null;
}

/** Close the open assignment (if any) and, when agentId is set, open a new one from `at`. Does not rewrite posted settlements. */
export async function recordIdentifierAgentAssignment(tx: Tx, identifierId: string, agentId: string | null, at = new Date()) {
  const open = await tx.identifierAgentAssignment.findMany({
    where: { identifierId, effectiveTo: null },
    orderBy: { effectiveFrom: "desc" },
  });
  for (const row of open) {
    if (row.effectiveFrom.getTime() >= at.getTime()) continue;
    await tx.identifierAgentAssignment.update({ where: { id: row.id }, data: { effectiveTo: at } });
  }
  if (agentId) await tx.identifierAgentAssignment.create({ data: { identifierId, agentId, effectiveFrom: at } });
}
