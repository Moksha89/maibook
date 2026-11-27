import { describe, expect, it } from "vitest";

import { includePartnerShareRow, partnerBalanceDue } from "./partner-entries";
import { partnerShareAmount, shareAt } from "./owner-share-history";

const at = (iso: string) => new Date(iso);
const pct = (from: string, percentage: string, to?: string) => ({
  effectiveFrom: at(from),
  effectiveTo: to ? at(to) : null,
  percentage,
});

describe("percentage changes must not rewrite earlier entries", () => {
  it("keeps the old partner % on settlements posted before the change", () => {
    // A change recorded at 15:00 must start then — never at the shareholder's createdAt.
    const history = [pct("2026-11-01T00:00:00Z", "40", "2026-11-27T15:00:00Z"), pct("2026-11-27T15:00:00Z", "55")];
    expect(shareAt(history, at("2026-11-10T12:00:00Z"), 55)).toBe(40);
    expect(shareAt(history, at("2026-11-27T14:59:59Z"), 55)).toBe(40);
    expect(shareAt(history, at("2026-11-27T15:00:00Z"), 40)).toBe(55);
    expect(partnerShareAmount(100000, history, at("2026-11-10T12:00:00Z"))).toBe(-40000);
    expect(partnerShareAmount(100000, history, at("2026-11-27T16:00:00Z"))).toBe(-55000);
  });

  it("does not put pre-join settlements on the partner ledger", () => {
    const history = [pct("2026-11-25T08:50:00Z", "40")];
    const before = shareAt(history, at("2026-11-25T08:40:00Z"), 40);
    const after = shareAt(history, at("2026-11-25T08:52:00Z"), 0);
    expect(before).toBe(0);
    expect(after).toBe(40);
    expect(includePartnerShareRow(before)).toBe(false);
    expect(includePartnerShareRow(after)).toBe(true);
  });

  it("leaves payment and transfer balances unchanged when a share % later changes", () => {
    const history = [pct("2026-11-01T00:00:00Z", "40", "2026-11-20T00:00:00Z"), pct("2026-11-20T00:00:00Z", "60")];
    const profitShare = partnerShareAmount(100000, history, at("2026-11-10T00:00:00Z"));
    expect(profitShare).toBe(-40000);
    expect(partnerBalanceDue(profitShare, [{ direction: "PAID", amount: 10000 }])).toBe(-30000);
    // Re-reading the same historical settlement after the % change still uses 40%.
    expect(partnerShareAmount(100000, history, at("2026-11-10T00:00:00Z"))).toBe(-40000);
  });
});
