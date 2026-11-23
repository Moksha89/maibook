import type { Metadata } from "next";

import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { hasPermission, requirePermission } from "@/lib/auth/permissions";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { IdentifierForm } from "./identifier-form";

export const metadata: Metadata = { title: "IDs" };

export default async function IdentifiersPage() {
  await requirePermission("identifiers.read");
  const session = await requireSession();
  const superAdmin = session.user.roles.some(({ role }) => role.key === "superadmin");
  const accessFilter = superAdmin ? {} : { userAccess: { some: { userId: session.userId } } };
  const [canCreate, companies, identifiers] = await Promise.all([
    hasPermission("identifiers.create"),
    db.company.findMany({ where: { deletedAt: null, status: "ACTIVE", ...accessFilter }, include: { agents: { where: { removedAt: null }, include: { agent: { select: { id: true, name: true } } }, orderBy: { agent: { name: "asc" } } } }, orderBy: { name: "asc" } }),
    db.agentIdentifier.findMany({ where: { deletedAt: null, company: accessFilter }, include: { company: { select: { name: true } }, agent: { select: { name: true } }, _count: { select: { settlements: true } } }, orderBy: [{ company: { name: "asc" } }, { value: "asc" }], take: 200 }),
  ]);
  const options = companies.map((company) => ({ id: company.id, name: company.name, agents: company.agents.map(({ agent }) => agent) }));
  return (
    <>
      <PageHeader title="IDs" description="Company-scoped Agent and Sub Agent identifiers with snapshotted settlement rates." />
      {canCreate && options.length ? <IdentifierForm companies={options} /> : null}
      <section className="mt-3 overflow-hidden rounded-lg border bg-white">
        <div className="border-b px-3 py-2"><h2 className="text-sm font-bold">ID directory</h2></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-xs"><thead className="bg-[#fff4d7] text-[#59400f]"><tr><th className="px-3 py-2">ID</th><th className="px-3 py-2">Type</th><th className="px-3 py-2">Company</th><th className="px-3 py-2">Agent</th><th className="px-3 py-2 text-right">Rate</th><th className="px-3 py-2 text-right">Balance</th><th className="px-3 py-2 text-right">Settlements</th><th className="px-3 py-2">Status</th></tr></thead><tbody>{identifiers.map((identifier) => <tr key={identifier.id} className="border-t hover:bg-[#fafbfc]"><td className="px-3 py-2 font-mono font-semibold">{identifier.value}</td><td className="px-3 py-2">{identifier.type === "SUB_AGENT" ? "Sub Agent" : "Agent"}</td><td className="px-3 py-2">{identifier.company.name}</td><td className="px-3 py-2">{identifier.agent.name}</td><td className="px-3 py-2 text-right font-mono">{identifier.percentageRate.toFixed(2)}%</td><td className={`px-3 py-2 text-right font-mono font-semibold ${identifier.currentBalance.isNegative() ? "text-[#b42318]" : "text-[#16794b]"}`}>{identifier.currentBalance.toFixed(2)}</td><td className="px-3 py-2 text-right font-mono">{identifier._count.settlements}</td><td className="px-3 py-2"><StatusBadge tone={identifier.status === "ACTIVE" ? "success" : "neutral"}>{identifier.status}</StatusBadge></td></tr>)}</tbody></table></div>
        {!identifiers.length ? <p className="px-3 py-8 text-center text-xs text-[#647386]">No IDs have been created.</p> : null}
      </section>
    </>
  );
}
