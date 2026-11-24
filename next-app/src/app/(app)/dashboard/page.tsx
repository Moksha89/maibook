import type { Metadata } from "next";
import { Building2, ChartNoAxesCombined, IdCard, Users } from "lucide-react";

import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { requirePermission } from "@/lib/auth/permissions";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  await requirePermission("dashboard.read");
  const [companyCount, agentCount, identifierCount, settlementSummary, recentAudit] = await Promise.all([
    db.company.count({ where: { deletedAt: null, status: "ACTIVE" } }),
    db.agent.count({ where: { deletedAt: null, status: "ACTIVE" } }),
    db.agentIdentifier.count({ where: { deletedAt: null, status: "ACTIVE" } }),
    db.settlement.aggregate({ where: { status: "POSTED" }, _count: true, _sum: { absoluteAmount: true } }),
    db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 8, include: { actor: { select: { displayName: true } }, company: { select: { name: true } } } }),
  ]);
  const stats = [
    { label: "Active companies", value: companyCount.toLocaleString(), icon: Building2 },
    { label: "Active agents", value: agentCount.toLocaleString(), icon: Users },
    { label: "Active IDs", value: identifierCount.toLocaleString(), icon: IdCard },
    { label: "Posted settlements", value: settlementSummary._count.toLocaleString(), detail: settlementSummary._sum.absoluteAmount?.toFixed(2) ?? "0.00", icon: ChartNoAxesCombined },
  ];

  return (
    <>
      <PageHeader title="Dashboard" description="Current operational totals and recent account activity." />
      <section className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, detail, icon: Icon }) => <article key={label} className="rounded-lg border bg-white p-3 shadow-[0_1px_2px_rgba(8,17,31,0.04)]"><div className="flex items-center justify-between"><p className="text-xs font-semibold text-[#647386]">{label}</p><Icon className="size-4 text-[#a97819]" /></div><p className="mt-1 font-mono text-xl font-semibold text-[#0d1a2c]">{value}</p>{detail ? <p className="mt-0.5 font-mono text-[11px] text-[#647386]">Value {detail}</p> : null}</article>)}
      </section>
      <section className="mt-4 overflow-hidden rounded-lg border bg-white">
        <div className="flex items-center justify-between border-b px-3 py-2.5"><h2 className="text-sm font-bold text-[#0d1a2c]">Recent activity</h2><StatusBadge tone="success">Audit enabled</StatusBadge></div>
        {recentAudit.length ? <div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-xs"><thead className="bg-[#fff4d7] text-[#59400f]"><tr><th className="px-3 py-2 font-semibold">Action</th><th className="px-3 py-2 font-semibold">User</th><th className="px-3 py-2 font-semibold">Company</th><th className="px-3 py-2 font-semibold">When</th></tr></thead><tbody>{recentAudit.map((entry) => <tr key={entry.id} className="border-t"><td className="px-3 py-2 font-mono text-[11px]">{entry.action}</td><td className="px-3 py-2">{entry.actor?.displayName ?? "System"}</td><td className="px-3 py-2">{entry.company?.name ?? "Global"}</td><td className="px-3 py-2 text-[#647386]">{entry.createdAt.toLocaleString()}</td></tr>)}</tbody></table></div> : <p className="px-3 py-7 text-center text-xs text-[#647386]">Activity will appear here as work is recorded.</p>}
      </section>
    </>
  );
}
