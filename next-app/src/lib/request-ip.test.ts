import { describe, expect, it } from "vitest";

import { clientIpFrom } from "./request-ip";

describe("clientIpFrom", () => {
  it("uses the address appended by the trusted proxy, not a spoofed first entry", () => {
    expect(clientIpFrom("6.6.6.6, 203.0.113.9", 1)).toBe("203.0.113.9");
    expect(clientIpFrom("203.0.113.9", 1)).toBe("203.0.113.9");
  });
  it("supports more than one trusted hop", () => expect(clientIpFrom("1.1.1.1, 203.0.113.9, 10.0.0.2", 2)).toBe("203.0.113.9"));
  it("rejects junk", () => {
    expect(clientIpFrom(null)).toBe("local");
    expect(clientIpFrom("<script>", 1)).toBe("local");
  });
});
