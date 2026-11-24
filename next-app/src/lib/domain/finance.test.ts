import { describe, expect, it } from "vitest";

import {
  allocateManualAgentAmount,
  allocateShareholderProfit,
  calculateCashValue,
  calculateClosingBalance,
  calculateSettlement,
  recalculateRunningBalances,
  splitCreditDebit,
} from "./finance";

describe("manual agent distributions", () => {
  it("pays smaller balances first and splits the remainder evenly", () => {
    const allocations = allocateManualAgentAmount("100", [{ companyId: "a", balance: "20" }, { companyId: "b", balance: "30" }]);
    expect(allocations.map((item) => [item.companyId, item.amount.toString()])).toEqual([["a", "45"], ["b", "55"]]);
  });
  it("splits the whole amount evenly when balances are zero", () => {
    const allocations = allocateManualAgentAmount("-30", [{ companyId: "a", balance: "0" }, { companyId: "b", balance: "0" }]);
    expect(allocations.map((item) => item.amount.toString())).toEqual(["-15", "-15"]);
  });
});

describe("financial calculations", () => {
  it("calculates cash value without floating-point drift", () => {
    expect(calculateCashValue("0.1", "0.2").toString()).toBe("0.02");
  });

  it("applies receiver and sender balance direction", () => {
    expect(calculateClosingBalance(100, 25, "RECEIVER").toString()).toBe("125");
    expect(calculateClosingBalance(100, 25, "SENDER").toString()).toBe("75");
  });

  it("splits signed values into credit and debit", () => {
    expect(splitCreditDebit(20).credit.toString()).toBe("20");
    expect(splitCreditDebit(-20).debit.toString()).toBe("20");
  });

  it("calculates settlement and company profit from snapshotted rates", () => {
    const result = calculateSettlement(-1000, 15, 5);
    expect(result.absoluteAmount.toString()).toBe("1000");
    expect(result.agentShare.toString()).toBe("150");
    expect(result.companyShare.toString()).toBe("850");
    expect(result.uplineShare.toString()).toBe("50");
    expect(result.companyProfit.toString()).toBe("800");
  });

  it("allocates shareholder profit and rejects percentages above 100", () => {
    const allocations = allocateShareholderProfit(800, [
      { shareholderId: "one", percentage: 60 },
      { shareholderId: "two", percentage: 40 },
    ]);
    expect(allocations.map((allocation) => allocation.amount.toString())).toEqual(["480", "320"]);
    expect(() =>
      allocateShareholderProfit(800, [
        { shareholderId: "one", percentage: 60 },
        { shareholderId: "two", percentage: 41 },
      ]),
    ).toThrow("cannot exceed 100");
  });

  it("recalculates all later balances after a historical change", () => {
    const balances = recalculateRunningBalances(100, [20, -5, 10]);
    expect(balances.map((entry) => entry.closingBalance.toString())).toEqual(["120", "115", "125"]);
  });
});
