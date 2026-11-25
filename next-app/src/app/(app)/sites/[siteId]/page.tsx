import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

import { LinkButton } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tabs } from "@/components/ui/tabs";
import { requirePermission } from "@/lib/auth/permissions";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { signedSettlementShare as signedShare } from "@/lib/domain/finance";
import { balanceTone, dayStamp, stamp, whole } from "@/lib/format";

export const metadata: Metadata = { title: "Site" };

const UUID = /^[0-9a-f-]{36}$/i;
const TABS = ["ids", "entries", "transactions"] as const;
type Tab = (typeof TABS)[number];

function Stat({ label, value }: { label: string; value: ReactNode }) {
  return <div className="rounded-lg border bg-white px-3 py-2"><p className="text-[10px] font-bold uppercase tracking-wide text-[#647386]">{label}</p><p className="mt-0.5 truncate text-sm font-semibold">{value}</p></div>;
}

export default async function SitePage({ params, searchParams }: { params: Promise<{ siteId: string }>; searchParams: Promise<{ tab?: string }> }) {
  await requirePermission("uplines.read");
  const { siteId } = await params;
  if (!UUID.test(siteId)) notFound();
  const requested = (await searchParams).tab;
  const tab: Tab = TABS.includes(requested as Tab) ? requested as Tab : "ids";
  const session = await requireSession();
  const superAdmin = session.user.roles.some(({ role }) => role.key === "superadmin");
  const accessFilter = superAdmin ? {} : { userAccess: { some: { userId: session.userId } } };
  const site = await db.site.findFirst({
    where: { id: siteId, ...(superAdmin ? {} : { OR: [{ uplineGroupId: null }, { uplineGroup: { company: accessFilter } }] }) },
    include: { uplineGroup: { select: { id: true, name: true, company: { select: { name: true } } } } },
  });
  if (!site) notFound();
  const identifiers = await db.agentIdentifier.findMany({
    where: { siteId, deletedAt: null, ...(superAdmin ? {} : { OR: [{ company: accessFilter }, { companyId: null }] }) },
    include: { company: { select: { name: true } }, agent: { select: { name: true } } },
    orderBy: { value: "asc" },
  });
  const identifierIds = identifiers.map((identifier) => identifier.id);
  const settlements = identifierIds.length ? await db.settlement.findMany({
    where: { identifierId: { in: identifierIds } },
    include: { identifier: { select: { id: true, value: true } }, company: { select: { name: true } }, agent: { select: { name: true } } },
    orderBy: [{ settlementDate: "desc" }, { createdAt: "desc" }],
    take: 500,
  }) : [];
  const settlementIds = settlements.map((settlement) => settlement.id);
  const ledgerEntries = settlementIds.length ? await db.ledgerEntry.findMany({
    where: { sourceEntity: "Settlement", sourceId: { in: settlementIds } },
    include: { company: { select: { name: true } }, lines: { include: { agent: { select: { name: true } }, upline: { select: { name: true } } }, orderBy: { sequence: "asc" } } },
    orderBy: [{ entryDate: "desc" }, { createdAt: "desc" }],
    take: 500,
  }) : [];
  const settlementById = new Map(settlements.map((settlement) => [settlement.id, settlement]));
  const lines = ledgerEntries.flatMap((entry) => entry.lines.map((line) => ({ entry, line, settlement: entry.sourceId ? settlementById.get(entry.sourceId) : undefined })));
  const items = [
    { key: "ids", label: `IDs (${identifiers.length})`, href: `/sites/${siteId}` },
    { key: "entries", label: `Entries (${lines.length})`, href: `/sites/${siteId}?tab=entries` },
    { key: "transactions", label: `Transactions (${settlements.length})`, href: `/sites/${siteId}?tab=transactions` },
  ];

  return (
    <>
      <PageHeader title={site.name} actions={<LinkButton href="/sites" iconOnly icon={ArrowLeft} aria-label="Back to sites" title="Back to sites" className="!size-7 [&_svg]:!size-3.5" />} />
      <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Upline %" value={`${site.uplinePercentage.toFixed(2)}%`} />
        <Stat label="Upline group" value={site.uplineGroup ? <Link prefetch={false} href={`/upline-groups/${site.uplineGroup.id}`} className="text-[#8a6012] hover:underline">{site.uplineGroup.name}</Link> : "-"} />
        <Stat label="Created" value={stamp(site.createdAt)} />
        <Stat label="IDs" value={String(identifiers.length)} />
      </div>
      <Tabs label="Site sections" className="mb-3" active={tab} items={items} />

      {tab === "ids" ? (
        <section className="overflow-hidden rounded-lg border bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-xs">
              <thead className="bg-[#ffeebb] text-[#152235]"><tr><th className="px-3 py-2">ID</th><th className="px-3 py-2">Company</th><th className="px-3 py-2">Agent</th><th className="px-3 py-2">Type</th><th className="px-3 py-2">Status</th><th className="px-3 py-2 text-right">Balance</th></tr></thead>
              <tbody>{identifiers.map((identifier) => <tr key={identifier.id} className="border-t"><td className="whitespace-nowrap px-3 py-2 font-mono font-semibold"><Link prefetch={false} href={`/identifiers/${identifier.id}`} className="text-[#8a6012] hover:underline">{identifier.value}</Link></td><td className="px-3 py-2">{identifier.company?.name ?? "-"}</td><td className="px-3 py-2">{identifier.agent?.name ?? "-"}</td><td className="px-3 py-2">{identifier.type === "SUB_AGENT" ? "Sub Agent" : "Agent"}</td><td className="px-3 py-2"><StatusBadge tone={identifier.status === "ACTIVE" ? "success" : "neutral"}>{identifier.status}</StatusBadge></td><td className={`px-3 py-2 text-right font-mono font-semibold ${balanceTone(identifier.currentBalance)}`}>{whole(identifier.currentBalance)}</td></tr>)}</tbody>
            </table>
          </div>
          {!identifiers.length ? <p className="px-3 py-8 text-center text-xs text-[#647386]">No IDs yet.</p> : null}
        </section>
      ) : null}

      {tab === "entries" ? (
        <section className="overflow-hidden rounded-lg border bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-xs">
              <thead className="bg-[#ffeebb] text-[#152235]"><tr><th className="px-3 py-2">Date</th><th className="px-3 py-2">ID</th><th className="px-3 py-2">Company</th><th className="px-3 py-2">Name</th><th className="px-3 py-2">Remarks</th><th className="px-3 py-2 text-right">Coins</th><th className="px-3 py-2 text-right">Rate</th><th className="px-3 py-2 text-right">Credit</th><th className="px-3 py-2 text-right">Debit</th><th className="px-3 py-2 text-right">Balance</th></tr></thead>
              <tbody>{lines.map(({ entry, line, settlement }) => <tr key={line.id} className={`cursor-default border-t border-white ${entry.deletedAt ? "bg-[#ff5722] text-black" : Number(line.debit) > 0 ? "bg-[#f8d7da]" : "bg-[#fff3cd]"}`}><td className="whitespace-nowrap px-3 py-2">{dayStamp(entry.entryDate, entry.createdAt)}</td><td className="whitespace-nowrap px-3 py-2 font-mono font-semibold">{settlement ? <Link prefetch={false} href={`/identifiers/${settlement.identifier.id}`} className="text-[#8a6012] hover:underline">{settlement.identifier.value}</Link> : "-"}</td><td className="px-3 py-2">{entry.company.name}</td><td className="px-3 py-2">{line.agent?.name || line.upline?.name || "Company"}</td><td className="px-3 py-2">{entry.remarks || "-"}{entry.deletedAt ? " (Deleted)" : ""}</td><td className="px-3 py-2 text-right font-mono">{whole(line.coins)}</td><td className="px-3 py-2 text-right font-mono">{Number(line.rate).toFixed(2)}</td><td className="px-3 py-2 text-right font-mono">{whole(line.credit)}</td><td className="px-3 py-2 text-right font-mono">{whole(line.debit)}</td><td className={`px-3 py-2 text-right font-mono font-semibold ${entry.deletedAt ? "" : balanceTone(line.closingBalance)}`}>{entry.deletedAt ? "-" : whole(line.closingBalance)}</td></tr>)}</tbody>
            </table>
          </div>
          {!lines.length ? <p className="px-3 py-8 text-center text-xs text-[#647386]">No entries yet.</p> : null}
        </section>
      ) : null}

      {tab === "transactions" ? (
        <section className="overflow-hidden rounded-lg border bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-xs">
              <thead className="bg-[#ffeebb] text-[#152235]"><tr><th className="px-3 py-2">Date</th><th className="px-3 py-2">ID</th><th className="px-3 py-2">Company</th><th className="px-3 py-2">Agent</th><th className="px-3 py-2">Remarks</th><th className="px-3 py-2 text-right">Amount</th><th className="px-3 py-2 text-right">Agent share</th><th className="px-3 py-2 text-right">Upline share</th><th className="px-3 py-2 text-right">Company share</th><th className="px-3 py-2">Status</th></tr></thead>
              <tbody>{settlements.map((settlement) => <tr key={settlement.id} className={`cursor-default border-t border-white hover:brightness-95 ${settlement.status !== "POSTED" ? "bg-[#ff5722] text-black" : Number(settlement.amount) < 0 ? "bg-[#f8d7da]" : "bg-[#fff3cd]"}`}><td className="whitespace-nowrap px-3 py-2">{dayStamp(settlement.settlementDate, settlement.createdAt)}</td><td className="whitespace-nowrap px-3 py-2 font-mono font-semibold"><Link prefetch={false} href={`/identifiers/${settlement.identifier.id}`} className="text-[#8a6012] hover:underline">{settlement.identifier.value}</Link></td><td className="px-3 py-2">{settlement.company.name}</td><td className="px-3 py-2">{settlement.agent.name}</td><td className="px-3 py-2">{settlement.remarks || "-"}</td><td className="px-3 py-2 text-right font-mono font-semibold">{whole(settlement.amount)}</td><td className="px-3 py-2 text-right font-mono">{whole(signedShare(settlement.amount, settlement.agentShare))}</td><td className="px-3 py-2 text-right font-mono">{whole(signedShare(settlement.amount, settlement.uplineShare))}</td><td className="px-3 py-2 text-right font-mono">{whole(signedShare(settlement.amount, settlement.companyShare))}</td><td className="px-3 py-2"><StatusBadge tone={settlement.status === "POSTED" ? "success" : "danger"}>{settlement.status}</StatusBadge></td></tr>)}</tbody>
            </table>
          </div>
          {!settlements.length ? <p className="px-3 py-8 text-center text-xs text-[#647386]">No transactions yet.</p> : null}
        </section>
      ) : null}
    </>
  );
}