import PDFDocument from "pdfkit";
import sharp from "sharp";
import path from "node:path";
import { z } from "zod";

import { requireCompanyAccess, requirePermission } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import { getBranding } from "@/lib/services/branding";
import { loadReportTable, type ReportParameters } from "@/lib/services/report-data";

function escapeCsv(value: string) { return `"${value.replaceAll('"', '""')}"`; }
function escapeXml(value: string) { return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;"); }
function fileName(title: string, extension: string) { return `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}.${extension}`; }

async function pdf(table: Awaited<ReturnType<typeof loadReportTable>>, brand: { title: string; footer: string }) {
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
  for (const row of table.rows) { if (doc.y > doc.page.height - 48) { doc.addPage(); drawHeader(); } const y = doc.y; doc.fillColor("#1f2f43").font("Helvetica").fontSize(7); row.forEach((value, index) => doc.text(value, 32 + index * columnWidth, y, { width: columnWidth - 4, height: 20, ellipsis: true })); doc.y = y + 20; }
  if (brand.footer) { doc.moveDown(1).fillColor("#52647a").font("Helvetica").fontSize(8).text(brand.footer, 32, doc.y, { width: pageWidth }); }
  doc.end();
  return done;
}

async function png(table: Awaited<ReturnType<typeof loadReportTable>>) {
  const rows = table.rows.slice(0, 60);
  const width = 1400;
  const height = 130 + (rows.length + 1) * 28;
  const columnWidth = width / table.columns.length;
  const header = table.columns.map((value, index) => `<text x="${index * columnWidth + 10}" y="104" font-weight="700">${escapeXml(value.slice(0, 24))}</text>`).join("");
  const body = rows.map((row, rowIndex) => row.map((value, columnIndex) => `<text x="${columnIndex * columnWidth + 10}" y="${132 + rowIndex * 28}">${escapeXml(value.slice(0, 26))}</text>`).join("")).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="#fff"/><style>text{font-family:Arial,sans-serif;font-size:11px;fill:#1f2f43}</style><text x="10" y="28" font-size="20" font-weight="700" fill="#10233f">${escapeXml(table.title)}</text><text x="10" y="50" fill="#52647a">${escapeXml(table.subtitle)}</text><rect x="0" y="74" width="100%" height="42" fill="#fff4d7"/>${header}${body}</svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

async function build(request: Request, { params }: { params: Promise<{ reportId: string }> }) {
  await requirePermission("reports.export");
  const { reportId } = await params;
  const asPng = new URL(request.url).searchParams.get("as") === "png";
  if (!z.string().uuid().safeParse(reportId).success) return new Response("Report not found", { status: 404 });
  const report = await db.generatedReport.findUnique({ where: { id: reportId }, include: { template: true } });
  if (!report?.companyId || (report.expiresAt && report.expiresAt <= new Date())) return new Response("Report not found", { status: 404 });
  await requireCompanyAccess(report.companyId, "READ");
  const format = asPng ? "PNG" : report.format;
  const parameters = { ...report.parameters as unknown as ReportParameters, companyId: report.companyId };
  const table = await loadReportTable(report.type, parameters);
  if (report.template) table.subtitle = report.template.body.replaceAll("{{company}}", table.subtitle.split(" · ")[0] || "").replaceAll("{{startDate}}", new Date(parameters.startDate).toLocaleDateString()).replaceAll("{{endDate}}", new Date(parameters.endDate).toLocaleDateString());
  if (format === "CSV") { const body = `\uFEFF${[table.columns, ...table.rows].map((row) => row.map(escapeCsv).join(",")).join("\r\n")}`; return new Response(body, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="${fileName(table.title, "csv")}"` } }); }
  if (format === "TEXT") { const body = `${table.title}\n${table.subtitle}\n\n${[table.columns, ...table.rows].map((row) => row.join("\t")).join("\n")}`; return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8", "content-disposition": `attachment; filename="${fileName(table.title, "txt")}"` } }); }
  if (format === "PRINT") { const rows = table.rows.map((row) => `<tr>${row.map((value) => `<td>${escapeXml(value)}</td>`).join("")}</tr>`).join(""); const html = `<!doctype html><html><head><meta charset="utf-8"><title>${escapeXml(table.title)}</title><style>body{font:12px Arial;margin:24px;color:#17263a}h1{font-size:20px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccd3db;padding:5px;text-align:left}th{background:#fff4d7}@media print{button{display:none}}</style></head><body><button onclick="print()">Print</button><h1>${escapeXml(table.title)}</h1><p>${escapeXml(table.subtitle)}</p><table><thead><tr>${table.columns.map((column) => `<th>${escapeXml(column)}</th>`).join("")}</tr></thead><tbody>${rows}</tbody></table></body></html>`; return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } }); }
  if (format === "PNG") { const body = await png(table); return new Response(new Uint8Array(body), { headers: { "content-type": "image/png", "content-disposition": `attachment; filename="${fileName(table.title, "png")}"` } }); }
  const body = await pdf(table, await getBranding());
  return new Response(new Uint8Array(body), { headers: { "content-type": "application/pdf", "content-disposition": `attachment; filename="${fileName(table.title, "pdf")}"` } });
}

/** `?inline=1` serves the same file for in-page viewing; `?as=png` renders any report as an image preview. */
export async function GET(request: Request, context: { params: Promise<{ reportId: string }> }) {
  const response = await build(request, context);
  if (new URL(request.url).searchParams.get("inline") !== "1" || !response.ok) return response;
  const headers = new Headers(response.headers);
  headers.set("content-disposition", (headers.get("content-disposition") ?? "").replace(/^attachment/, "inline") || "inline");
  headers.set("cache-control", "private, no-store");
  return new Response(response.body, { status: response.status, headers });
}
