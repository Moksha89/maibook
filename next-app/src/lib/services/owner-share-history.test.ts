import { describe, expect, it } from "vitest";
import { shareAt } from "./owner-share-history";

describe("shareAt", () => {
  const history = [
    { effectiveFrom: new Date(0), percentage: "25" },
    { effectiveFrom: new Date("2026-11-24T18:00:00Z"), percentage: "50" },
  ];
  it("keeps the old % for settlements posted before the change", () => {
    expect(shareAt(history, new Date("2026-11-20T10:00:00Z"), 50)).toBe(25);
  });
  it("uses the new % for settlements posted after the change", () => {
    expect(shareAt(history, new Date("2026-11-25T10:00:00Z"), 50)).toBe(50);
  });
  it("falls back to the current % when there is no history", () => {
    expect(shareAt([], new Date(), 30)).toBe(30);
  });
  it("past profit stays the same after an edit", () => {
    const settlements = [{ at: new Date("2026-11-10T00:00:00Z"), profit: 1000 }, { at: new Date("2026-11-26T00:00:00Z"), profit: 1000 }];
    const total = settlements.reduce((sum, s) => sum + (s.profit * shareAt(history, s.at, 50)) / 100, 0);
    expect(total).toBe(250 + 500);
  });
});
