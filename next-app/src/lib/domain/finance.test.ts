import { describe, expect, it } from "vitest";

import {
  allocateManualAgentAmount,
  allocateShareholderProfit,
  calculateCashValue,
  calculateClosingBalance,
  calculateSettlement,
  effectiveAgentPercentage,
  settlementSign,
  signedSettlementShare,
  payableShare,
  summarizeSettlementProfit,
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
    expect(result.companyShare.toString()).toBe("800"); // company keeps the remainder after upline and agent shares
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

/** Mirrors what postSettlement stores: shares are magnitudes, the settlement amount carries the sign. */
function settle(amount: number, type: "AGENT" | "SUB_AGENT", configured: number, upline = 0) {
  const applied = effectiveAgentPercentage(type, configured);
  const result = calculateSettlement(amount, applied, upline, type);
  return { amount, absoluteAmount: result.absoluteAmount, agentShare: result.agentShare, uplineShare: result.uplineShare, companyShare: result.companyShare, signedAgent: signedSettlementShare(amount, result.agentShare), payableUpline: payableShare(amount, result.uplineShare), signedCompanyProfit: signedSettlementShare(amount, result.companyProfit) };
}

describe("agent and sub agent settlement rules", () => {
  it("normal ID at 20% posts +20 for +100 and -20 for -100", () => {
    expect(settle(100, "AGENT", 20).signedAgent.toString()).toBe("20");
    expect(settle(-100, "AGENT", 20).signedAgent.toString()).toBe("-20");
  });

  it("SubAgent ID at 80% keeps 80 and posts the remaining 20 to the agent, following the sign", () => {
    expect(effectiveAgentPercentage("SUB_AGENT", 80).toString()).toBe("20");
    expect(settle(100, "SUB_AGENT", 80).signedAgent.toString()).toBe("20");
    expect(settle(-100, "SUB_AGENT", 80).signedAgent.toString()).toBe("-20");
    expect(settle(100, "SUB_AGENT", 80).companyShare.toString()).toBe("20");
  });

  it("worked example: +100,000 SubAgent 80% with 17% upline gives +20,000 agent, -17,000 upline, +3,000 profit (mirrored for -100,000)", () => {
    const gain = settle(100000, "SUB_AGENT", 80, 17);
    expect(gain.signedAgent.toString()).toBe("20000");
    expect(gain.payableUpline.toString()).toBe("-17000");
    expect(gain.signedCompanyProfit.toString()).toBe("3000");
    const gainSum = summarizeSettlementProfit([gain]);
    expect(gainSum.companyProfit.toString()).toBe("3000");
    const gainSplit = allocateShareholderProfit(gainSum.companyProfit, [{ shareholderId: "a", percentage: 60 }, { shareholderId: "b", percentage: 40 }]);
    expect(gainSplit.map((item) => item.amount.neg().toString())).toEqual(["-1800", "-1200"]);

    const loss = settle(-100000, "SUB_AGENT", 80, 17);
    expect(loss.signedAgent.toString()).toBe("-20000");
    expect(loss.payableUpline.toString()).toBe("17000");
    expect(loss.signedCompanyProfit.toString()).toBe("-3000");
    const lossSum = summarizeSettlementProfit([loss]);
    expect(lossSum.companyProfit.toString()).toBe("-3000");
    const lossSplit = allocateShareholderProfit(lossSum.companyProfit, [{ shareholderId: "a", percentage: 60 }, { shareholderId: "b", percentage: 40 }]);
    expect(lossSplit.map((item) => item.amount.neg().toString())).toEqual(["1800", "1200"]);
  });

  it("normal AGENT 30% and SUB_AGENT 80%/85% with 20%/17% upline at +-100,000", () => {
    const normalGain = settle(100000, "AGENT", 30, 20);
    expect(normalGain.signedAgent.toString()).toBe("30000");
    expect(normalGain.payableUpline.toString()).toBe("-20000");
    expect(normalGain.signedCompanyProfit.toString()).toBe("50000");
    const normalLoss = settle(-100000, "AGENT", 30, 20);
    expect(normalLoss.signedAgent.toString()).toBe("-30000");
    expect(normalLoss.payableUpline.toString()).toBe("20000");
    expect(normalLoss.signedCompanyProfit.toString()).toBe("-50000");

    const breakEven = settle(100000, "SUB_AGENT", 80, 20);
    expect(breakEven.signedCompanyProfit.toString()).toBe("0");
    const subLossOnGain = settle(100000, "SUB_AGENT", 85, 17);
    expect(subLossOnGain.signedCompanyProfit.toString()).toBe("-2000");
    expect(summarizeSettlementProfit([subLossOnGain]).companyProfit.toString()).toBe("-2000");
    const subGainOnLoss = settle(-100000, "SUB_AGENT", 85, 17);
    expect(subGainOnLoss.signedCompanyProfit.toString()).toBe("2000");
    expect(summarizeSettlementProfit([subGainOnLoss]).companyProfit.toString()).toBe("2000");
  });

  it("SubAgent ID at 0% posts everything to the agent and at 100% posts nothing", () => {
    expect(settle(100, "SUB_AGENT", 0).signedAgent.toString()).toBe("100");
    expect(settle(100, "SUB_AGENT", 100).signedAgent.toString()).toBe("0");
  });

  it("sign helpers treat zero as a gain and follow negatives", () => {
    expect(settlementSign(0)).toBe(1);
    expect(settlementSign(-0.01)).toBe(-1);
    expect(signedSettlementShare(-50, 12.5).toString()).toBe("-12.5");
  });

  it("payable share is negative when the company owes the upline or partner", () => {
    expect(payableShare(100000, 20000).toString()).toBe("-20000");
    expect(payableShare(-100000, 20000).toString()).toBe("20000");
  });
});

describe("signed profit distribution", () => {
  const row = (amount: number, type: "AGENT" | "SUB_AGENT", pct: number, upline = 0) => settle(amount, type, pct, upline);

  it("a -1000 normal settlement at 20% with a 10% upline is a company loss of -700 split -420/-280", () => {
    const totals = summarizeSettlementProfit([row(-1000, "AGENT", 20, 10)]);
    expect(totals.totalSettlements.toString()).toBe("-1000");
    expect(totals.agentShare.toString()).toBe("-200");
    expect(totals.uplineShare.toString()).toBe("-100");
    expect(totals.companyProfit.toString()).toBe("-700");
    const split = allocateShareholderProfit(totals.companyProfit, [{ shareholderId: "a", percentage: 60 }, { shareholderId: "b", percentage: 40 }]);
    expect(split.map((item) => item.amount.toString())).toEqual(["-420", "-280"]);
  });

  it("a +1000 normal settlement stays +700 split 420/280", () => {
    const totals = summarizeSettlementProfit([row(1000, "AGENT", 20, 10)]);
    expect(totals.companyProfit.toString()).toBe("700");
    expect(allocateShareholderProfit(totals.companyProfit, [{ shareholderId: "a", percentage: 60 }, { shareholderId: "b", percentage: 40 }]).map((item) => item.amount.toString())).toEqual(["420", "280"]);
  });

  it("gains and losses net off within one distribution period", () => {
    const totals = summarizeSettlementProfit([row(1000, "AGENT", 20, 10), row(-400, "AGENT", 20, 10)]);
    expect(totals.totalSettlements.toString()).toBe("600");
    expect(totals.companyProfit.toString()).toBe("420");
  });

  it("SubAgent settlements use the remainder for the agent and follow the sign", () => {
    expect(summarizeSettlementProfit([row(100, "SUB_AGENT", 80)]).companyProfit.toString()).toBe("20");
    expect(summarizeSettlementProfit([row(-100, "SUB_AGENT", 80)]).companyProfit.toString()).toBe("-20");
    expect(summarizeSettlementProfit([row(-100, "SUB_AGENT", 80)]).agentShare.toString()).toBe("-20");
  });
});
