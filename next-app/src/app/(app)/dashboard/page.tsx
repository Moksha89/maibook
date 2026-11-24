import type { Metadata } from "next";
import { FilterForm } from "@/components/ui/filter-form";
import Link from "next/link";
import { Building2, ChartNoAxesCombined, Coins, FileBarChart, IdCard, Users, UserRoundCheck, WalletCards } from "lucide-react";

import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { hasPermission, requirePermission } from "@/lib/auth/permissions";
import { getBackupHealth } from "@/lib/services/backups";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { ExpandingSearch } from "@/components/ui/expanding-search";
import { LinkButton } from "@/components/ui/button";
import { whole, balanceTone, stamp } from "@/lib/format";

export const metadata: Metadata = { title: "Dashboard" };

const PAGE_SIZE = 10;
const money = (value: unknown) => Number(value ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0, signDisplay: "negative" });
const quickActions = [["/ledger", "Ledger", "ledger.read"], ["/settlements", "Settlements", "settlements.read"], ["/reports", "Generate report", "reports.read"], ["/companies", "Companies", "companies.read"], ["/agents", "Agents", "agents.read"]] as const;

const quickIcons: Record<string, typeof Users> = { "/ledger": WalletCards, "/settlements": ChartNoAxesCombined, "/reports": FileBarChart, "/companies": Building2, "/agents": Users };

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  await requirePermission("dashboard.read");
  const session = await requireSession();
  const { q = "", page: pageParam } = await searchParams;
  const page = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1);
  const superAdmin = session.user.roles.some(({ role }) => role.key === "superadmin");
  const companyWhere = { deletedAt: null, ...(superAdmin ? {} : { userAccess: { some: { userId: session.userId } } }), ...(q.trim() ? { name: { contains: q.trim(), mode: "insensitive" as const } } : {}) };
  const backupHealth = (await hasPermission("backups.read")) ? await getBackupHealth() : null;
  const [canReadUsers, canReadWhatsApp, canReadUsersActions] = await Promise.all([hasPermission("users.read"), hasPermission("whatsapp.read"), Promise.all(quickActions.map(([, , permission]) => hasPermission(permission)))]);
  const [userCount, whatsapp, balanceTotal, companyTotal, companyPage] = await Promise.all([
    canReadUsers ? db.user.count({ where: { deletedAt: null, status: "ACTIVE" } }) : Promise.resolve(null),
    canReadWhatsApp ? db.whatsAppConnection.findFirst({ select: { status: true } }) : Promise.resolve(null),
    db.companyAgent.aggregate({ where: { removedAt: null, company: companyWhere }, _sum: { currentBalance: true } }),
    db.company.count({ where: companyWhere }),
    db.company.findMany({ where: companyWhere, select: { id: true, name: true, currency: true, status: true, _count: { select: { agents: true, ledgerEntries: { where: { deletedAt: null } } } } }, orderBy: { name: "asc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
  ]);
  const pageBalances = await db.companyAgent.groupBy({ by: ["companyId"], where: { removedAt: null, companyId: { in: companyPage.map((company) => company.id) } }, _sum: { currentBalance: true } });
  const balanceByCompany = new Map(pageBalances.map((row) => [row.companyId, row._sum.currentBalance]));
  const pages = Math.max(1, Math.ceil(companyTotal / PAGE_SIZE));
  const [companyCount, agentCount, identifierCount, settlementSummary, recentAudit] = await Promise.all([
    db.company.count({ where: { deletedAt: null, status: "ACTIVE" } }),
    db.agent.count({ where: { deletedAt: null, status: "ACTIVE" } }),
    db.agentIdentifier.count({ where: { deletedAt: null, status: "ACTIVE" } }),
    db.settlement.aggregate({ where: { status: "POSTED" }, _count: true, _sum: { absoluteAmount: true } }),
    db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 8, include: { actor: { select: { displayName: true } }, company: { select: { name: true } } } }),
  ]);
  const stats = [
    { label: "Active companies", value: companyCount.toLocaleString("en-IN"), icon: Building2 },
    { label: "Active agents", value: agentCount.toLocaleString("en-IN"), icon: Users },
    { label: "Active IDs", value: identifierCount.toLocaleString("en-IN"), icon: IdCard },
    { label: "Net agent coin balance", value: money(balanceTotal._sum.currentBalance), icon: Coins },
    ...(userCount !== null ? [{ label: "Active users", value: userCount.toLocaleString("en-IN"), icon: UserRoundCheck }] : []),
    { label: "Posted settlements", value: settlementSummary._count.toLocaleString("en-IN"), icon: ChartNoAxesCombined },
    { label: "Settlement value", value: Number(whole(settlementSummary._sum.absoluteAmount ?? 0)).toLocaleString("en-IN"), icon: WalletCards },
  ];

  return (
    <>
      <PageHeader title="Dashboard" />
      {backupHealth && (backupHealth.stale || backupHealth.failedSince) ? <Link prefetch={false} href="/database" className="mb-3 block truncate rounded-lg border border-[#f0c36d] bg-[#fff4d7] px-3 py-1.5 text-[11px] font-semibold text-[#72500c] sm:text-xs" title="Open Database to review.">{backupHealth.failedSince ? "Latest database backup failed." : "No backup in the last 26 hours."} Open Database.</Link> : null}
      {whatsapp && whatsapp.status !== "CONNECTED" ? <Link prefetch={false} href="/whatsapp" className="mb-3 block truncate rounded-lg border border-[#f0c36d] bg-[#fff4d7] px-3 py-1.5 text-[11px] font-semibold text-[#72500c] sm:text-xs">WhatsApp is not connected ({whatsapp.status.replaceAll("_", " ").toLowerCase()}). Open WhatsApp to reconnect.</Link> : null}
      <nav aria-label="Quick actions" className="mb-3 flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{quickActions.filter((_, index) => canReadUsersActions[index]).map(([href, label]) => <LinkButton key={href} href={href} variant="secondary" icon={quickIcons[href]} className="shrink-0 whitespace-nowrap">{label}</LinkButton>)}</nav>
      <section className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-7">
        {stats.map(({ label, value, icon: Icon }) => <article key={label} className="min-w-0 rounded-lg border bg-white px-3 py-2 shadow-[0_1px_2px_rgba(8,17,31,0.04)]"><div className="flex items-center justify-between gap-1"><p className="truncate text-[11px] font-semibold text-[#647386]">{label}</p><Icon className="size-3.5 shrink-0 text-[#a97819]" /></div><p className="mt-0.5 truncate font-mono text-lg font-semibold text-[#0d1a2c]">{value}</p></article>)}
      </section>
      <section className="mt-4 overflow-hidden rounded-lg border bg-white">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2.5"><h2 className="text-sm font-bold text-[#0d1a2c]">Company balances</h2><FilterForm className="flex items-center gap-1.5"><ExpandingSearch defaultValue={q} label="Search companies" /></FilterForm></div>
        {companyPage.length ? <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-left text-xs"><thead className="bg-[#fff4d7] text-[#59400f]"><tr><th className="px-3 py-2 font-semibold">Company</th><th className="px-3 py-2 text-right font-semibold">Agents</th><th className="px-3 py-2 text-right font-semibold" title="Active ledger entries only; deleted entries are not counted">Active entries</th><th className="px-3 py-2 text-right font-semibold">Agent coin balance</th></tr></thead><tbody>{companyPage.map((company) => { const balance = Number(balanceByCompany.get(company.id) ?? 0); return <tr key={company.id} className="border-t"><td className="px-3 py-2 font-semibold"><Link prefetch={false} href={`/companies/${company.id}`} className="text-[#8a6012] hover:underline">{company.name}</Link></td><td className="px-3 py-2 text-right font-mono">{company._count.agents}</td><td className="px-3 py-2 text-right font-mono">{company._count.ledgerEntries}</td><td className={`px-3 py-2 text-right font-mono font-semibold ${balanceTone(balance)}`}>{money(balance)}</td></tr>; })}</tbody></table></div> : <p className="px-3 py-6 text-center text-xs text-[#647386]">No companies match this view.</p>}
        {pages > 1 ? <div className="flex items-center justify-between border-t px-3 py-2 text-xs text-[#647386]"><span>Page {page} of {pages}</span><span className="flex gap-2">{page > 1 ? <Link prefetch={false} className="rounded-md border px-3 py-1 font-semibold text-[#10233f]" href={`/dashboard?q=${encodeURIComponent(q)}&page=${page - 1}`}>Previous</Link> : null}{page < pages ? <Link prefetch={false} className="rounded-md border px-3 py-1 font-semibold text-[#10233f]" href={`/dashboard?q=${encodeURIComponent(q)}&page=${page + 1}`}>Next</Link> : null}</span></div> : null}
      </section>
      <section className="mt-4 overflow-hidden rounded-lg border bg-white">
        <div className="flex items-center justify-between border-b px-3 py-2.5"><h2 className="text-sm font-bold text-[#0d1a2c]">Recent activity</h2><StatusBadge tone="success">Audit enabled</StatusBadge></div>
        {recentAudit.length ? <div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-xs"><thead className="bg-[#fff4d7] text-[#59400f]"><tr><th className="px-3 py-2 font-semibold">Action</th><th className="px-3 py-2 font-semibold">User</th><th className="px-3 py-2 font-semibold">Company</th><th className="px-3 py-2 font-semibold">When</th></tr></thead><tbody>{recentAudit.map((entry) => <tr key={entry.id} className="border-t"><td className="px-3 py-2 font-mono text-[11px]">{entry.action}</td><td className="px-3 py-2">{entry.actor?.displayName ?? "System"}</td><td className="px-3 py-2">{entry.company?.name ?? "Global"}</td><td className="whitespace-nowrap px-3 py-2 text-[#647386]">{stamp(entry.createdAt)}</td></tr>)}</tbody></table></div> : <p className="px-3 py-7 text-center text-xs text-[#647386]">No activity yet.</p>}
      </section>
    </>
  );
}
