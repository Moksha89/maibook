import type { Metadata } from "next";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { hasPermission, requirePermission } from "@/lib/auth/permissions";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { AgentForm } from "./agent-form";

export const metadata: Metadata = { title: "Agents" };

export default async function AgentsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requirePermission("agents.read");
  const session = await requireSession();
  const { q = "" } = await searchParams;
  const superAdmin = session.user.roles.some(({ role }) => role.key === "superadmin");
  const accessFilter = superAdmin ? {} : { userAccess: { some: { userId: session.userId } } };
  const [canCreate, companies, agents] = await Promise.all([
    hasPermission("agents.create"),
    db.company.findMany({ where: { deletedAt: null, status: "ACTIVE", ...accessFilter }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.agent.findMany({
      where: {
        deletedAt: null,
        ...(q.trim() ? { OR: [{ name: { contains: q.trim(), mode: "insensitive" } }, { phone: { contains: q.trim() } }] } : {}),
        companies: { some: { removedAt: null, company: accessFilter } },
      },
      include: { companies: { where: { removedAt: null, company: accessFilter }, include: { company: { select: { id: true, name: true, currency: true } } }, orderBy: { company: { name: "asc" } } }, _count: { select: { identifiers: true } } },
      orderBy: { name: "asc" },
      take: 100,
    }),
  ]);

  return (
    <>
      <PageHeader title="Agents" description="Global agent directory with company-specific opening and running balances." />
      {canCreate && companies.length ? <AgentForm companies={companies} /> : null}
      <section className="mt-3 overflow-hidden rounded-lg border bg-white">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2"><h2 className="text-sm font-bold">Agent directory</h2><form className="flex items-center gap-1.5"><Input name="q" defaultValue={q} placeholder="Search agents" className="h-8 w-52" /><Button type="submit" variant="secondary" aria-label="Search"><Search className="size-4" /></Button></form></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[780px] text-left text-xs"><thead className="bg-[#fff4d7] text-[#59400f]"><tr><th className="px-3 py-2">Agent</th><th className="px-3 py-2">Contact</th><th className="px-3 py-2">Companies</th><th className="px-3 py-2 text-right">Opening</th><th className="px-3 py-2 text-right">Current</th><th className="px-3 py-2 text-right">IDs</th><th className="px-3 py-2">Status</th></tr></thead><tbody>{agents.flatMap((agent) => agent.companies.map((assignment, index) => <tr key={`${agent.id}-${assignment.companyId}`} className="border-t hover:bg-[#fafbfc]"><td className="px-3 py-2 font-semibold">{index === 0 ? agent.name : ""}</td><td className="px-3 py-2 text-[#647386]">{index === 0 ? agent.phone || agent.email || "—" : ""}</td><td className="px-3 py-2">{assignment.company.name}</td><td className="px-3 py-2 text-right font-mono">{assignment.openingBalance.toFixed(2)}</td><td className={`px-3 py-2 text-right font-mono font-semibold ${assignment.currentBalance.isNegative() ? "text-[#b42318]" : "text-[#16794b]"}`}>{assignment.currentBalance.toFixed(2)}</td><td className="px-3 py-2 text-right font-mono">{index === 0 ? agent._count.identifiers : ""}</td><td className="px-3 py-2">{index === 0 ? <StatusBadge tone={agent.status === "ACTIVE" ? "success" : "neutral"}>{agent.status}</StatusBadge> : null}</td></tr>))}</tbody></table></div>
        {!agents.length ? <p className="px-3 py-8 text-center text-xs text-[#647386]">No agents match this view.</p> : null}
      </section>
    </>
  );
}
