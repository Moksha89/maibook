/** Quote one CSV cell. Text that a spreadsheet could read as a formula is neutralised. */
export function csvCell(value: string): string {
  const safe = /^[\s]*[=+@\t\r|]/.test(value) || /^[\s]*-(?![\d.,]+$)/.test(value) ? `'${value}` : value;
  return `"${safe.replaceAll('"', '""')}"`;
}

export function csvResponse(fileName: string, rows: string[][]): Response {
  const body = `\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}`;
  return new Response(body, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="${fileName}.csv"` } });
}
