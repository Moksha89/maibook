import { describe, expect, it } from "vitest";

import { csvCell } from "./csv";

describe("csvCell", () => {
  it("quotes and escapes", () => expect(csvCell('a "b"')).toBe('"a ""b"""'));
  it("neutralises spreadsheet formulas but keeps negative numbers", () => {
    expect(csvCell("=SUM(A1)")).toBe(`"'=SUM(A1)"`);
    expect(csvCell("@cmd")).toBe(`"'@cmd"`);
    expect(csvCell("-12.50")).toBe('"-12.50"');
    expect(csvCell("-1,200")).toBe('"-1,200"');
    expect(csvCell("-2+3+cmd|' /C calc'!A0")).toBe(`"'-2+3+cmd|' /C calc'!A0"`);
    expect(csvCell(" =HYPERLINK(1)")).toBe(`"' =HYPERLINK(1)"`);
    expect(csvCell("+91 98765")).toBe(`"'+91 98765"`);
  });
});
