import { FileImage, FileSpreadsheet, FileText } from "lucide-react";
import { randomUUID } from "node:crypto";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { LinkButton } from "@/components/ui/button";
import { ActionButton } from "@/components/ui/action-button";
import { FormModal } from "@/components/ui/form-modal";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { hasPermission, requireCompanyAccess, requirePermission } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { signedSettlementTotals } from "@/lib/services/settlement-summary";
import { AgentForm } from "../../agents/agent-form";
import { EditCompanyForm } from "../edit-company-form";
import { unassignShareholderAction, deleteUplineAction, setUplineStatusAction } from "./actions";
import { EditShareholderForm, EditUplineForm, ManualUplineEntryForm, AssignShareholderForm, UplineForm } from "./workspace-forms";
import { Tabs } from "@/components/ui/tabs";
import { QuickEntryBar } from "../../ledger/quick-entry-bar";
import { EntryRow } from "../../ledger/entry-row";
import { whole, balanceTone, dayStamp } from "@/lib/format";

export const metadata: Metadata = { title: "Company workspace" };

const tabs = [
  ["entries", "Entries"],
  ["settings", "Settings"],
  ["shareholders", "Shareholders"],
] as const;

export default async function CompanyWorkspacePage({ params, searchParams }: { params: Promise<{ companyId: string }>; searchParams: Promise<{ tab?: string; agent?: string }> }) {
  await requirePermission("companies.read");
  const { companyId } = await params;
  await requireCompanyAccess(companyId, "READ");
  const query = await searchParams;
  const tab = tabs.some(([key]) => key === query.tab) ? query.tab! : "entries";
  const [company, canManageUplines, canManageShareholders, canEditCompany, canEditUplines, canDeleteUplines, canEditShareholders, canDeleteShareholders, canCreateAgents, agentNames, uplineEntries] = await Promise.all([
    db.company.findFirst({ where: { id: companyId, deletedAt: null }, include: { agents: { where: { removedAt: null }, include: { agent: true }, orderBy: { agent: { name: "asc" } } }, uplines: { where: { deletedAt: null }, orderBy: { name: "asc" }, include: { entries: { orderBy: [{ entryDate: "desc" }, { createdAt: "desc" }], take: 30 } } }, uplineGroups: { include: { members: { include: { upline: { select: { name: true } } } } }, orderBy: { name: "asc" } }, shareholders: { where: { deletedAt: null }, orderBy: { name: "asc" }, include: { entries: { orderBy: [{ entryDate: "desc" }, { createdAt: "desc" }], take: 20 } } } } }),
    hasPermission("uplines.create"),
    hasPermission("shareholders.create"),
    hasPermission("companies.update"),
    hasPermission("uplines.update"),
    hasPermission("uplines.delete"),
    hasPermission("shareholders.update"),
    hasPermission("shareholders.delete"),
    hasPermission("agents.create"),
    db.agent.findMany({ where: { deletedAt: null }, select: { name: true }, orderBy: { name: "asc" }, take: 1000 }),
    db.uplineEntry.findMany({ where: { companyId, deletedAt: null }, include: { upline: { select: { name: true } } }, orderBy: [{ entryDate: "desc" }, { createdAt: "desc" }], take: 100 }),
  ]);
  if (!company) notFound();
  const selectedAgent = query.agent ?? company.agents[0]?.agent.id;
  const selectedAgentName = selectedAgent ? company.agents.find(({ agent }) => agent.id === selectedAgent)?.agent.name ?? "" : "";
  const [balanceSum, settlementSum, shareholderSum] = await Promise.all([
    db.companyAgent.aggregate({ where: { companyId, removedAt: null }, _sum: { currentBalance: true } }),
    signedSettlementTotals({ companyId }),
    db.shareholder.aggregate({ where: { companyId, deletedAt: null }, _sum: { currentBalance: true } }),
  ]);
  const closingBalance = Number((selectedAgent ? company.agents.find(({ agent }) => agent.id === selectedAgent)?.currentBalance : balanceSum._sum.currentBalance) ?? 0);
  const money = (value: unknown) => Number(value ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0, signDisplay: "negative" });
  const summary: [string, string][] = [["Agents", String(company.agents.length)], ["Agent coin balance", money(balanceSum._sum.currentBalance)], ["Settlements posted", String(settlementSum.count)], ["Company profit (net)", money(settlementSum.companyShare)], ["Agent share (net)", money(settlementSum.agentShare)], ["Upline share (net)", money(settlementSum.uplineShare)], ["Shareholder balances", money(shareholderSum._sum.currentBalance)]];
  const entries = await db.ledgerEntryLine.findMany({ where: { companyId, ...(selectedAgent ? { agentId: selectedAgent } : {}), NOT: { entry: { sourceEntity: "Settlement", deletedAt: { not: null } } } }, include: { agent: { select: { name: true } }, entry: { select: { entryDate: true, createdAt: true, remarks: true, entryType: true, deletedAt: true, lines: { select: { id: true, agentId: true, agent: { select: { name: true } } }, orderBy: { sequence: "asc" } } } } }, orderBy: [{ entry: { entryDate: "desc" } }, { createdAt: "desc" }], take: 100 });
  const modifiedEntryIds = new Set((entries.length ? await db.auditLog.findMany({ where: { entityType: "LedgerEntry", action: { in: ["ledger.transfer.update", "ledger.manual.update"] }, entityId: { in: [...new Set(entries.map((line) => line.entryId))] } }, select: { entityId: true } }) : []).map((log) => log.entityId));
  const counterpartyOf = (line: (typeof entries)[number]) => [...new Set(line.entry.lines.filter((other) => other.id !== line.id && other.agentId !== line.agentId).map((other) => other.agent?.name || "Company"))].join(", ") || line.agent?.name || "Company";
  const canPostEntries = tab === "entries" && company.status === "ACTIVE" && (await hasPermission("ledger.create")) && (await requireCompanyAccess(companyId, "FULL").then(() => true, () => false));
  const remarkRows = canPostEntries ? await db.ledgerEntry.findMany({ where: { companyId, deletedAt: null, remarks: { not: null } }, select: { remarks: true }, orderBy: { createdAt: "desc" }, take: 1000 }) : [];
  const remarkOptions = [...new Set(remarkRows.map((row) => row.remarks?.trim()).filter((value): value is string => Boolean(value)))].slice(0, 300);
  const activePercentage = company.shareholders.filter((shareholder) => shareholder.status === "ACTIVE").reduce((sum, shareholder) => sum + Number(shareholder.percentage), 0);

  let shareholderOptions: string[] = [];
  if (tab === "shareholders" && canManageShareholders) {
    const session = await requireSession();
    const superAdmin = session.user.roles.some(({ role }) => role.key === "superadmin");
    const key = (name: string) => name.trim().replace(/\s+/g, " ").toUpperCase();
    const taken = new Set(company.shareholders.map((shareholder) => key(shareholder.name)));
    const rows = await db.shareholder.findMany({ where: { deletedAt: null, companyId: { not: companyId }, company: { deletedAt: null, ...(superAdmin ? {} : { userAccess: { some: { userId: session.userId } } }) } }, select: { name: true }, orderBy: { name: "asc" }, take: 500 });
    const partners = await db.owner.findMany({ where: superAdmin ? {} : { OR: [{ createdById: session.userId }, { companyLinks: { some: { company: { userAccess: { some: { userId: session.userId } } } } } }] }, select: { name: true }, orderBy: { name: "asc" }, take: 500 });
    shareholderOptions = [...new Set([...partners, ...rows].map((row) => key(row.name)))].filter((name) => !taken.has(name)).sort();
  }

  return (
    <>
      <PageHeader title={company.name} actions={<StatusBadge tone={company.status === "ACTIVE" ? "success" : "neutral"}>{company.status}</StatusBadge>} />
      <div className={tab === "entries" ? "grid gap-3 lg:grid-cols-[220px_minmax(0,1fr)]" : ""}>
        {tab === "entries" ? <aside className="rounded-lg border bg-white p-2"><div className="mb-2 flex items-center justify-between gap-2 px-2"><span className="text-[11px] font-bold uppercase tracking-wide text-[#647386]">Agents</span>{canCreateAgents ? <FormModal compact size="md" trigger="Add agent" title="Add agent to this company"><AgentForm companies={[{ id: company.id, name: company.name }]} fixedCompany={{ id: company.id, name: company.name }} agentNames={agentNames.map((item) => item.name)} /></FormModal> : null}</div><nav className="flex gap-1 overflow-x-auto [scrollbar-width:none] lg:block lg:space-y-1 [&::-webkit-scrollbar]:hidden">{company.agents.map(({ agent }) => <Link prefetch={false} key={agent.id} href={`/companies/${companyId}?tab=entries&agent=${agent.id}`} className={`flex shrink-0 items-center justify-between gap-2 whitespace-nowrap rounded-md px-2 py-1.5 text-xs lg:py-2 ${selectedAgent === agent.id ? "bg-[#fff4d7] text-[#71500d]" : "hover:bg-[#f4f6f8]"}`}><span className="truncate font-semibold">{agent.name}</span></Link>)}</nav></aside> : null}
        <main className="min-w-0">
          <Tabs label="Company sections" className="mb-3" active={tab} items={tabs.map(([key, label]) => ({ key, label, href: `/companies/${companyId}?tab=${key}` }))} />
          {tab === "entries" ? <section className="overflow-hidden rounded-lg border bg-white"><div className="flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2"><h2 className="min-w-0 truncate whitespace-nowrap text-sm font-bold">{selectedAgentName ? <>{selectedAgentName} <span className="hidden font-normal text-[#647386] sm:inline">entries</span></> : "Entries"}</h2><div className="flex shrink-0 items-center gap-1.5"><LinkButton href={`/api/companies/${companyId}/ledger/export?format=png${selectedAgent ? `&agent=${selectedAgent}` : ""}`} size="sm" variant="secondary" iconOnly className="!size-7 !bg-[#9c27b0] !text-white !ring-0 hover:!brightness-110 [&_svg]:!size-3.5" icon={FileImage} aria-label="Export PNG image" title="Export PNG image" /><LinkButton href={`/api/companies/${companyId}/ledger/export?format=pdf${selectedAgent ? `&agent=${selectedAgent}` : ""}`} size="sm" variant="secondary" iconOnly className="!size-7 !bg-[#f44336] !text-white !ring-0 hover:!brightness-110 [&_svg]:!size-3.5" icon={FileText} aria-label="Export PDF" title="Export PDF" /><LinkButton href={`/api/companies/${companyId}/ledger/export${selectedAgent ? `?agent=${selectedAgent}` : ""}`} size="sm" variant="secondary" iconOnly className="!size-7 !bg-[#4caf50] !text-white !ring-0 hover:!brightness-110 [&_svg]:!size-3.5" icon={FileSpreadsheet} aria-label="Export CSV (Excel)" title="Export CSV (Excel)" /><span className="shrink-0 rounded-full border border-[#d5dbe6] bg-[#f7f8fa] px-3 py-1 text-xs text-[#647386]">Closing balance <b className={`ml-1 font-mono text-sm ${balanceTone(closingBalance)}`}>{closingBalance.toLocaleString(undefined, { maximumFractionDigits: 0, signDisplay: "negative" })}</b></span></div></div><div className="overflow-x-auto"><table className="w-full min-w-[800px] text-left text-xs"><thead className="bg-[#ffeebb] text-[#152235]"><tr><th className="px-3 py-2">Date</th><th className="px-3 py-2">Name</th><th className="px-3 py-2">Remarks</th><th className="px-3 py-2 text-right" title="Units moved (coins)">Coins</th><th className="px-3 py-2 text-right" title="Rate per coin">Rate</th><th className="px-3 py-2 text-right" title="Money = coins × rate">Credit</th><th className="px-3 py-2 text-right" title="Money = coins × rate">Debit</th><th className="px-3 py-2 text-right" title="Closing balance in money (coins × rate) after this entry">Balance</th></tr></thead><tbody>{entries.map((line) => <EntryRow key={line.id} data={{ entryId: line.entryId, lineId: line.id, editable: line.entry.entryType === "TRANSACTION" && Boolean(selectedAgent), deleted: Boolean(line.entry.deletedAt), modified: modifiedEntryIds.has(line.entryId), counterparty: counterpartyOf(line), coins: line.coins.toString(), rate: line.rate.toString(), remarks: line.entry.remarks ?? "", entryDate: line.entry.entryDate.toISOString().slice(0, 10) }} className={line.entry.deletedAt ? "bg-[#ff5722] text-black" : modifiedEntryIds.has(line.entryId) ? "bg-[#1e3a8a] text-white" : Number(line.debit) > 0 ? "bg-[#f8d7da]" : "bg-[#fff3cd]"}><td className="whitespace-nowrap px-3 py-2">{dayStamp(line.entry.entryDate, line.entry.createdAt)}</td><td className="px-3 py-2">{selectedAgent ? counterpartyOf(line) : line.agent?.name || "Company"}</td><td className="px-3 py-2">{line.entry.remarks || "-"}{line.entry.deletedAt ? " (Deleted)" : ""}</td><td className="px-3 py-2 text-right font-mono">{whole(line.coins)}</td><td className="px-3 py-2 text-right font-mono">{line.rate.toFixed(2)}</td><td className="px-3 py-2 text-right font-mono">{whole(line.credit)}</td><td className="px-3 py-2 text-right font-mono">{whole(line.debit)}</td><td className={`px-3 py-2 text-right font-mono font-semibold ${line.entry.deletedAt ? "" : balanceTone(line.closingBalance)}`}>{line.entry.deletedAt ? "-" : whole(line.closingBalance)}</td></EntryRow>)}</tbody></table></div>{!entries.length ? <p className="px-3 py-8 text-center text-xs text-[#647386]">No ledger entries match this view.</p> : null}</section> : null}
          {canPostEntries ? <QuickEntryBar key={selectedAgent ?? "all"} companies={[{ id: company.id, name: company.name, defaultRate: company.defaultRate?.toString() ?? null, agents: company.agents.map(({ agent, currentBalance }) => ({ id: agent.id, name: agent.name, balance: currentBalance.toString() })) }]} remarkOptions={remarkOptions} initialIdempotencyKey={randomUUID()} fixedCompanyId={company.id} fixedAgentId={selectedAgent && company.agents.some(({ agent }) => agent.id === selectedAgent) ? selectedAgent : undefined} /> : null}
          {tab === "settings" ? <section className="rounded-lg border bg-white p-3"><h2 className="text-sm font-bold">Company Settings</h2><div className="mt-3"><EditCompanyForm canEdit={canEditCompany} company={{ id: company.id, name: company.name, code: company.code, notes: company.notes, createdAt: `${company.createdAt.getFullYear()}-${String(company.createdAt.getMonth() + 1).padStart(2, "0")}-${String(company.createdAt.getDate()).padStart(2, "0")}` }} /></div></section> : null}
          {tab === "shareholders" ? <div className="space-y-3">{canManageShareholders ? <div className="flex items-center justify-end gap-2"><AssignShareholderForm companyId={companyId} options={shareholderOptions} /></div> : null}<section className="overflow-hidden rounded-lg border bg-white"><div className="flex flex-wrap items-center justify-between gap-1 border-b px-3 py-2"><h2 className="text-sm font-bold">Shareholders</h2><span className="text-xs font-semibold">Company profit {money(settlementSum.companyShare)} · Active total {activePercentage.toFixed(2)}%</span></div><table className="w-full text-left text-xs"><thead className="bg-[#fff4d7] text-[#59400f]"><tr><th className="px-3 py-2">Name</th><th className="px-3 py-2 text-right">Share</th><th className="px-3 py-2 text-right">Profit share</th>{canEditShareholders || canDeleteShareholders ? <th className="px-3 py-2 text-right">Actions</th> : null}</tr></thead><tbody>{company.shareholders.map((shareholder) => <tr key={shareholder.id} className="border-t"><td className="px-3 py-2 font-semibold">{shareholder.name}</td><td className="px-3 py-2 text-right font-mono">{shareholder.percentage.toFixed(2)}%</td><td className="px-3 py-2 text-right font-mono">{money(Math.round(settlementSum.companyShare * Number(shareholder.percentage) / 100))}</td>{canEditShareholders || canDeleteShareholders ? <td className="px-3 py-2"><div className="flex justify-end gap-1">{canEditShareholders ? <FormModal compact size="md" trigger="Edit" title={`Edit ${shareholder.name}`}><EditShareholderForm shareholder={{ id: shareholder.id, name: shareholder.name, percentage: shareholder.percentage.toString(), phone: shareholder.phone, email: shareholder.email }} /></FormModal> : null}{canDeleteShareholders ? <ActionButton action={unassignShareholderAction} fields={{ shareholderId: shareholder.id }} label="Unassign" danger confirmMessage={`Unassign ${shareholder.name} from this company?`} /> : null}</div></td> : null}</tr>)}</tbody></table></section></div> : null}
        </main>
      </div>
    </>
  );
}
