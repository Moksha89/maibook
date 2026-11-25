import "server-only";

import PDFDocument from "pdfkit";
import sharp from "sharp";
import path from "node:path";

import type { ReportTable } from "@/lib/services/report-data";

export function escapeXml(value: string) { return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;"); }
export function reportFileName(title: string, extension: string) { return `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}.${extension}`; }

export async function renderPdf(table: ReportTable, brand: { title: string; footer: string }) {
  const regularFont = path.join(process.cwd(), "node_modules", "next", "dist", "compiled", "@vercel", "og", "Geist-Regular.ttf");
  const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 32, font: regularFont });
  doc.registerFont("Helvetica", regularFont);
  doc.registerFont("Helvetica-Bold", regularFont);
  const chunks: Buffer[] = [];
  doc.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
  const done = new Promise<Buffer>((resolve, reject) => { doc.on("end", () => resolve(Buffer.concat(chunks))); doc.on("error", reject); });
  const pageWidth = doc.page.width - 64;
  const columnWidth = pageWidth / table.columns.length;
  const drawHeader = () => { const y = doc.y; doc.font("Helvetica-Bold").fontSize(7); table.columns.forEach((column, index) => doc.text(column, 32 + index * columnWidth, y, { width: columnWidth - 4, ellipsis: true })); doc.y = y + 12; doc.moveTo(32, doc.y).lineTo(doc.page.width - 32, doc.y).strokeColor("#c9952e").stroke(); doc.moveDown(0.4); };
  doc.fillColor("#a97819").font("Helvetica-Bold").fontSize(9).text(brand.title.toUpperCase()).moveDown(0.2);
  doc.fillColor("#10233f").font("Helvetica-Bold").fontSize(16).text(table.title);
  doc.fillColor("#52647a").font("Helvetica").fontSize(9).text(table.subtitle).moveDown(0.8);
  drawHeader();
  if (!table.rows.length) doc.fillColor("#52647a").font("Helvetica").fontSize(10).text("No entries for this period.", 32, doc.y + 6);
  for (const row of table.rows) { if (doc.y > doc.page.height - 48) { doc.addPage(); drawHeader(); } const y = doc.y; doc.fillColor("#1f2f43").font("Helvetica").fontSize(7); row.forEach((value, index) => doc.text(value, 32 + index * columnWidth, y, { width: columnWidth - 4, height: 20, ellipsis: true })); doc.y = y + 20; }
  if (brand.footer) { doc.moveDown(1).fillColor("#52647a").font("Helvetica").fontSize(8).text(brand.footer, 32, doc.y, { width: pageWidth }); }
  doc.end();
  return done;
}


export async function renderPng(table: ReportTable) {
  const width = 1500;
  const rows = table.rows.slice(0, 250);
  // The last column (remarks) is the widest; text wraps instead of being cut off.
  const weights = table.columns.map((name) => /remark/i.test(name) ? 3 : /^(type|account|source|shareholder|upline|agent)$/i.test(name) ? 1.6 : 1);
  const total = weights.reduce((a, b) => a + b, 0);
  const widths = weights.map((weight) => (width - 20) * weight / total);
  const offsets = widths.map((_, index) => 10 + widths.slice(0, index).reduce((a, b) => a + b, 0));
  const wrap = (value: string, columnWidth: number) => {
    const limit = Math.max(6, Math.floor((columnWidth - 16) / 7.6));
    const lines: string[] = [];
    for (const paragraph of String(value).split("\n")) {
      let line = "";
      for (const word of paragraph.split(/\s+/)) {
        if (!word) continue;
        if (word.length > limit) { if (line) { lines.push(line); line = ""; } for (let at = 0; at < word.length; at += limit) lines.push(word.slice(at, at + limit)); continue; }
        if ((line + " " + word).trim().length > limit) { lines.push(line); line = word; } else line = (line + " " + word).trim();
      }
      if (line) lines.push(line);
    }
    return lines.length ? lines : [""];
  };
  let y = 138;
  const body: string[] = [];
  for (const [rowIndex, row] of rows.entries()) {
    const cells = row.map((value, index) => wrap(value, widths[index] ?? 100));
    const lineCount = Math.max(...cells.map((cell) => cell.length));
    if (rowIndex % 2) body.push(`<rect x="0" y="${y - 14}" width="100%" height="${lineCount * 15 + 10}" fill="#f7f9fb"/>`);
    cells.forEach((lines, index) => lines.forEach((line, lineIndex) => body.push(`<text x="${offsets[index]}" y="${y + lineIndex * 15}">${escapeXml(line)}</text>`)));
    y += lineCount * 15 + 10;
  }
  if (!rows.length) { body.push(`<text x="10" y="${y}" font-size="14" fill="#52647a">No entries for this period.</text>`); y += 30; }
  if (table.rows.length > rows.length) { body.push(`<text x="10" y="${y}" fill="#52647a">${table.rows.length - rows.length} more rows are in the PDF or CSV export.</text>`); y += 24; }
  const height = y + 16;
  const header = table.columns.map((value, index) => `<text x="${offsets[index]}" y="100" font-weight="700">${escapeXml(value)}</text>`).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="#fff"/><style>text{font-family:Arial,sans-serif;font-size:12px;fill:#1f2f43}</style><rect width="100%" height="6" fill="#c9952e"/><text x="10" y="34" font-size="20" font-weight="700" fill="#10233f">${escapeXml(table.title)}</text><text x="10" y="56" fill="#52647a">${escapeXml(table.subtitle)}</text><rect x="0" y="78" width="100%" height="34" fill="#fff4d7"/>${header}${body.join("")}</svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}
