import { summarizeSettlementProfit } from "@/lib/domain/finance";
import { partnerShareAmount, shareAt, type ShareHistoryRow } from "@/lib/services/owner-share-history";

export type SettlementProfitEvent = {
  createdAt: Date;
  amount: { toString(): string };
  absoluteAmount: { toString(): string };
  agentShare: { toString(): string };
  uplineShare: { toString(): string };
  companyShare: { toString(): string };
};

export type ExpenseEvent = { createdAt: Date; amount: { toString(): string } };

export function settlementCompanyProfit(row: SettlementProfitEvent) {
  return Number(
    summarizeSettlementProfit([
      {
        amount: row.amount.toString(),
        absoluteAmount: row.absoluteAmount.toString(),
        agentShare: row.agentShare.toString(),
        uplineShare: row.uplineShare.toString(),
        companyShare: row.companyShare.toString(),
      },
    ]).companyProfit.toString(),
  );
}

/** Partner totals at the share % in force when each settlement or expense was posted. */
export function partnerSharesForEvents(history: ShareHistoryRow[], settlements: SettlementProfitEvent[], expenses: ExpenseEvent[]) {
  let profitShare = 0;
  let expenseShare = 0;
  for (const row of settlements) profitShare += partnerShareAmount(settlementCompanyProfit(row), history, row.createdAt);
  for (const row of expenses) expenseShare += (Number(row.amount.toString()) * shareAt(history, row.createdAt, 0)) / 100;
  return { profitShare, expenseShare, pnlShare: profitShare + expenseShare };
}
