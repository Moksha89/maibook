import { randomUUID } from "node:crypto";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { hasPermission, requireCompanyAccess, requirePermission } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import { ManualUplineEntryForm, ProfitDistributionForm, ShareholderForm, UplineForm } from "./workspace-forms";

export const metadata: Metadata = { title: "Company workspace" };

const tabs = [
  ["entries", "Entries"],
  ["settings", "Company Settings"],
  ["upline", "Upline"],
  ["shareholders", "Shareholders"],
] as const;

export default async function CompanyWorkspacePage({ params, searchParams }: { params: Promise<{ companyId: string }>; searchParams: Promise<{ tab?: string; agent?: string }> }) {
  await requirePermission("companies.read");
  const { companyId } = await params;
  await requireCompanyAccess(companyId, "READ");
  const query = await searchParams;
  const tab = tabs.some(([key]) => key === query.tab) ? query.tab! : "entries";
  const [company, canManageUplines, canManageShareholders] = await Promise.all([
    db.company.findFirst({ where: { id: companyId, deletedAt: null }, include: { agents: { where: { removedAt: null }, include: { agent: true }, orderBy: { agent: { name: "asc" } } }, uplines: { where: { deletedAt: null }, orderBy: { name: "asc" }, include: { entries: { orderBy: [{ entryDate: "desc" }, { createdAt: "desc" }], take: 30 } } }, uplineGroups: { include: { members: { include: { upline: { select: { name: true } } } } }, orderBy: { name: "asc" } }, shareholders: { where: { deletedAt: null }, orderBy: { name: "asc" }, include: { entries: { orderBy: [{ entryDate: "desc" }, { createdAt: "desc" }], take: 20 } } } } }),
    hasPermission("uplines.create"),
    hasPermission("shareholders.create"),
  ]);
  if (!company) notFound();
  const selectedAgent = query.agent;
  const entries = await db.ledgerEntryLine.findMany({ where: { companyId, entry: { deletedAt: null }, ...(selectedAgent ? { agentId: selectedAgent } : {}) }, include: { agent: { select: { name: true } }, entry: { select: { entryDate: true, remarks: true, entryType: true } } }, orderBy: [{ entry: { entryDate: "desc" } }, { createdAt: "desc" }], take: 100 });
  const activePercentage = company.shareholders.filter((shareholder) => shareholder.status === "ACTIVE").reduce((sum, shareholder) => sum + Number(shareholder.percentage), 0);

  return (
    <>
      <PageHeader title={company.name} description={`Company workspace · ${company.code || company.slug}`} actions={<StatusBadge tone={company.status === "ACTIVE" ? "success" : "neutral"}>{company.status}</StatusBadge>} />
      <div className="grid gap-3 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="rounded-lg border bg-white p-2"><div className="mb-2 px-2 text-[11px] font-bold uppercase tracking-wide text-[#647386]">Agents</div><nav className="space-y-1"><Link href={`/companies/${companyId}?tab=entries`} className={`block rounded-md px-2 py-2 text-xs font-semibold ${!query.agent ? "bg-[#fff4d7] text-[#71500d]" : "hover:bg-[#f4f6f8]"}`}>All entries</Link>{company.agents.map(({ agent, currentBalance }) => <Link key={agent.id} href={`/companies/${companyId}?tab=entries&agent=${agent.id}`} className={`flex items-center justify-between gap-2 rounded-md px-2 py-2 text-xs ${selectedAgent === agent.id && query.agent ? "bg-[#fff4d7] text-[#71500d]" : "hover:bg-[#f4f6f8]"}`}><span className="truncate font-semibold">{agent.name}</span><span className="font-mono text-[10px]">{currentBalance.toFixed(0)}</span></Link>)}</nav></aside>
        <main className="min-w-0">
          <nav className="mb-3 flex gap-1 overflow-x-auto rounded-lg border bg-white p-1">{tabs.map(([key, label]) => <Link key={key} href={`/companies/${companyId}?tab=${key}`} className={`whitespace-nowrap rounded-md px-3 py-2 text-xs font-semibold ${tab === key ? "bg-[#10233f] text-white" : "text-[#41536a] hover:bg-[#f4f6f8]"}`}>{label}</Link>)}</nav>
          {tab === "entries" ? <section className="overflow-hidden rounded-lg border bg-white"><div className="border-b px-3 py-2"><h2 className="text-sm font-bold">Ledger entries</h2></div><div className="overflow-x-auto"><table className="w-full min-w-[800px] text-left text-xs"><thead className="bg-[#fff4d7] text-[#59400f]"><tr><th className="px-3 py-2">Date</th><th className="px-3 py-2">Agent</th><th className="px-3 py-2">Type</th><th className="px-3 py-2 text-right">Coins</th><th className="px-3 py-2 text-right">Credit</th><th className="px-3 py-2 text-right">Debit</th><th className="px-3 py-2 text-right">Balance</th><th className="px-3 py-2">Remarks</th></tr></thead><tbody>{entries.map((line) => <tr key={line.id} className="border-t"><td className="px-3 py-2">{line.entry.entryDate.toLocaleDateString()}</td><td className="px-3 py-2">{line.agent?.name || "Company"}</td><td className="px-3 py-2">{line.entry.entryType.replaceAll("_", " ")}</td><td className="px-3 py-2 text-right font-mono">{line.coins.toFixed(2)}</td><td className="px-3 py-2 text-right font-mono">{line.credit.toFixed(2)}</td><td className="px-3 py-2 text-right font-mono">{line.debit.toFixed(2)}</td><td className="px-3 py-2 text-right font-mono font-semibold">{line.closingBalance.toFixed(2)}</td><td className="px-3 py-2">{line.entry.remarks || "—"}</td></tr>)}</tbody></table></div>{!entries.length ? <p className="px-3 py-8 text-center text-xs text-[#647386]">No ledger entries match this view.</p> : null}</section> : null}
          {tab === "settings" ? <section className="rounded-lg border bg-white p-3"><h2 className="text-sm font-bold">Company Settings</h2><dl className="mt-3 grid gap-3 text-xs sm:grid-cols-2"><div><dt className="text-[#647386]">Code</dt><dd className="font-semibold">{company.code || "Not set"}</dd></div><div><dt className="text-[#647386]">Short URL</dt><dd><Link className="font-mono text-[#8b620d] underline" href={`/c/${company.slug}`}>/c/{company.slug}</Link></dd></div><div className="sm:col-span-2"><dt className="text-[#647386]">Notes</dt><dd className="whitespace-pre-wrap">{company.notes || "No notes"}</dd></div><div><dt className="text-[#647386]">Created</dt><dd>{company.createdAt.toLocaleDateString()}</dd></div></dl></section> : null}
          {tab === "upline" ? <div className="space-y-3">{canManageUplines ? <UplineForm companyId={companyId} /> : null}{canManageUplines && company.uplines.length ? <ManualUplineEntryForm companyId={companyId} uplines={company.uplines.map(({ id, name }) => ({ id, name }))} /> : null}<section className="overflow-hidden rounded-lg border bg-white"><div className="border-b px-3 py-2"><h2 className="text-sm font-bold">Uplines</h2></div><table className="w-full text-left text-xs"><thead className="bg-[#fff4d7] text-[#59400f]"><tr><th className="px-3 py-2">Name</th><th className="px-3 py-2 text-right">Rate</th><th className="px-3 py-2 text-right">Balance</th><th className="px-3 py-2">Status</th></tr></thead><tbody>{company.uplines.map((upline) => <tr key={upline.id} className="border-t"><td className="px-3 py-2 font-semibold">{upline.name}</td><td className="px-3 py-2 text-right font-mono">{upline.percentageRate.toFixed(2)}%</td><td className="px-3 py-2 text-right font-mono">{upline.currentBalance.toFixed(2)}</td><td className="px-3 py-2"><StatusBadge tone={upline.status === "ACTIVE" ? "success" : "neutral"}>{upline.status}</StatusBadge></td></tr>)}</tbody></table></section></div> : null}
          {tab === "shareholders" ? <div className="space-y-3">{canManageShareholders ? <ShareholderForm companyId={companyId} /> : null}{canManageShareholders && company.shareholders.length ? <ProfitDistributionForm companyId={companyId} initialIdempotencyKey={randomUUID()} /> : null}<section className="overflow-hidden rounded-lg border bg-white"><div className="flex items-center justify-between border-b px-3 py-2"><h2 className="text-sm font-bold">Shareholders</h2><span className="text-xs font-semibold">Active total {activePercentage.toFixed(2)}%</span></div><table className="w-full text-left text-xs"><thead className="bg-[#fff4d7] text-[#59400f]"><tr><th className="px-3 py-2">Name</th><th className="px-3 py-2 text-right">Share</th><th className="px-3 py-2 text-right">Balance</th><th className="px-3 py-2">Status</th></tr></thead><tbody>{company.shareholders.map((shareholder) => <tr key={shareholder.id} className="border-t"><td className="px-3 py-2 font-semibold">{shareholder.name}</td><td className="px-3 py-2 text-right font-mono">{shareholder.percentage.toFixed(2)}%</td><td className="px-3 py-2 text-right font-mono">{shareholder.currentBalance.toFixed(2)}</td><td className="px-3 py-2"><StatusBadge tone={shareholder.status === "ACTIVE" ? "success" : "neutral"}>{shareholder.status}</StatusBadge></td></tr>)}</tbody></table></section></div> : null}
        </main>
      </div>
    </>
  );
}
