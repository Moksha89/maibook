import { describe, expect, it } from "vitest";

import { minutesSinceScheduledTime, parsePgConnection } from "./backup-schedule";

describe("minutesSinceScheduledTime", () => {
  it("counts minutes since 02:00 Asia/Kolkata (UTC+5:30)", () => {
    // 2026-11-24 02:00 IST is 2026-11-23 20:30 UTC.
    expect(minutesSinceScheduledTime(new Date("2026-11-23T20:30:00Z"), "Asia/Kolkata", 2)).toBe(0);
    expect(minutesSinceScheduledTime(new Date("2026-11-23T20:45:00Z"), "Asia/Kolkata", 2)).toBe(15);
  });

  it("wraps to the previous day before the scheduled hour", () => {
    // 01:00 IST is 23 hours after the previous 02:00.
    expect(minutesSinceScheduledTime(new Date("2026-11-23T19:30:00Z"), "Asia/Kolkata", 2)).toBe(23 * 60);
  });

  it("honours other time zones", () => {
    expect(minutesSinceScheduledTime(new Date("2026-11-24T02:10:00Z"), "UTC", 2)).toBe(10);
  });
});

describe("parsePgConnection", () => {
  it("extracts the pieces pg_dump needs and ignores Prisma query options", () => {
    const parsed = parsePgConnection("postgresql://ibook:p%40ss@127.0.0.1:5433/ibook?schema=public");
    expect(parsed).toEqual({ database: "ibook", host: "127.0.0.1", port: "5433", user: "ibook", password: "p@ss" });
  });

  it("supports a unix socket host parameter", () => {
    expect(parsePgConnection("postgresql://pg@localhost/db?host=/tmp/pgl").host).toBe("/tmp/pgl");
  });
});
