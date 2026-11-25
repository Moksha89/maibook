/** Partner payment and transfer effect on the balance due. Negative balance means the company owes the partner. */

export type PartnerPaymentDirection = "PAID" | "RECEIVED";
export type PartnerTransferDirection = "TRANSFER_OUT" | "TRANSFER_IN";
export type PartnerEntryDirection = PartnerPaymentDirection | PartnerTransferDirection;

/** Paid to the partner, or a transfer out, moves the balance toward positive. Received, or a transfer in, moves it the other way. */
export function partnerEntryShare(direction: string, amount: number) {
  const value = Math.abs(amount);
  if (direction === "RECEIVED" || direction === "TRANSFER_IN") return -value;
  if (direction === "PAID" || direction === "TRANSFER_OUT") return value;
  return 0;
}

export function partnerPaymentShare(direction: PartnerPaymentDirection, amount: number) {
  return partnerEntryShare(direction, amount);
}

/** Balance due after profit share (already signed) and payment or transfer entries. */
export function partnerBalanceDue(profitShare: number, payments: { direction: string; amount: number }[]) {
  return payments.reduce((total, payment) => total + partnerEntryShare(payment.direction, payment.amount), profitShare);
}

export function partnerRunningBalances<T extends { ownerShare: number }>(rowsOldestFirst: T[]) {
  let balance = 0;
  return rowsOldestFirst.map((row) => {
    balance += row.ownerShare;
    return { ...row, balance };
  });
}

/** A settlement or expense belongs on the partner ledger only when they held a share at posting time. */
export function includePartnerShareRow(sharePercent: number) {
  return sharePercent > 0;
}

/**
 * Move amount from one partner's overall balance to another's.
 * The transferable amount is not capped by the from-partner's balance; the from balance may change sign.
 * The total of the two balances is unchanged.
 */
export function applyPartnerTransfer(fromBalance: number, toBalance: number, amount: number) {
  const value = Math.abs(amount);
  return { fromBalance: fromBalance + value, toBalance: toBalance - value };
}
