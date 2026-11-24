import type { Metadata } from "next";
import { FilterForm } from "@/components/ui/filter-form";

import { FormModal } from "@/components/ui/form-modal";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { ActionButton } from "@/components/ui/action-button";
import { hasPermission, requirePermission } from "@/lib/auth/permissions";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { deleteIdentifierAction, setIdentifierStatusAction } from "./actions";
import { EditIdentifierForm } from "./edit-identifier-form";
import { IdentifierForm } from "./identifier-form";
import { AddModal, SetupNotice } from "@/components/ui/setup-modal";
import { CompanyForm } from "../companies/company-form";
import { AgentForm } from "../agents/agent-form";
import { ExpandingSearch } from "@/components/ui/expanding-search";

export const metadata: Metadata = { title: "IDs" };

export default async function IdentifiersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requirePermission("identifiers.read");
  const { q = "" } = await searchParams;
  const term = q.trim();
  const session = await requireSession();
  const superAdmin = session.user.roles.some(({ role }) => role.key === "superadmin");
  const accessFilter = superAdmin ? {} : { userAccess: { some: { userId: session.userId } } };
  const [canCreate, canUpdate, canDelete, companies, identifiers, allAgentNames] = await Promise.all([
    hasPermission("identifiers.create"),
    hasPermission("identifiers.update"),
    hasPermission("identifiers.delete"),
    db.company.findMany({ where: { deletedAt: null, status: "ACTIVE", ...accessFilter }, include: { agents: { where: { removedAt: null }, include: { agent: { select: { id: true, name: true } } }, orderBy: { agent: { name: "asc" } } } }, orderBy: { name: "asc" } }),
    db.agentIdentifier.findMany({ where: { deletedAt: null, company: accessFilter, ...(term ? { OR: [{ value: { contains: term, mode: "insensitive" } }, { agent: { name: { contains: term, mode: "insensitive" } } }, { company: { name: { contains: term, mode: "insensitive" } } }] } : {}) }, include: { company: { select: { name: true } }, agent: { select: { name: true } }, _count: { select: { settlements: true } } }, orderBy: [{ company: { name: "asc" } }, { value: "asc" }], take: 200 }),
    db.agent.findMany({ where: { deletedAt: null }, select: { name: true }, orderBy: { name: "asc" }, take: 1000 }),
  ]);
  const options = companies.map((company) => ({ id: company.id, name: company.name, agents: company.agents.map(({ agent }) => agent) }));
  return (
    <>
      <PageHeader title="IDs" description="Company-scoped Agent and Sub Agent identifiers with snapshotted settlement rates." actions={canCreate ? <AddModal trigger="Add ID" title="Create ID" size="xl" ready={options.some((option) => option.agents.length > 0)} setup={options.length ? <SetupNotice title="Add an agent first" form={<AgentForm companies={companies.map(({ id, name }) => ({ id, name }))} agentNames={allAgentNames.map((item) => item.name)} />}>An ID belongs to an agent in a company. Create an agent below — this window then switches to the ID form.</SetupNotice> : <SetupNotice title="Create a company first" form={<CompanyForm />}>IDs live inside a company, under an agent. Add your first company below, then an agent, then the ID.</SetupNotice>}><IdentifierForm companies={options} /></AddModal> : null} />
      <section className="mt-3 overflow-hidden rounded-lg border bg-white">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2"><h2 className="text-sm font-bold">ID directory</h2><FilterForm className="flex items-center gap-1.5"><ExpandingSearch defaultValue={q} label="Search IDs, agents or companies" /></FilterForm></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-xs"><thead className="bg-[#fff4d7] text-[#59400f]"><tr><th className="px-3 py-2">ID</th><th className="px-3 py-2">Type</th><th className="px-3 py-2">Company</th><th className="px-3 py-2">Agent</th><th className="px-3 py-2 text-right">Rate</th><th className="px-3 py-2 text-right" title="Gross settlement points posted on this ID, before the agent's share is taken">ID points (gross)</th><th className="px-3 py-2 text-right">Settlements</th><th className="px-3 py-2">Status</th>{canUpdate || canDelete ? <th className="px-3 py-2 text-right">Actions</th> : null}</tr></thead><tbody>{identifiers.map((identifier) => <tr key={identifier.id} className="border-t hover:bg-[#fafbfc]"><td className="px-3 py-2 font-mono font-semibold">{identifier.value}</td><td className="px-3 py-2">{identifier.type === "SUB_AGENT" ? "Sub Agent" : "Agent"}</td><td className="px-3 py-2">{identifier.company.name}</td><td className="px-3 py-2">{identifier.agent.name}</td><td className="px-3 py-2 text-right font-mono">{identifier.percentageRate.toFixed(2)}%</td><td className={`px-3 py-2 text-right font-mono font-semibold ${identifier.currentBalance.isNegative() ? "text-[#b42318]" : "text-[#16794b]"}`}>{identifier.currentBalance.toFixed(2)}</td><td className="px-3 py-2 text-right font-mono">{identifier._count.settlements}</td><td className="px-3 py-2"><StatusBadge tone={identifier.status === "ACTIVE" ? "success" : "neutral"}>{identifier.status}</StatusBadge></td>{canUpdate || canDelete ? <td className="px-3 py-2"><div className="flex justify-end gap-1">{canUpdate ? <FormModal compact size="md" trigger="Edit" title={`Edit ${identifier.value}`}><EditIdentifierForm identifier={{ id: identifier.id, value: identifier.value, type: identifier.type, percentageRate: identifier.percentageRate.toString() }} /></FormModal> : null}{canUpdate ? <ActionButton action={setIdentifierStatusAction} fields={{ identifierId: identifier.id, status: identifier.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" }} label={identifier.status === "ACTIVE" ? "Deactivate" : "Activate"} /> : null}{canDelete ? <ActionButton action={deleteIdentifierAction} fields={{ identifierId: identifier.id }} label="Remove" danger confirmMessage={`Remove ID ${identifier.value}?`} /> : null}</div></td> : null}</tr>)}</tbody></table></div>
        {!identifiers.length ? <p className="px-3 py-8 text-center text-xs text-[#647386]">{term ? "No IDs match this search." : canCreate ? "No IDs yet. Use “Add ID” above to create the first one." : "No IDs yet."}</p> : null}
      </section>
    </>
  );
}
