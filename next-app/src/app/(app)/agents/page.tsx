import type { Metadata } from "next";
import { FilterForm } from "@/components/ui/filter-form";
import Link from "next/link";

import { FormModal } from "@/components/ui/form-modal";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { StatusBadge } from "@/components/ui/status-badge";
import { ActionButton } from "@/components/ui/action-button";
import { EntryScopeTabs } from "@/components/ui/entry-scope-tabs";
import { ViewToggle } from "@/components/ui/view-toggle";
import { hasPermission, requirePermission } from "@/lib/auth/permissions";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { pageRows } from "@/lib/paging";
import { directoryView } from "@/lib/view-preference";
import { deleteAgentAction, setAgentStatusAction } from "./actions";
import { AgentForm } from "./agent-form";
import { EditAgentForm } from "./edit-agent-form";
import { AddModal, SetupNotice } from "@/components/ui/setup-modal";
import { CompanyForm } from "../companies/company-form";
import { ExpandingSearch } from "@/components/ui/expanding-search";
import { DeletedRecords } from "@/components/ui/deleted-records";
import { whole, balanceTone } from "@/lib/format";

export const metadata: Metadata = { title: "Agents" };

export default async function AgentsPage({ searchParams }: { searchParams: Promise<{ q?: string; deleted?: string; view?: string; page?: string }> }) {
  await requirePermission("agents.read");
  const session = await requireSession();
  const query = await searchParams;
  const { q = "", deleted } = query;
  const showDeleted = deleted === "1";
  const view = await directoryView("agents", query.view);
  const superAdmin = session.user.roles.some(({ role }) => role.key === "superadmin");
  const accessFilter = superAdmin ? {} : { userAccess: { some: { userId: session.userId } } };
  const [canCreate, canUpdate, canDelete, companies, allAgentNames] = await Promise.all([
    hasPermission("agents.create"),
    hasPermission("agents.update"),
    hasPermission("agents.delete"),
    db.company.findMany({ where: { deletedAt: null, status: "ACTIVE", ...accessFilter }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.agent.findMany({ where: { deletedAt: null }, select: { name: true }, orderBy: { name: "asc" }, take: 1000 }),
  ]);
  const agents = showDeleted ? [] : await db.agent.findMany({
    where: {
      deletedAt: null,
      ...(q.trim() ? { OR: [{ name: { contains: q.trim(), mode: "insensitive" } }, { phone: { contains: q.trim() } }] } : {}),
      companies: { some: { removedAt: null, company: accessFilter } },
    },
    include: { companies: { where: { removedAt: null, company: accessFilter }, include: { company: { select: { id: true, name: true, currency: true } } }, orderBy: { company: { name: "asc" } } }, _count: { select: { identifiers: true } } },
    orderBy: { name: "asc" },
  });
  const deletedAgents = showDeleted ? await db.agent.findMany({ where: { deletedAt: { not: null }, ...(superAdmin ? {} : { companies: { some: { company: accessFilter } } }), ...(q.trim() ? { name: { contains: q.trim(), mode: "insensitive" as const } } : {}) }, select: { id: true, name: true, phone: true, email: true, deletedAt: true, deletedById: true }, orderBy: { deletedAt: "desc" } }) : [];
  const paged = pageRows(agents, query.page);
  const pagedDeleted = pageRows(deletedAgents, query.page);
  const rowActions = (agent: (typeof agents)[number]) => canUpdate || canDelete ? <div className="flex justify-end gap-1">{canUpdate ? <FormModal compact trigger="Edit" title={`Edit ${agent.name}`}><EditAgentForm canAssign={canUpdate} assignableCompanies={companies.filter((company) => !agent.companies.some((link) => link.companyId === company.id))} agent={{ id: agent.id, name: agent.name, phone: agent.phone, email: agent.email, assignments: agent.companies.map((link) => ({ companyId: link.companyId, companyName: link.company.name, balance: whole(link.currentBalance) })) }} /></FormModal> : null}{canUpdate ? <ActionButton action={setAgentStatusAction} fields={{ agentId: agent.id, status: agent.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" }} label={agent.status === "ACTIVE" ? "Deactivate" : "Activate"} /> : null}{canDelete ? <ActionButton action={deleteAgentAction} fields={{ agentId: agent.id }} label="Remove" danger confirmMessage={`Remove ${agent.name}?`} /> : null}</div> : null;

  return (
    <>
      <PageHeader title="Agents" actions={<><ViewToggle section="agents" view={view} />{canCreate ? <AddModal trigger="Add agent" title="Create agent" size="md" ready={companies.length > 0} setup={<SetupNotice title="Create a company first" form={<CompanyForm />}>Every agent belongs to a company. Add your first company below — this window then switches to the agent form.</SetupNotice>}><AgentForm companies={companies} agentNames={allAgentNames.map((item) => item.name)} /></AddModal> : null}</>} />
      <EntryScopeTabs pathname="/agents" params={{ q, view }} deleted={showDeleted} allLabel="All entries" deletedLabel="Deleted entries" />
      {showDeleted ? (
        <section className="overflow-hidden rounded-lg border bg-white">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2"><h2 className="text-sm font-bold">Deleted agents</h2><FilterForm className="flex items-center gap-1.5"><input type="hidden" name="deleted" value="1" /><input type="hidden" name="view" value={view} /><ExpandingSearch defaultValue={q} label="Search agents" /></FilterForm></div>
          <DeletedRecords title="Deleted agents" rows={pagedDeleted.rows.map((agent) => ({ id: agent.id, name: agent.name, detail: agent.phone || agent.email, deletedAt: agent.deletedAt, deletedById: agent.deletedById }))} />
          <Pagination pathname="/agents" params={{ q, view, deleted: "1" }} page={pagedDeleted.current} pages={pagedDeleted.pages} total={pagedDeleted.total} />
        </section>
      ) : !agents.length ? <p className="rounded-lg border bg-white px-3 py-8 text-center text-xs text-[#647386]">{q.trim() ? "No agents match this search." : "No agents yet."}</p> : view === "grid" ? (
        <>
          <div className="mb-2 flex justify-end"><FilterForm className="flex items-center gap-1.5"><input type="hidden" name="view" value={view} /><ExpandingSearch defaultValue={q} label="Search agents" /></FilterForm></div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{paged.rows.map((agent) => <div key={agent.id} className="flex flex-col rounded-lg border bg-white p-3 text-xs"><div className="flex items-start justify-between gap-2"><Link prefetch={false} href={`/agents/${agent.id}`} className="truncate text-sm font-bold text-[#0d1a2c] hover:text-[#2196f3]">{agent.name}</Link><StatusBadge tone={agent.status === "ACTIVE" ? "success" : "neutral"}>{agent.status}</StatusBadge></div><p className="mt-1.5 text-[#3b4d63]">{agent.companies.map((link) => link.company.name).join(", ") || "-"}</p><p className="mt-1 font-mono text-[#647386]">{agent._count.identifiers} IDs</p><div className="mt-2 flex justify-end border-t pt-2">{rowActions(agent)}</div></div>)}</div>
          <div className="mt-2 overflow-hidden rounded-lg border bg-white"><Pagination pathname="/agents" params={{ q, view }} page={paged.current} pages={paged.pages} total={paged.total} /></div>
        </>
      ) : (
        <section className="overflow-hidden rounded-lg border bg-white">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2"><h2 className="text-sm font-bold">Agent directory</h2><FilterForm className="flex items-center gap-1.5"><input type="hidden" name="view" value="list" /><ExpandingSearch defaultValue={q} label="Search agents" /></FilterForm></div>
          <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-xs"><thead className="bg-[#fff4d7] text-[#59400f]"><tr><th className="px-3 py-2">Agent</th><th className="px-3 py-2">Companies</th><th className="px-3 py-2 text-right" title="Opening balance plus ledger coins and settlement shares posted to this agent">Current balance</th><th className="px-3 py-2 text-right">IDs</th><th className="px-3 py-2">Status</th>{canUpdate || canDelete ? <th className="px-3 py-2 text-right">Actions</th> : null}</tr></thead><tbody>{paged.rows.flatMap((agent) => agent.companies.map((assignment, index) => <tr key={`${agent.id}-${assignment.companyId}`} className="border-t hover:bg-[#fafbfc]"><td className="whitespace-nowrap px-3 py-2 font-semibold"><Link prefetch={false} href={`/agents/${agent.id}`} className={index === 0 ? "text-[#8a6012] hover:underline" : "font-normal text-[#a98b55] hover:underline"}>{agent.name}</Link></td><td className="px-3 py-2">{assignment.company.name}</td><td className={`px-3 py-2 text-right font-mono font-semibold ${balanceTone(assignment.currentBalance)}`}>{whole(assignment.currentBalance)}</td><td className="px-3 py-2 text-right font-mono">{index === 0 ? agent._count.identifiers : ""}</td><td className="px-3 py-2">{index === 0 ? <StatusBadge tone={agent.status === "ACTIVE" ? "success" : "neutral"}>{agent.status}</StatusBadge> : null}</td>{canUpdate || canDelete ? <td className="px-3 py-2">{index === 0 ? rowActions(agent) : null}</td> : null}</tr>))}</tbody></table></div>
          <Pagination pathname="/agents" params={{ q, view: "list" }} page={paged.current} pages={paged.pages} total={paged.total} />
        </section>
      )}
    </>
  );
}
