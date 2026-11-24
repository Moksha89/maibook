import type { Metadata } from "next";
import { Download } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { hasPermission, requirePermission } from "@/lib/auth/permissions";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { ReportForm } from "./report-form";
import { ReportTemplateForm } from "./template-form";

export const metadata: Metadata = { title: "Reports" };

export default async function ReportsPage() {
  await requirePermission("reports.read");
  const session = await requireSession();
  const superAdmin = session.user.roles.some(({ role }) => role.key === "superadmin");
  const accessFilter = superAdmin ? {} : { userAccess: { some: { userId: session.userId } } };
  const [canGenerate, canExport, companies, reports, templates] = await Promise.all([
    hasPermission("reports.generate"), hasPermission("reports.export"),
    db.company.findMany({ where: { deletedAt: null, status: "ACTIVE", ...accessFilter }, include: { agents: { where: { removedAt: null }, include: { agent: { select: { id: true, name: true } } }, orderBy: { agent: { name: "asc" } } } }, orderBy: { name: "asc" } }),
    db.generatedReport.findMany({ where: { company: accessFilter }, include: { company: { select: { name: true } }, deliveries: { select: { status: true } }, template: { select: { name: true } } }, orderBy: { generatedAt: "desc" }, take: 100 }),
    db.reportTemplate.findMany({ where: { isActive: true }, select: { id: true, name: true, type: true }, orderBy: { name: "asc" } }),
  ]);
  const options = companies.map((company) => ({ id: company.id, name: company.name, agents: company.agents.map(({ agent }) => agent) }));
  return <><PageHeader title="Reports" description="Company, agent, settlement, and profit reports in PDF, PNG, CSV, text, and print formats." />{canGenerate && options.length ? <><ReportForm companies={options} templates={templates} /><ReportTemplateForm /></> : null}<section className="mt-3 overflow-hidden rounded-lg border bg-white"><div className="border-b px-3 py-2"><h2 className="text-sm font-bold">Generated reports</h2></div><div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-xs"><thead className="bg-[#fff4d7] text-[#59400f]"><tr><th className="px-3 py-2">Generated</th><th className="px-3 py-2">Company</th><th className="px-3 py-2">Report</th><th className="px-3 py-2">Template</th><th className="px-3 py-2">Format</th><th className="px-3 py-2">Delivery</th><th className="px-3 py-2">Expires</th><th className="px-3 py-2">File</th></tr></thead><tbody>{reports.map((report) => <tr key={report.id} className="border-t hover:bg-[#fafbfc]"><td className="px-3 py-2">{report.generatedAt.toLocaleString()}</td><td className="px-3 py-2">{report.company?.name || "—"}</td><td className="px-3 py-2">{report.type.replaceAll("_", " ")}</td><td className="px-3 py-2">{report.template?.name || "Default"}</td><td className="px-3 py-2 font-mono">{report.format}</td><td className="px-3 py-2">{report.deliveries.length ? report.deliveries.map((delivery) => delivery.status).join(", ") : "Not sent"}</td><td className="px-3 py-2">{report.expiresAt?.toLocaleDateString() || "—"}</td><td className="px-3 py-2">{canExport ? <a href={`/api/reports/${report.id}/download`} target="_blank" className="inline-flex items-center gap-1 font-semibold text-[#8b620d] underline"><Download className="size-3" />Open</a> : "—"}</td></tr>)}</tbody></table></div>{!reports.length ? <p className="px-3 py-8 text-center text-xs text-[#647386]">No reports have been generated.</p> : null}</section></>;
}
