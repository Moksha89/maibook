import type { Prisma } from "@prisma/client";

type Tx = Prisma.TransactionClient;

export type AgentSplit = { agentId: string; splitPercentage: number };
export type AgentAssignmentRow = { effectiveFrom: Date; effectiveTo?: Date | null; agentId: string | null; splitPercentage?: number | string | { toString(): string } | null };

const asPercent = (value: AgentAssignmentRow["splitPercentage"]) => {
  const n = value == null || value === "" ? 100 : Number(typeof value === "object" ? value.toString() : value);
  return Number.isFinite(n) ? n : 100;
};

const round4 = (value: number) => Math.round(value * 10000) / 10000;

/** Whole money, same rule as the rest of the app (half away from zero, never "-0"). */
export function wholeMoney(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.sign(value) * Math.round(Math.abs(value)) || 0;
}

export function validateAgentSplits(rows: AgentSplit[]): { ok: true } | { ok: false; message: string } {
  if (rows.length === 0) return { ok: true };
  if (rows.some((row) => !row.agentId)) return { ok: false, message: "Select an agent for each row." };
  if (new Set(rows.map((row) => row.agentId)).size !== rows.length) return { ok: false, message: "Each agent can only appear once." };
  for (const row of rows) {
    if (!Number.isFinite(row.splitPercentage) || row.splitPercentage <= 0 || row.splitPercentage > 100) {
      return { ok: false, message: "Each split must be greater than 0 and at most 100." };
    }
  }
  const total = round4(rows.reduce((sum, row) => sum + row.splitPercentage, 0));
  if (total !== 100) return { ok: false, message: `Agent splits must total 100% (currently ${total}%).` };
  return { ok: true };
}

export function parseAgentSplits(formData: FormData): { ok: true; splits: AgentSplit[] } | { ok: false; message: string } {
  const ids = formData.getAll("agentIds").map(String);
  const pcts = formData.getAll("agentSplits").map(String);
  const rows: AgentSplit[] = [];
  for (let index = 0; index < Math.max(ids.length, pcts.length); index += 1) {
    const agentId = (ids[index] || "").trim();
    const raw = (pcts[index] || "").trim();
    if (!agentId && !raw) continue;
    if (!agentId) return { ok: false, message: "Select an agent for each row." };
    const splitPercentage = raw === "" && ids.filter(Boolean).length === 1 ? 100 : Number(raw);
    rows.push({ agentId, splitPercentage });
  }
  const checked = validateAgentSplits(rows);
  if (!checked.ok) return checked;
  return { ok: true, splits: rows };
}

export function primaryAgentId(splits: AgentSplit[]): string | null {
  if (!splits.length) return null;
  return [...splits].sort((left, right) => right.splitPercentage - left.splitPercentage)[0].agentId;
}

export function formatAgentSplits(rows: { name: string; splitPercentage: number }[]) {
  if (!rows.length) return "-";
  if (rows.length === 1 && rows[0].splitPercentage === 100) return rows[0].name;
  return rows.map((row) => `${row.name} ${round4(row.splitPercentage)}%`).join(" · ");
}

/**
 * Divide `total` by split percentages. A single 100% agent keeps the exact amount (no extra rounding).
 * Multiple agents are rounded to whole money, and any remainder goes to the largest split (first row if tied).
 */
export function splitWholeAmount(total: number, splits: AgentSplit[]): { agentId: string; amount: number }[] {
  if (!splits.length) return [];
  const checked = validateAgentSplits(splits);
  if (!checked.ok) throw new Error(checked.message);
  if (splits.length === 1) return [{ agentId: splits[0].agentId, amount: total }];
  const target = wholeMoney(total);
  const parts = splits.map((row, index) => {
    const raw = total * (row.splitPercentage / 100);
    return { agentId: row.agentId, amount: wholeMoney(raw), splitPercentage: row.splitPercentage, index };
  });
  const diff = target - parts.reduce((sum, part) => sum + part.amount, 0);
  if (diff !== 0) {
    const largest = [...parts].sort((left, right) => right.splitPercentage - left.splitPercentage || left.index - right.index)[0];
    largest.amount += diff;
  }
  return parts.map(({ agentId, amount }) => ({ agentId, amount }));
}

export function sameAgentSet(left: AgentSplit[], right: AgentSplit[]) {
  if (left.length !== right.length) return false;
  const key = (rows: AgentSplit[]) => [...rows].map((row) => `${row.agentId}:${round4(row.splitPercentage)}`).sort().join("|");
  return key(left) === key(right);
}

/** Agents assigned to an ID at a moment, with their split %. Empty after an unassign until a new set is saved. */
export function agentsAt(history: AgentAssignmentRow[], at: Date): AgentSplit[] {
  const rows = [...history].sort((left, right) => left.effectiveFrom.getTime() - right.effectiveFrom.getTime());
  const result: AgentSplit[] = [];
  for (const row of rows) {
    const start = row.effectiveFrom.getTime();
    const end = row.effectiveTo ? row.effectiveTo.getTime() : Number.POSITIVE_INFINITY;
    if (start <= at.getTime() && at.getTime() < end && row.agentId) {
      result.push({ agentId: row.agentId, splitPercentage: asPercent(row.splitPercentage) });
    }
  }
  return result;
}

/** Primary agent (largest split) assigned at a moment. Kept for existing lookups. */
export function agentAt(history: AgentAssignmentRow[], at: Date): string | null {
  return primaryAgentId(agentsAt(history, at));
}

/** Close the open set and, when splits are provided, open that set from `at`. Does not rewrite posted settlements. No-ops if the open set is unchanged. */
export async function recordIdentifierAgentSet(tx: Tx, identifierId: string, splits: AgentSplit[], at = new Date()) {
  const checked = validateAgentSplits(splits);
  if (!checked.ok) throw new Error(checked.message);
  const open = await tx.identifierAgentAssignment.findMany({
    where: { identifierId, effectiveTo: null },
    orderBy: { effectiveFrom: "asc" },
  });
  const current: AgentSplit[] = open.map((row) => ({ agentId: row.agentId, splitPercentage: asPercent(row.splitPercentage) }));
  if (sameAgentSet(current, splits)) return { changed: false };
  for (const row of open) {
    if (row.effectiveFrom.getTime() >= at.getTime()) {
      await tx.identifierAgentAssignment.delete({ where: { id: row.id } });
      continue;
    }
    await tx.identifierAgentAssignment.update({ where: { id: row.id }, data: { effectiveTo: at } });
  }
  for (const row of splits) {
    await tx.identifierAgentAssignment.create({ data: { identifierId, agentId: row.agentId, splitPercentage: row.splitPercentage, effectiveFrom: at } });
  }
  return { changed: true };
}

/** Close the open assignment (if any) and, when agentId is set, open a 100% assignment from `at`. Does not rewrite posted settlements. */
export async function recordIdentifierAgentAssignment(tx: Tx, identifierId: string, agentId: string | null, at = new Date()) {
  return recordIdentifierAgentSet(tx, identifierId, agentId ? [{ agentId, splitPercentage: 100 }] : [], at);
}
