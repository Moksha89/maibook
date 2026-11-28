import { describe, expect, it } from "vitest";

import { isDeviceLimitEnabled } from "./device-limit";

describe("isDeviceLimitEnabled", () => {
  it("is off when the setting is missing, invalid, or explicitly disabled", () => {
    expect(isDeviceLimitEnabled(undefined)).toBe(false);
    expect(isDeviceLimitEnabled(null)).toBe(false);
    expect(isDeviceLimitEnabled("on")).toBe(false);
    expect(isDeviceLimitEnabled({})).toBe(false);
    expect(isDeviceLimitEnabled({ enabled: false })).toBe(false);
    expect(isDeviceLimitEnabled({ enabled: "true" })).toBe(false);
  });

  it("is on only when Settings has enabled set to true", () => {
    expect(isDeviceLimitEnabled({ enabled: true })).toBe(true);
  });
});
