import { describe, expect, it } from "vitest";

import { agentAt, agentRateTotal, agentsAt, sameAgentSet, splitWholeAmount, validateAgentSplits } from "./identifier-agent-assignment";

const at = (iso: string) => new Date(iso);

describe("validateAgentSplits", () => {
  it("accepts no agents and a single agent at any rate up to 100%", () => {
    expect(validateAgentSplits([])).toEqual({ ok: true });
    expect(validateAgentSplits([{ agentId: "a", splitPercentage: 100 }])).toEqual({ ok: true });
    expect(validateAgentSplits([{ agentId: "a", splitPercentage: 80 }])).toEqual({ ok: true });
  });

  it("allows combined percentages up to 100% and rejects anything over", () => {
    expect(validateAgentSplits([{ agentId: "a", splitPercentage: 70 }, { agentId: "b", splitPercentage: 30 }])).toEqual({ ok: true });
    expect(validateAgentSplits([{ agentId: "a", splitPercentage: 40 }, { agentId: "b", splitPercentage: 30 }])).toEqual({ ok: true });
    expect(validateAgentSplits([{ agentId: "a", splitPercentage: 70 }, { agentId: "b", splitPercentage: 40 }]).ok).toBe(false);
    expect(validateAgentSplits([{ agentId: "a", splitPercentage: 50 }, { agentId: "a", splitPercentage: 50 }]).ok).toBe(false);
    expect(validateAgentSplits([{ agentId: "a", splitPercentage: 0 }]).ok).toBe(false);
  });

  it("sums agent percentages as the ID rate", () => {
    expect(agentRateTotal([{ agentId: "a", splitPercentage: 40 }, { agentId: "b", splitPercentage: 30 }])).toBe(70);
    expect(agentRateTotal([{ agentId: "a", splitPercentage: 80 }])).toBe(80);
  });
});

describe("splitWholeAmount", () => {
  it("is a no-op for a single agent, including fractional amounts", () => {
    expect(splitWholeAmount(-80000, [{ agentId: "a", splitPercentage: 100 }])).toEqual([{ agentId: "a", amount: -80000 }]);
    expect(splitWholeAmount(-80000.4, [{ agentId: "a", splitPercentage: 80 }])).toEqual([{ agentId: "a", amount: -80000.4 }]);
  });

  it("divides already-computed coins in proportion to each agent's percentage and gives leftover whole money to the largest", () => {
    expect(splitWholeAmount(-80000, [{ agentId: "a", splitPercentage: 70 }, { agentId: "b", splitPercentage: 30 }])).toEqual([
      { agentId: "a", amount: -56000 },
      { agentId: "b", amount: -24000 },
    ]);
    expect(splitWholeAmount(-70000, [{ agentId: "a", splitPercentage: 40 }, { agentId: "b", splitPercentage: 30 }])).toEqual([
      { agentId: "a", amount: -40000 },
      { agentId: "b", amount: -30000 },
    ]);
    expect(splitWholeAmount(100, [{ agentId: "a", splitPercentage: 33.3333 }, { agentId: "b", splitPercentage: 33.3333 }, { agentId: "c", splitPercentage: 33.3334 }])).toEqual([
      { agentId: "a", amount: 33 },
      { agentId: "b", amount: 33 },
      { agentId: "c", amount: 34 },
    ]);
  });
});

describe("time-effective agent sets", () => {
  const history = [
    { effectiveFrom: at("2026-11-01T00:00:00Z"), effectiveTo: at("2026-11-20T10:00:00Z"), agentId: "agent-a", splitPercentage: 80 },
    { effectiveFrom: at("2026-11-20T10:00:00Z"), effectiveTo: null, agentId: "agent-a", splitPercentage: 56 },
    { effectiveFrom: at("2026-11-20T10:00:00Z"), effectiveTo: null, agentId: "agent-b", splitPercentage: 24 },
  ];

  it("uses the set in force at that moment and does not change earlier periods", () => {
    expect(agentsAt(history, at("2026-11-05T00:00:00Z"))).toEqual([{ agentId: "agent-a", splitPercentage: 80 }]);
    expect(agentAt(history, at("2026-11-05T00:00:00Z"))).toBe("agent-a");
    expect(agentsAt(history, at("2026-11-20T10:00:00Z"))).toEqual([
      { agentId: "agent-a", splitPercentage: 56 },
      { agentId: "agent-b", splitPercentage: 24 },
    ]);
    expect(agentAt(history, at("2026-11-20T10:00:00Z"))).toBe("agent-a");
  });

  it("returns no agents after an unassign, until a new assignment starts", () => {
    const unassigned = [{ effectiveFrom: at("2026-11-01T00:00:00Z"), effectiveTo: at("2026-11-20T10:00:00Z"), agentId: "agent-a", splitPercentage: 80 }];
    expect(agentsAt(unassigned, at("2026-11-21T00:00:00Z"))).toEqual([]);
    expect(agentAt(unassigned, at("2026-11-21T00:00:00Z"))).toBeNull();
  });

  it("treats a repeated single-agent set as unchanged", () => {
    expect(sameAgentSet([{ agentId: "a", splitPercentage: 80 }], [{ agentId: "a", splitPercentage: 80 }])).toBe(true);
    expect(sameAgentSet([{ agentId: "a", splitPercentage: 40 }, { agentId: "b", splitPercentage: 30 }], [{ agentId: "b", splitPercentage: 30 }, { agentId: "a", splitPercentage: 40 }])).toBe(true);
    expect(sameAgentSet([{ agentId: "a", splitPercentage: 80 }], [{ agentId: "a", splitPercentage: 40 }, { agentId: "b", splitPercentage: 30 }])).toBe(false);
  });
});
