import Decimal from "decimal.js";

Decimal.set({ precision: 40, rounding: Decimal.ROUND_HALF_UP });

export type DecimalInput = Decimal.Value;
export type PartnerDirection = "SENDER" | "RECEIVER";

export interface SettlementCalculation {
  absoluteAmount: Decimal;
  agentShare: Decimal;
  companyShare: Decimal;
  uplineShare: Decimal;
  companyProfit: Decimal;
}

export interface ShareholderAllocation {
  shareholderId: string;
  percentage: DecimalInput;
}

export function decimal(value: DecimalInput) {
  const result = new Decimal(value);
  if (!result.isFinite()) throw new Error("Financial values must be finite.");
  return result;
}

export function assertPercentage(value: DecimalInput, field = "Percentage") {
  const percentage = decimal(value);
  if (percentage.lt(0) || percentage.gt(100)) {
    throw new Error(`${field} must be between 0 and 100.`);
  }
  return percentage;
}

export function calculateCashValue(coins: DecimalInput, rate: DecimalInput) {
  const parsedRate = decimal(rate);
  if (parsedRate.lt(0)) throw new Error("Rate cannot be negative.");
  return decimal(coins).mul(parsedRate).toDecimalPlaces(8);
}

export function calculateClosingBalance(
  openingBalance: DecimalInput,
  coins: DecimalInput,
  direction: PartnerDirection,
) {
  const signedCoins = decimal(coins).abs();
  return direction === "RECEIVER"
    ? decimal(openingBalance).add(signedCoins)
    : decimal(openingBalance).sub(signedCoins);
}

export function splitCreditDebit(value: DecimalInput) {
  const signedValue = decimal(value);
  return signedValue.gte(0)
    ? { credit: signedValue, debit: new Decimal(0) }
    : { credit: new Decimal(0), debit: signedValue.abs() };
}

/**
 * Percentage of a settlement that is posted to the agent. A normal (AGENT) ID posts its configured percentage.
 * A SUB_AGENT ID keeps its configured percentage with the sub agent, so the agent is posted the remainder.
 */
export function effectiveAgentPercentage(type: "AGENT" | "SUB_AGENT", configuredPercentage: DecimalInput) {
  const rate = assertPercentage(configuredPercentage, "Agent percentage");
  return type === "SUB_AGENT" ? new Decimal(100).sub(rate) : rate;
}

/** +1 for a settlement that gains, -1 for one that loses. Shares and profit always follow this sign. */
export function settlementSign(amount: DecimalInput) {
  return decimal(amount).isNegative() ? -1 : 1;
}

export function signedSettlementShare(amount: DecimalInput, share: DecimalInput) {
  return decimal(share).abs().mul(settlementSign(amount));
}

/** Signed totals for a set of posted settlements: losses reduce profit. */
export function summarizeSettlementProfit(rows: { amount: DecimalInput; absoluteAmount: DecimalInput; agentShare: DecimalInput; uplineShare: DecimalInput }[]) {
  let total = decimal(0);
  let agentShare = decimal(0);
  let uplineShare = decimal(0);
  for (const row of rows) {
    total = total.add(signedSettlementShare(row.amount, row.absoluteAmount));
    agentShare = agentShare.add(signedSettlementShare(row.amount, row.agentShare));
    uplineShare = uplineShare.add(signedSettlementShare(row.amount, row.uplineShare));
  }
  return { totalSettlements: total, agentShare, uplineShare, companyProfit: total.sub(agentShare).sub(uplineShare) };
}

export function calculateSettlement(
  amount: DecimalInput,
  agentPercentage: DecimalInput,
  uplinePercentage: DecimalInput = 0,
): SettlementCalculation {
  const absoluteAmount = decimal(amount).abs().toDecimalPlaces(8);
  const agentRate = assertPercentage(agentPercentage, "Agent percentage");
  const uplineRate = assertPercentage(uplinePercentage, "Upline percentage");
  // 1) Upline share = settlement × site upline %. 2) Agent commission = settlement × agent %. 3) Company keeps the remainder.
  const uplineShare = absoluteAmount.mul(uplineRate).div(100).toDecimalPlaces(8);
  const agentShare = absoluteAmount.mul(agentRate).div(100).toDecimalPlaces(8);
  const companyProfit = absoluteAmount.sub(uplineShare).sub(agentShare);
  const companyShare = companyProfit;

  if (companyProfit.lt(0)) {
    throw new Error("Upline share and agent commission cannot exceed the settlement amount.");
  }

  return { absoluteAmount, agentShare, companyShare, uplineShare, companyProfit };
}

export function allocateShareholderProfit(
  companyProfit: DecimalInput,
  shareholders: ShareholderAllocation[],
) {
  const profit = decimal(companyProfit);
  const totalPercentage = shareholders.reduce(
    (total, shareholder) => total.add(assertPercentage(shareholder.percentage)),
    new Decimal(0),
  );

  if (totalPercentage.gt(100)) {
    throw new Error("Active shareholder percentages cannot exceed 100 percent.");
  }

  const totalAllocated = profit.mul(totalPercentage).div(100).toDecimalPlaces(8);
  let allocated = decimal(0);
  return shareholders.map((shareholder, index) => {
    const amount = index === shareholders.length - 1
      ? totalAllocated.sub(allocated)
      : profit.mul(shareholder.percentage).div(100).toDecimalPlaces(8, Decimal.ROUND_DOWN);
    allocated = allocated.add(amount);
    return { shareholderId: shareholder.shareholderId, percentage: decimal(shareholder.percentage), amount };
  });
}

export function recalculateRunningBalances(
  openingBalance: DecimalInput,
  changes: DecimalInput[],
) {
  let balance = decimal(openingBalance);
  return changes.map((change) => {
    const opening = balance;
    balance = opening.add(change);
    return { openingBalance: opening, closingBalance: balance };
  });
}

export function allocateManualAgentAmount(amount: DecimalInput, balances: { companyId: string; balance: DecimalInput }[]) {
  if (!balances.length) throw new Error("The agent has no active company assignments.");
  const signedAmount = decimal(amount).toDecimalPlaces(8);
  if (signedAmount.isZero()) throw new Error("Amount cannot be zero.");
  let remaining = signedAmount.abs();
  const allocations = new Map(balances.map(({ companyId }) => [companyId, new Decimal(0)]));
  const outstanding = balances.map((item) => ({ companyId: item.companyId, amount: decimal(item.balance).abs() })).filter((item) => item.amount.gt(0)).sort((left, right) => left.amount.comparedTo(right.amount));
  for (const item of outstanding) { if (remaining.isZero()) break; const paid = Decimal.min(remaining, item.amount); allocations.set(item.companyId, allocations.get(item.companyId)!.add(paid)); remaining = remaining.sub(paid); }
  if (remaining.gt(0)) {
    const even = remaining.div(balances.length).toDecimalPlaces(8, Decimal.ROUND_DOWN);
    balances.forEach(({ companyId }, index) => {
      const share = index === balances.length - 1 ? remaining.sub(even.mul(balances.length - 1)) : even;
      allocations.set(companyId, allocations.get(companyId)!.add(share));
    });
  }
  const sign = signedAmount.isNegative() ? -1 : 1;
  return balances.map(({ companyId }) => ({ companyId, amount: allocations.get(companyId)!.mul(sign) })).filter((item) => !item.amount.isZero());
}
