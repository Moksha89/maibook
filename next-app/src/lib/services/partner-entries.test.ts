import { describe, expect, it } from "vitest";
import { applyPartnerTransfer, includePartnerShareRow, partnerBalanceDue, partnerEntryShare, partnerPaymentShare, partnerRunningBalances } from "./partner-entries";

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

describe("includePartnerShareRow", () => {
  it("keeps settlements and expenses only when the partner held a share at posting time", () => {
    expect(includePartnerShareRow(0)).toBe(false);
    expect(includePartnerShareRow(40)).toBe(true);
    expect(includePartnerShareRow(20)).toBe(true);
  });
});

describe("internal transfers", () => {
  it("moves balance from one partner to another and leaves the combined total unchanged", () => {
    const beforeFrom = -27440;
    const beforeTo = -30580;
    const result = applyPartnerTransfer(beforeFrom, beforeTo, 10000);
    expect(result).toEqual({ fromBalance: -17440, toBalance: -40580 });
    expect(result.fromBalance + result.toBalance).toBe(beforeFrom + beforeTo);
    expect(partnerEntryShare("TRANSFER_OUT", 10000)).toBe(10000);
    expect(partnerEntryShare("TRANSFER_IN", 10000)).toBe(-10000);
  });

  it("allows a transfer larger than the from partner's balance and may flip the sign", () => {
    const beforeFrom = -5000;
    const beforeTo = -30580;
    const result = applyPartnerTransfer(beforeFrom, beforeTo, 10000);
    expect(result).toEqual({ fromBalance: 5000, toBalance: -40580 });
    expect(result.fromBalance + result.toBalance).toBe(beforeFrom + beforeTo);
    expect(applyPartnerTransfer(2000, -8000, 50000)).toEqual({ fromBalance: 52000, toBalance: -58000 });
  });
});
