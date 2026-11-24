import { z } from "zod";

import { requireCompanyAccess, requirePermission } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import { getBranding } from "@/lib/services/branding";
import { fmtDate, loadReportTable, type ReportParameters } from "@/lib/services/report-data";
import { escapeXml, renderPdf, renderPng, reportFileName } from "@/lib/services/report-render";

function escapeCsv(value: string) { return `"${value.replaceAll('"', '""')}"`; }
const fileName = reportFileName;

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
  if (report.template) table.subtitle = report.template.body.replaceAll("{{company}}", table.subtitle.split(" · ")[0] || "").replaceAll("{{startDate}}", fmtDate(parameters.startDate)).replaceAll("{{endDate}}", fmtDate(parameters.endDate));
  if (format === "CSV") { const body = `\uFEFF${[table.columns, ...table.rows].map((row) => row.map(escapeCsv).join(",")).join("\r\n")}`; return new Response(body, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="${fileName(table.title, "csv")}"` } }); }
  if (format === "TEXT") { const body = `${table.title}\n${table.subtitle}\n\n${[table.columns, ...table.rows].map((row) => row.join("\t")).join("\n")}`; return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8", "content-disposition": `attachment; filename="${fileName(table.title, "txt")}"` } }); }
  if (format === "PRINT") { const rows = table.rows.map((row) => `<tr>${row.map((value) => `<td>${escapeXml(value)}</td>`).join("")}</tr>`).join(""); const html = `<!doctype html><html><head><meta charset="utf-8"><title>${escapeXml(table.title)}</title><style>body{font:12px Arial;margin:24px;color:#17263a}h1{font-size:20px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccd3db;padding:5px;text-align:left}th{background:#fff4d7}@media print{button{display:none}}</style></head><body><button onclick="print()">Print</button><h1>${escapeXml(table.title)}</h1><p>${escapeXml(table.subtitle)}</p><table><thead><tr>${table.columns.map((column) => `<th>${escapeXml(column)}</th>`).join("")}</tr></thead><tbody>${rows}</tbody></table></body></html>`; return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } }); }
  if (format === "PNG") { const body = await renderPng(table); return new Response(new Uint8Array(body), { headers: { "content-type": "image/png", "content-disposition": `attachment; filename="${fileName(table.title, "png")}"` } }); }
  const body = await renderPdf(table, await getBranding());
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
