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
  return decimal(coins).mul(parsedRate);
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

export function calculateSettlement(
  amount: DecimalInput,
  agentPercentage: DecimalInput,
  uplinePercentage: DecimalInput = 0,
): SettlementCalculation {
  const absoluteAmount = decimal(amount).abs();
  const agentRate = assertPercentage(agentPercentage, "Agent percentage");
  const uplineRate = assertPercentage(uplinePercentage, "Upline percentage");
  const agentShare = absoluteAmount.mul(agentRate).div(100);
  const companyShare = absoluteAmount.sub(agentShare);
  const uplineShare = absoluteAmount.mul(uplineRate).div(100);
  const companyProfit = companyShare.sub(uplineShare);

  if (companyProfit.lt(0)) {
    throw new Error("Upline share cannot exceed the company share.");
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

  return shareholders.map((shareholder) => ({
    shareholderId: shareholder.shareholderId,
    percentage: decimal(shareholder.percentage),
    amount: profit.mul(shareholder.percentage).div(100),
  }));
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
  const signedAmount = decimal(amount);
  if (signedAmount.isZero()) throw new Error("Amount cannot be zero.");
  let remaining = signedAmount.abs();
  const allocations = new Map(balances.map(({ companyId }) => [companyId, new Decimal(0)]));
  const outstanding = balances.map((item) => ({ companyId: item.companyId, amount: decimal(item.balance).abs() })).filter((item) => item.amount.gt(0)).sort((left, right) => left.amount.comparedTo(right.amount));
  for (const item of outstanding) { if (remaining.isZero()) break; const paid = Decimal.min(remaining, item.amount); allocations.set(item.companyId, allocations.get(item.companyId)!.add(paid)); remaining = remaining.sub(paid); }
  if (remaining.gt(0)) { const even = remaining.div(balances.length); balances.forEach(({ companyId }, index) => { const share = index === balances.length - 1 ? remaining.sub(even.mul(balances.length - 1)) : even; allocations.set(companyId, allocations.get(companyId)!.add(share)); }); }
  const sign = signedAmount.isNegative() ? -1 : 1;
  return balances.map(({ companyId }) => ({ companyId, amount: allocations.get(companyId)!.mul(sign) })).filter((item) => !item.amount.isZero());
}
