import { describe, expect, it } from "vitest";
import { chooseOwner } from "./owner-shareholder-link";

const owner = (overrides: Partial<{ id: string; createdById: string | null; companyId: string | null; createdAt: Date; companyLinks: { companyId: string }[] }>) => ({
  id: "a",
  createdById: null,
  companyId: null,
  createdAt: new Date("2026-01-01"),
  companyLinks: [],
  ...overrides,
});

describe("chooseOwner", () => {
  it("returns null when there are no owners", () => {
    expect(chooseOwner([])).toBeNull();
  });

  it("prefers the owner already linked to the company", () => {
    const linked = owner({ id: "linked", createdAt: new Date("2026-06-01"), companyLinks: [{ companyId: "c1" }] });
    const earlier = owner({ id: "earlier", createdAt: new Date("2026-01-01") });
    expect(chooseOwner([earlier, linked], { companyId: "c1" })?.id).toBe("linked");
  });

  it("prefers the owner created by the acting user", () => {
    const other = owner({ id: "other", createdById: "u2" });
    const mine = owner({ id: "mine", createdById: "u1", createdAt: new Date("2026-06-01") });
    expect(chooseOwner([other, mine], { actorId: "u1" })?.id).toBe("mine");
  });

  it("prefers a standalone owner, then the earliest", () => {
    const tied = owner({ id: "tied", companyId: "c9", createdAt: new Date("2026-01-01") });
    const standalone = owner({ id: "free", companyId: null, createdAt: new Date("2026-02-01") });
    expect(chooseOwner([tied, standalone])?.id).toBe("free");
    expect(chooseOwner([tied])?.id).toBe("tied");
  });
});
