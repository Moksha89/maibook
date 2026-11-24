import { describe, expect, it } from "vitest";

import { csvCell } from "./csv";

describe("csvCell", () => {
  it("quotes and escapes", () => expect(csvCell('a "b"')).toBe('"a ""b"""'));
  it("neutralises spreadsheet formulas but keeps negative numbers", () => {
    expect(csvCell("=SUM(A1)")).toBe(`"'=SUM(A1)"`);
    expect(csvCell("@cmd")).toBe(`"'@cmd"`);
    expect(csvCell("-12.50")).toBe('"-12.50"');
  });
});
