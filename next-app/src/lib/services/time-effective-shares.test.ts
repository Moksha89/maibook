import { describe, expect, it } from "vitest";

import { agentAt } from "./identifier-agent-assignment";
import { identifierShareAt } from "./identifier-share-history";
import { partnerShareAmount, shareAt } from "./owner-share-history";
import { partnerSharesForEvents } from "./partner-pnl";

const at = (iso: string) => new Date(iso);
const pct = (from: string, percentage: string, to?: string) => ({ effectiveFrom: at(from), effectiveTo: to ? at(to) : null, percentage });
const profitRow = (createdAt: string, companyShare: number) => ({
  createdAt: at(createdAt),
  amount: "100000",
  absoluteAmount: "100000",
  agentShare: "20000",
  uplineShare: "17000",
  companyShare: String(companyShare),
});

describe("shareAt mid-way partner assignment", () => {
  const history = [pct("2026-11-25T08:50:00Z", "40")];

  it("gives 0% to settlements posted before the shareholder was added", () => {
    expect(shareAt(history, at("2026-11-25T08:40:00Z"), 40)).toBe(0);
    expect(partnerShareAmount(140400, history, at("2026-11-25T08:40:00Z"))).toBe(0);
  });

  it("uses the assigned % from the join time onward", () => {
    expect(shareAt(history, at("2026-11-25T08:50:00Z"), 0)).toBe(40);
    expect(partnerShareAmount(140400, history, at("2026-11-25T08:52:00Z"))).toBe(-56160);
  });
});

describe("mid-way partner share % change", () => {
  const history = [pct("2026-11-01T00:00:00Z", "40", "2026-11-20T00:00:00Z"), pct("2026-11-20T00:00:00Z", "50")];

  it("keeps the old % on earlier settlements and uses the new % after the change", () => {
    expect(partnerShareAmount(100000, history, at("2026-11-10T00:00:00Z"))).toBe(-40000);
    expect(partnerShareAmount(100000, history, at("2026-11-20T00:00:00Z"))).toBe(-50000);
    const totals = partnerSharesForEvents(history, [profitRow("2026-11-10T00:00:00Z", 100000), profitRow("2026-11-25T00:00:00Z", 100000)], []);
    expect(totals.profitShare).toBe(-90000);
  });
});

describe("mid-way agent % change on an ID", () => {
  const history = [pct("2026-11-01T00:00:00Z", "80", "2026-11-15T00:00:00Z"), pct("2026-11-15T00:00:00Z", "70")];

  it("keeps the configured % that was in force when the settlement was posted", () => {
    expect(identifierShareAt(history, at("2026-11-10T12:00:00Z"), 70)).toBe(80);
    expect(identifierShareAt(history, at("2026-11-15T00:00:00Z"), 70)).toBe(70);
  });
});

describe("mid-way agent reassignment on an ID", () => {
  const history = [
    { effectiveFrom: at("2026-11-01T00:00:00Z"), effectiveTo: at("2026-11-20T10:00:00Z"), agentId: "agent-a" },
    { effectiveFrom: at("2026-11-20T10:00:00Z"), effectiveTo: null, agentId: "agent-b" },
  ];

  it("looks up the agent assigned at posting time", () => {
    expect(agentAt(history, at("2026-11-05T00:00:00Z"))).toBe("agent-a");
    expect(agentAt(history, at("2026-11-20T10:00:00Z"))).toBe("agent-b");
  });

  it("returns no agent after an unassign, until a new assignment starts", () => {
    const unassigned = [
      { effectiveFrom: at("2026-11-01T00:00:00Z"), effectiveTo: at("2026-11-20T10:00:00Z"), agentId: "agent-a" },
    ];
    expect(agentAt(unassigned, at("2026-11-21T00:00:00Z"))).toBeNull();
    expect(agentAt(unassigned, at("2026-11-01T00:00:00Z"))).toBe("agent-a");
  });
});

describe("partnerSharesForEvents expenses and join time", () => {
  const history = [pct("2026-11-25T08:50:00Z", "40")];

  it("ignores settlements and expenses posted before the partner joined", () => {
    const totals = partnerSharesForEvents(
      history,
      [profitRow("2026-11-25T08:40:00Z", 480000), profitRow("2026-11-25T08:52:00Z", 140400)],
      [{ createdAt: at("2026-11-25T08:40:00Z"), amount: "10000" }, { createdAt: at("2026-11-25T09:00:00Z"), amount: "10000" }],
    );
    expect(totals.profitShare).toBe(-56160);
    expect(totals.expenseShare).toBe(4000);
    expect(totals.pnlShare).toBe(-52160);
  });
});
