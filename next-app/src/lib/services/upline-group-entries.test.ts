import { describe, expect, it } from "vitest";

import { groupBalanceDue, groupEntryShare, groupRunningBalances } from "./upline-group-entries";

describe("upline group payment signs", () => {
  it("uses the same sign convention as partner entries", () => {
    expect(groupEntryShare("RECEIVED", 10000)).toBe(-10000);
    expect(groupEntryShare("PAID", 10000)).toBe(10000);
    expect(groupEntryShare("RECEIVED", -2500)).toBe(-2500);
  });

  it("adds payments to already-signed settlement shares", () => {
    // -80000 means the company owes the group 80k of upline share.
    expect(groupBalanceDue([-80000], [{ direction: "PAID", amount: 30000 }])).toBe(-50000);
    expect(groupBalanceDue([-80000], [{ direction: "RECEIVED", amount: 10000 }])).toBe(-90000);
    expect(groupBalanceDue([-80000, 20000], [{ direction: "PAID", amount: 10000 }, { direction: "RECEIVED", amount: 5000 }])).toBe(-55000);
  });

  it("walks a running balance oldest first", () => {
    const rows = groupRunningBalances([{ share: -80000 }, { share: 30000 }, { share: -10000 }]);
    expect(rows.map((row) => row.balance)).toEqual([-80000, -50000, -60000]);
  });
});
