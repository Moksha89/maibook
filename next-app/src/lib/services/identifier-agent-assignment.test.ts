import { describe, expect, it } from "vitest";

import { agentAt, agentsAt, sameAgentSet, splitWholeAmount, validateAgentSplits } from "./identifier-agent-assignment";

const at = (iso: string) => new Date(iso);

describe("validateAgentSplits", () => {
  it("accepts no agents and a single 100% agent", () => {
    expect(validateAgentSplits([])).toEqual({ ok: true });
    expect(validateAgentSplits([{ agentId: "a", splitPercentage: 100 }])).toEqual({ ok: true });
  });

  it("requires the splits to total 100%", () => {
    expect(validateAgentSplits([{ agentId: "a", splitPercentage: 70 }, { agentId: "b", splitPercentage: 30 }])).toEqual({ ok: true });
    expect(validateAgentSplits([{ agentId: "a", splitPercentage: 70 }, { agentId: "b", splitPercentage: 20 }]).ok).toBe(false);
    expect(validateAgentSplits([{ agentId: "a", splitPercentage: 50 }, { agentId: "a", splitPercentage: 50 }]).ok).toBe(false);
    expect(validateAgentSplits([{ agentId: "a", splitPercentage: 0 }]).ok).toBe(false);
  });
});

describe("splitWholeAmount", () => {
  it("is a no-op for a single 100% agent, including fractional amounts", () => {
    expect(splitWholeAmount(-80000, [{ agentId: "a", splitPercentage: 100 }])).toEqual([{ agentId: "a", amount: -80000 }]);
    expect(splitWholeAmount(-80000.4, [{ agentId: "a", splitPercentage: 100 }])).toEqual([{ agentId: "a", amount: -80000.4 }]);
  });

  it("divides agent coins by the split and gives leftover whole money to the largest split", () => {
    expect(splitWholeAmount(-80000, [{ agentId: "a", splitPercentage: 70 }, { agentId: "b", splitPercentage: 30 }])).toEqual([
      { agentId: "a", amount: -56000 },
      { agentId: "b", amount: -24000 },
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
    { effectiveFrom: at("2026-11-01T00:00:00Z"), effectiveTo: at("2026-11-20T10:00:00Z"), agentId: "agent-a", splitPercentage: 100 },
    { effectiveFrom: at("2026-11-20T10:00:00Z"), effectiveTo: null, agentId: "agent-a", splitPercentage: 70 },
    { effectiveFrom: at("2026-11-20T10:00:00Z"), effectiveTo: null, agentId: "agent-b", splitPercentage: 30 },
  ];

  it("uses the set in force at that moment and does not change earlier periods", () => {
    expect(agentsAt(history, at("2026-11-05T00:00:00Z"))).toEqual([{ agentId: "agent-a", splitPercentage: 100 }]);
    expect(agentAt(history, at("2026-11-05T00:00:00Z"))).toBe("agent-a");
    expect(agentsAt(history, at("2026-11-20T10:00:00Z"))).toEqual([
      { agentId: "agent-a", splitPercentage: 70 },
      { agentId: "agent-b", splitPercentage: 30 },
    ]);
    expect(agentAt(history, at("2026-11-20T10:00:00Z"))).toBe("agent-a");
  });

  it("returns no agents after an unassign, until a new assignment starts", () => {
    const unassigned = [{ effectiveFrom: at("2026-11-01T00:00:00Z"), effectiveTo: at("2026-11-20T10:00:00Z"), agentId: "agent-a", splitPercentage: 100 }];
    expect(agentsAt(unassigned, at("2026-11-21T00:00:00Z"))).toEqual([]);
    expect(agentAt(unassigned, at("2026-11-21T00:00:00Z"))).toBeNull();
  });

  it("treats a repeated single-agent 100% set as unchanged", () => {
    expect(sameAgentSet([{ agentId: "a", splitPercentage: 100 }], [{ agentId: "a", splitPercentage: 100 }])).toBe(true);
    expect(sameAgentSet([{ agentId: "a", splitPercentage: 70 }, { agentId: "b", splitPercentage: 30 }], [{ agentId: "b", splitPercentage: 30 }, { agentId: "a", splitPercentage: 70 }])).toBe(true);
    expect(sameAgentSet([{ agentId: "a", splitPercentage: 100 }], [{ agentId: "a", splitPercentage: 70 }, { agentId: "b", splitPercentage: 30 }])).toBe(false);
  });
});
