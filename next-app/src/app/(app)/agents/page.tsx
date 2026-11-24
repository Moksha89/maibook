import type { Metadata } from "next";
import { FilterForm } from "@/components/ui/filter-form";
import Link from "next/link";

import { FormModal } from "@/components/ui/form-modal";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { ActionButton } from "@/components/ui/action-button";
import { hasPermission, requirePermission } from "@/lib/auth/permissions";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { deleteAgentAction, setAgentStatusAction } from "./actions";
import { AgentForm } from "./agent-form";
import { EditAgentForm } from "./edit-agent-form";
import { AddModal, SetupNotice } from "@/components/ui/setup-modal";
import { CompanyForm } from "../companies/company-form";
import { ExpandingSearch } from "@/components/ui/expanding-search";
import { DeletedRecords, DeletedToggle } from "@/components/ui/deleted-records";
import { whole, balanceTone, stamp } from "@/lib/format";

export const metadata: Metadata = { title: "Agents" };

export default async function AgentsPage({ searchParams }: { searchParams: Promise<{ q?: string; deleted?: string }> }) {
  await requirePermission("agents.read");
  const session = await requireSession();
  const { q = "", deleted } = await searchParams;
  const showDeleted = deleted === "1";
  const superAdmin = session.user.roles.some(({ role }) => role.key === "superadmin");
  const accessFilter = superAdmin ? {} : { userAccess: { some: { userId: session.userId } } };
  const [canCreate, canUpdate, canDelete, companies, agents, allAgentNames] = await Promise.all([
    hasPermission("agents.create"),
    hasPermission("agents.update"),
    hasPermission("agents.delete"),
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
    db.agent.findMany({ where: { deletedAt: null }, select: { name: true }, orderBy: { name: "asc" }, take: 1000 }),
  ]);
  const deletedAgents = showDeleted ? await db.agent.findMany({ where: { deletedAt: { not: null }, ...(superAdmin ? {} : { companies: { some: { company: accessFilter } } }), ...(q.trim() ? { name: { contains: q.trim(), mode: "insensitive" as const } } : {}) }, select: { id: true, name: true, phone: true, email: true, deletedAt: true, deletedById: true }, orderBy: { deletedAt: "desc" }, take: 200 }) : [];

  return (
    <>
      <PageHeader title="Agents" actions={canCreate ? <AddModal trigger="Add agent" title="Create agent" size="md" ready={companies.length > 0} setup={<SetupNotice title="Create a company first" form={<CompanyForm />}>Every agent belongs to a company. Add your first company below — this window then switches to the agent form.</SetupNotice>}><AgentForm companies={companies} agentNames={allAgentNames.map((item) => item.name)} /></AddModal> : null} />
      <section className="mt-3 overflow-hidden rounded-lg border bg-white">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2"><h2 className="text-sm font-bold">Agent directory</h2><FilterForm className="flex items-center gap-1.5"><ExpandingSearch defaultValue={q} label="Search agents" /><DeletedToggle active={showDeleted} q={q} /></FilterForm></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[920px] text-left text-xs"><thead className="bg-[#fff4d7] text-[#59400f]"><tr><th className="px-3 py-2">Agent</th><th className="hidden px-3 py-2 sm:table-cell">Created</th><th className="hidden px-3 py-2 sm:table-cell">Contact</th><th className="px-3 py-2">Companies</th><th className="px-3 py-2 text-right">Opening</th><th className="px-3 py-2 text-right" title="Opening balance plus ledger coins and settlement shares posted to this agent">Current balance</th><th className="px-3 py-2 text-right">IDs</th><th className="px-3 py-2">Status</th>{canUpdate || canDelete ? <th className="px-3 py-2 text-right">Actions</th> : null}</tr></thead><tbody>{agents.flatMap((agent) => agent.companies.map((assignment, index) => <tr key={`${agent.id}-${assignment.companyId}`} className="border-t hover:bg-[#fafbfc]"><td className="whitespace-nowrap px-3 py-2 font-semibold"><Link prefetch={false} href={`/agents/${agent.id}`} className={index === 0 ? "text-[#8a6012] hover:underline" : "font-normal text-[#a98b55] hover:underline"}>{agent.name}</Link></td><td className="hidden whitespace-nowrap px-3 py-2 text-[#647386] sm:table-cell">{index === 0 ? stamp(agent.createdAt) : ""}</td><td className="hidden px-3 py-2 text-[#647386] sm:table-cell">{index === 0 ? agent.phone || agent.email || "-" : ""}</td><td className="px-3 py-2">{assignment.company.name}</td><td className="px-3 py-2 text-right font-mono">{whole(assignment.openingBalance)}</td><td className={`px-3 py-2 text-right font-mono font-semibold ${balanceTone(assignment.currentBalance)}`}>{whole(assignment.currentBalance)}</td><td className="px-3 py-2 text-right font-mono">{index === 0 ? agent._count.identifiers : ""}</td><td className="px-3 py-2">{index === 0 ? <StatusBadge tone={agent.status === "ACTIVE" ? "success" : "neutral"}>{agent.status}</StatusBadge> : null}</td>{canUpdate || canDelete ? <td className="px-3 py-2">{index === 0 ? <div className="flex justify-end gap-1">{canUpdate ? <FormModal compact trigger="Edit" title={`Edit ${agent.name}`}><EditAgentForm canAssign={canUpdate} assignableCompanies={companies.filter((company) => !agent.companies.some((link) => link.companyId === company.id))} agent={{ id: agent.id, name: agent.name, phone: agent.phone, email: agent.email, assignments: agent.companies.map((link) => ({ companyId: link.companyId, companyName: link.company.name, balance: whole(link.currentBalance) })) }} /></FormModal> : null}{canUpdate ? <ActionButton action={setAgentStatusAction} fields={{ agentId: agent.id, status: agent.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" }} label={agent.status === "ACTIVE" ? "Deactivate" : "Activate"} /> : null}{canDelete ? <ActionButton action={deleteAgentAction} fields={{ agentId: agent.id }} label="Remove" danger confirmMessage={`Remove ${agent.name}?`} /> : null}</div> : null}</td> : null}</tr>))}</tbody></table></div>
        {!agents.length ? <p className="px-3 py-8 text-center text-xs text-[#647386]">{q.trim() ? "No agents match this search." : "No agents yet."}</p> : null}
      </section>
      {showDeleted ? <DeletedRecords title="Deleted agents" rows={deletedAgents.map((agent) => ({ id: agent.id, name: agent.name, detail: agent.phone || agent.email, deletedAt: agent.deletedAt, deletedById: agent.deletedById }))} /> : null}
    </>
  );
}
