import type { Metadata } from "next";
import Link from "next/link";
import { FilterForm } from "@/components/ui/filter-form";
import { Pagination } from "@/components/ui/pagination";
import { EntryScopeTabs } from "@/components/ui/entry-scope-tabs";

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
import { DeletedRecords } from "@/components/ui/deleted-records";
import { pageRows } from "@/lib/paging";
import { companyOptionsFor, siteOptionsFor } from "@/lib/services/site-options";
import { whole, balanceTone, stamp } from "@/lib/format";
import { formatAgentSplits } from "@/lib/services/identifier-agent-assignment";

export const metadata: Metadata = { title: "IDs" };

export default async function IdentifiersPage({ searchParams }: { searchParams: Promise<{ q?: string; deleted?: string; page?: string }> }) {
  await requirePermission("identifiers.read");
  const { q = "", deleted, page } = await searchParams;
  const showDeleted = deleted === "1";
  const term = q.trim();
  const session = await requireSession();
  const superAdmin = session.user.roles.some(({ role }) => role.key === "superadmin");
  const accessFilter = superAdmin ? {} : { userAccess: { some: { userId: session.userId } } };
  const [canCreate, canUpdate, canDelete, companies, identifiers, allAgentNames] = await Promise.all([
    hasPermission("identifiers.create"),
    hasPermission("identifiers.update"),
    hasPermission("identifiers.delete"),
    db.company.findMany({ where: { deletedAt: null, status: "ACTIVE", ...accessFilter }, include: { agents: { where: { removedAt: null }, include: { agent: { select: { id: true, name: true } } }, orderBy: { agent: { name: "asc" } } } }, orderBy: { name: "asc" } }),
    db.agentIdentifier.findMany({ where: { deletedAt: null, AND: [...(superAdmin ? [] : [{ OR: [{ company: accessFilter }, { companyId: null }] }]), ...(term ? [{ OR: [{ value: { contains: term, mode: "insensitive" as const } }, { agent: { name: { contains: term, mode: "insensitive" as const } } }, { agentAssignments: { some: { effectiveTo: null, agent: { name: { contains: term, mode: "insensitive" as const } } } } }, { company: { name: { contains: term, mode: "insensitive" as const } } }] }] : [])] }, include: { company: { select: { name: true } }, site: { select: { name: true } }, agent: { select: { name: true } }, agentAssignments: { where: { effectiveTo: null }, include: { agent: { select: { id: true, name: true } } }, orderBy: [{ splitPercentage: "desc" }, { effectiveFrom: "asc" }] }, _count: { select: { settlements: { where: { status: "POSTED" } } } } }, orderBy: [{ company: { name: "asc" } }, { value: "asc" }] }),
    db.agent.findMany({ where: { deletedAt: null }, select: { name: true }, orderBy: { name: "asc" }, take: 1000 }),
  ]);
  const options = companies.map((company) => ({ id: company.id, name: company.name, agents: company.agents.map(({ agent }) => agent) }));
  const siteOptions = await siteOptionsFor(companies);
  const companyOptions = companyOptionsFor(companies);
  const deletedIds = showDeleted ? await db.agentIdentifier.findMany({ where: { deletedAt: { not: null }, ...(superAdmin ? {} : { OR: [{ company: accessFilter }, { companyId: null }] }), ...(term ? { value: { contains: term, mode: "insensitive" as const } } : {}) }, select: { id: true, value: true, deletedAt: true, deletedById: true, company: { select: { name: true } }, agent: { select: { name: true } }, agentAssignments: { where: { effectiveTo: null }, include: { agent: { select: { id: true, name: true } } }, orderBy: [{ splitPercentage: "desc" }, { effectiveFrom: "asc" }] } }, orderBy: { deletedAt: "desc" } }) : [];
  const pagedIds = pageRows(identifiers, page);
  const pagedDeleted = pageRows(deletedIds, page);
  return (

    <>
      <PageHeader title="IDs" actions={canCreate ? <AddModal trigger="Add ID" title="Create ID" size="md" ready={siteOptions.length > 0} setup={<SetupNotice title="Create a site first" />}><IdentifierForm sites={siteOptions} companies={companyOptions} /></AddModal> : null} />
      <EntryScopeTabs pathname="/identifiers" params={{ q }} deleted={showDeleted} />
      {showDeleted ? <section className="overflow-hidden rounded-lg border bg-white"><div className="flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2"><h2 className="text-sm font-bold">Deleted IDs</h2><FilterForm className="flex items-center gap-1.5"><input type="hidden" name="deleted" value="1" /><ExpandingSearch defaultValue={q} label="Search IDs, agents or companies" /></FilterForm></div><DeletedRecords title="Deleted IDs" rows={pagedDeleted.rows.map((id) => ({ id: id.id, name: id.value, detail: [id.company?.name, formatAgentSplits(id.agentAssignments.map((row) => ({ name: row.agent.name, splitPercentage: Number(row.splitPercentage) })))].filter((part) => part && part !== "-").join(" · "), deletedAt: id.deletedAt, deletedById: id.deletedById }))} /><Pagination pathname="/identifiers" params={{ q, deleted: "1" }} page={pagedDeleted.current} pages={pagedDeleted.pages} total={pagedDeleted.total} /></section> : (
      <section className="overflow-hidden rounded-lg border bg-white">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2"><h2 className="text-sm font-bold">ID directory</h2><FilterForm className="flex items-center gap-1.5"><ExpandingSearch defaultValue={q} label="Search IDs, agents or companies" /></FilterForm></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-xs"><thead className="bg-[#fff4d7] text-[#59400f]"><tr><th className="px-3 py-2">ID</th><th className="px-3 py-2">Created</th><th className="px-3 py-2">Type</th><th className="px-3 py-2">Site</th><th className="px-3 py-2">Company</th><th className="px-3 py-2">Agent</th><th className="px-3 py-2 text-right">Rate</th><th className="px-3 py-2 text-right">Settlements</th><th className="px-3 py-2">Status</th>{canUpdate || canDelete ? <th className="px-3 py-2 text-right">Actions</th> : null}</tr></thead><tbody>{pagedIds.rows.map((identifier) => <tr key={identifier.id} className="border-t hover:bg-[#fafbfc]"><td className="px-3 py-2 font-mono font-semibold"><Link prefetch={false} href={`/identifiers/${identifier.id}`} className="text-[#8a6012] hover:underline">{identifier.value}</Link></td><td className="whitespace-nowrap px-3 py-2 text-[#647386]">{stamp(identifier.createdAt)}</td><td className="px-3 py-2">{identifier.type === "SUB_AGENT" ? "Sub Agent" : "Agent"}</td><td className="px-3 py-2">{identifier.site?.name ?? "-"}</td><td className="px-3 py-2">{identifier.company?.name ?? "-"}</td><td className="px-3 py-2">{formatAgentSplits(identifier.agentAssignments.map((row) => ({ name: row.agent.name, splitPercentage: Number(row.splitPercentage) })))}</td><td className="px-3 py-2 text-right font-mono">{identifier.percentageRate.toFixed(2)}%</td><td className="px-3 py-2 text-right font-mono">{identifier._count.settlements}</td><td className="px-3 py-2"><StatusBadge tone={identifier.status === "ACTIVE" ? "success" : "neutral"}>{identifier.status}</StatusBadge></td>{canUpdate || canDelete ? <td className="px-3 py-2"><div className="flex justify-end gap-1">{canUpdate ? <FormModal compact size="md" trigger="Edit" title={`Edit ${identifier.value}`}><EditIdentifierForm identifier={{ id: identifier.id, value: identifier.value, type: identifier.type, percentageRate: identifier.percentageRate.toString(), companyId: identifier.companyId, agents: identifier.agentAssignments.map((row) => ({ id: row.agentId, splitPercentage: Number(row.splitPercentage) })) }} companies={companyOptions} /></FormModal> : null}{canUpdate ? <ActionButton action={setIdentifierStatusAction} fields={{ identifierId: identifier.id, status: identifier.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" }} label={identifier.status === "ACTIVE" ? "Deactivate" : "Activate"} /> : null}{canDelete ? <ActionButton action={deleteIdentifierAction} fields={{ identifierId: identifier.id }} label="Remove" danger confirmMessage={`Remove ID ${identifier.value}?`} /> : null}</div></td> : null}</tr>)}</tbody></table></div>
        {!identifiers.length ? <p className="px-3 py-8 text-center text-xs text-[#647386]">{term ? "No IDs match this search." : "No IDs yet."}</p> : null}
        <Pagination pathname="/identifiers" params={{ q }} page={pagedIds.current} pages={pagedIds.pages} total={pagedIds.total} />
      </section>
      )}
    </>
  );
}
