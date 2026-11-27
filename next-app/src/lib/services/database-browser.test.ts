import { describe, expect, it } from "vitest";

import { assertIdent, isAllowedColumnType, isCoreTable, isSensitiveColumn, maskRow, maskValue, quoteIdent, writableValues } from "./database-browser";

describe("database browser safeguards", () => {
  it("accepts only simple identifiers", () => {
    expect(assertIdent("owners")).toBe("owners");
    expect(quoteIdent("owner_entries")).toBe('"owner_entries"');
    expect(() => assertIdent("owners; drop table users")).toThrow(/valid SQL identifier/);
    expect(() => assertIdent("users--")).toThrow(/valid SQL identifier/);
    expect(() => assertIdent('users"')).toThrow(/valid SQL identifier/);
    expect(() => assertIdent("")).toThrow(/valid SQL identifier/);
  });

  it("masks password, token and session columns and refuses to write them", () => {
    expect(isSensitiveColumn("passwordHash")).toBe(true);
    expect(isSensitiveColumn("session_key")).toBe(true);
    expect(isSensitiveColumn("api_token")).toBe(true);
    expect(isSensitiveColumn("refreshToken")).toBe(true);
    expect(isSensitiveColumn("name")).toBe(false);
    expect(maskValue("password", "secret")).toBe("••••");
    expect(maskValue("name", "Ada")).toBe("Ada");
    expect(maskRow({ name: "Ada", passwordHash: "abc", amount: 10 })).toEqual({ name: "Ada", passwordHash: "••••", amount: 10 });
    expect(writableValues({ name: "Ada", passwordHash: "abc", amount: 10 })).toEqual({ name: "Ada", amount: 10 });
  });

  it("flags core app tables so a drop can show an extra warning", () => {
    expect(isCoreTable("settlements")).toBe(true);
    expect(isCoreTable("users")).toBe(true);
    expect(isCoreTable("E2E_tmp_table")).toBe(false);
    expect(isAllowedColumnType("text")).toBe(true);
    expect(isAllowedColumnType("drop table")).toBe(false);
  });
});
