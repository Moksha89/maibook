import { describe, expect, it } from "vitest";
import { partnerBalanceDue, partnerPaymentShare, partnerRunningBalances } from "./partner-entries";

describe("partner payments", () => {
  it("reduces what the company owes when we pay the partner", () => {
    expect(partnerPaymentShare("PAID", 10000)).toBe(10000);
    expect(partnerBalanceDue(-27440, [{ direction: "PAID", amount: 10000 }])).toBe(-17440);
  });

  it("increases what the company owes when the partner pays us, and reduces what they owe when the balance is positive", () => {
    expect(partnerPaymentShare("RECEIVED", 5000)).toBe(-5000);
    expect(partnerBalanceDue(-27440, [{ direction: "RECEIVED", amount: 5000 }])).toBe(-32440);
    expect(partnerBalanceDue(10000, [{ direction: "RECEIVED", amount: 4000 }])).toBe(6000);
  });

  it("builds a running balance from oldest entry to newest", () => {
    const rows = partnerRunningBalances([
      { id: "s1", ownerShare: -27440 },
      { id: "p1", ownerShare: 10000 },
      { id: "p2", ownerShare: -5000 },
    ]);
    expect(rows.map((row) => row.balance)).toEqual([-27440, -17440, -22440]);
  });
});
