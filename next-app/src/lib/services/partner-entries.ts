/** Partner payment effect on the balance due. Negative balance means the company owes the partner. */

export type PartnerPaymentDirection = "PAID" | "RECEIVED";

/** Paid to the partner moves the balance toward positive; received from the partner moves it the other way. */
export function partnerPaymentShare(direction: PartnerPaymentDirection, amount: number) {
  const value = Math.abs(amount);
  return direction === "PAID" ? value : -value;
}

/** Balance due after profit share (already signed) and payment entries. */
export function partnerBalanceDue(profitShare: number, payments: { direction: PartnerPaymentDirection; amount: number }[]) {
  return payments.reduce((total, payment) => total + partnerPaymentShare(payment.direction, payment.amount), profitShare);
}

export function partnerRunningBalances<T extends { ownerShare: number }>(rowsOldestFirst: T[]) {
  let balance = 0;
  return rowsOldestFirst.map((row) => {
    balance += row.ownerShare;
    return { ...row, balance };
  });
}
