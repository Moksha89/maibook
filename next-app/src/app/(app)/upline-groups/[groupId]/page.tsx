import { isUuid } from "@/lib/validation/common";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ActionButton } from "@/components/ui/action-button";
import { EntryScopeTabs } from "@/components/ui/entry-scope-tabs";
import { FormModal } from "@/components/ui/form-modal";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { hasPermission, requireGroupAccess, requirePermission } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import { payableShare } from "@/lib/domain/finance";
import { balanceTone, dayStamp, whole } from "@/lib/format";
import { pageRows } from "@/lib/paging";
import { groupBalanceDue, groupEntryShare, groupRunningBalances } from "@/lib/services/upline-group-entries";
import { assignSiteGroupAction } from "../../sites/actions";
import { AssignSiteToGroupBody, SiteFormBody } from "../../sites/site-forms";
import { deleteUplineGroupEntryAction, restoreUplineGroupEntryAction } from "../actions";
import { GroupEntryBar } from "./group-entry-bar";

function Stat({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return <div className="rounded-lg border bg-white px-3 py-2"><p className="text-[10px] font-bold uppercase tracking-wide text-[#647386]">{label}</p><p className={`mt-0.5 truncate font-mono text-sm font-semibold ${className}`}>{value}</p></div>;
}

export default async function UplineGroupPage({ params, searchParams }: { params: Promise<{ groupId: string }>; searchParams: Promise<{ tab?: string; deleted?: string; page?: string }> }) {
  const query = await searchParams;
  const tab = query.tab === "entries" ? "entries" : "sites";
  const showDeleted = query.deleted === "1";
  await requirePermission("uplines.read");
  const { groupId } = await params;
  if (!isUuid(groupId)) notFound();
  const group = await db.uplineGroup.findUnique({ where: { id: groupId }, include: { members: { include: { upline: { select: { name: true } } } }, sites: { orderBy: { name: "asc" } } } });
  if (!group) notFound();
  await requireGroupAccess(group.companyId);
  const [canCreate, canEdit, unassigned, settlements, payments] = await Promise.all([
    hasPermission("uplines.create"), hasPermission("uplines.update"),
    db.site.findMany({ where: { uplineGroupId: null }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.settlement.findMany({ where: { status: "POSTED", identifier: { site: { uplineGroupId: groupId } } }, include: { identifier: { select: { value: true, site: { select: { name: true } } } }, company: { select: { name: true } }, agent: { select: { name: true } } }, orderBy: [{ settlementDate: "desc" }, { createdAt: "desc" }] }),
    db.uplineGroupEntry.findMany({ where: { groupId }, orderBy: [{ createdAt: "desc" }] }),
  ]);
  const activePayments = payments.filter((entry) => !entry.deletedAt);
  const deletedPayments = payments.filter((entry) => entry.deletedAt);
  const settlementRows = settlements.map((row) => {
    const amount = Number(row.amount.toString());
    const share = Number(payableShare(row.amount, row.uplineShare).toString());
    return { id: row.id, kind: "settlement" as const, date: row.settlementDate, createdAt: row.createdAt, idValue: row.identifier.value, site: row.identifier.site?.name ?? "-", company: row.company.name, agent: row.agent.name, remarks: "", amount, share, direction: "" as string, rate: row.uplinePercentage.toFixed(2) };
  });
  const paymentRows = activePayments.map((entry) => {
    const amount = Number(entry.amount.toString());
    return { id: entry.id, kind: "payment" as const, date: entry.createdAt, createdAt: entry.createdAt, idValue: entry.direction, site: "-", company: "-", agent: "-", remarks: entry.remarks || "", amount, share: groupEntryShare(entry.direction, amount), direction: entry.direction, rate: "-" };
  });
  const ledger = groupRunningBalances([...settlementRows, ...paymentRows].sort((a, b) => a.date.getTime() - b.date.getTime() || a.createdAt.getTime() - b.createdAt.getTime())).reverse();
  const deletedRows = deletedPayments.map((entry) => {
    const amount = Number(entry.amount.toString());
    return { id: entry.id, kind: "payment" as const, date: entry.createdAt, createdAt: entry.createdAt, idValue: entry.direction, site: "-", company: "-", agent: "-", remarks: entry.remarks || "", amount, share: groupEntryShare(entry.direction, amount), direction: entry.direction, rate: "-", balance: 0 };
  });
  const visible = showDeleted ? deletedRows : ledger;
  const paged = pageRows(visible, query.page);
  const earned = settlementRows.reduce((sum, row) => sum + row.share, 0);
  const balance = groupBalanceDue(settlementRows.map((row) => row.share), activePayments.map((entry) => ({ direction: entry.direction, amount: Number(entry.amount.toString()) })));
  const tabClass = (active: boolean) => `rounded-full border px-3 py-1.5 text-xs font-semibold ${active ? "border-[#e0b44a] bg-[#fff4d7] text-[#71500d]" : "bg-white text-[#3b4d63]"}`;
  const totalPct = group.sites.reduce((sum, site) => sum + Number(site.uplinePercentage), 0);
  const avgPct = group.sites.length ? totalPct / group.sites.length : 0;
  return <>
    <PageHeader title={group.name} actions={<div className="flex flex-wrap items-center gap-2">
      <Link href="/upline-groups" className="rounded-full border bg-white px-3 py-1.5 text-xs font-semibold">Back</Link>
      {canEdit ? <FormModal size="sm" trigger="Assign site" title={`Assign sites to ${group.name}`}><AssignSiteToGroupBody groupId={group.id} sites={unassigned} /></FormModal> : null}
      {canCreate ? <FormModal size="sm" trigger="Create site" title="Create site"><SiteFormBody groupId={group.id} /></FormModal> : null}
    </div>} />
    <div className="mb-3 grid grid-cols-2 gap-2 md:grid-cols-4">
      <Stat label="Sites" value={String(group.sites.length)} />
      <Stat label="Average upline %" value={`${avgPct.toFixed(2)}%`} />
      <Stat label="Upline earned" value={whole(earned)} />
      <Stat label="Balance" value={whole(balance)} className={balanceTone(balance)} />
    </div>
    <div className="mb-2 flex gap-2"><Link prefetch={false} href={`/upline-groups/${group.id}`} className={tabClass(tab === "sites")}>Sites ({group.sites.length})</Link><Link prefetch={false} href={`/upline-groups/${group.id}?tab=entries`} className={tabClass(tab === "entries")}>Entries ({ledger.length})</Link></div>
    {tab === "entries" ? <>
      <EntryScopeTabs pathname={`/upline-groups/${group.id}`} params={{ tab: "entries" }} deleted={showDeleted} />
      <section className="overflow-hidden rounded-lg border bg-white">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2">
          <h2 className="min-w-0 truncate whitespace-nowrap text-sm font-bold">{showDeleted ? "Deleted entries" : "Entries"}</h2>
          <span className="shrink-0 rounded-full border border-[#d5dbe6] bg-[#f7f8fa] px-3 py-1 text-xs text-[#647386]">Closing balance <b className={`ml-1 font-mono text-sm ${balanceTone(balance)}`}>{whole(balance)}</b></span>
        </div>
        <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-xs">
          <thead className="bg-[#ffeebb] text-[#152235]"><tr><th className="px-3 py-2">Date</th><th className="px-3 py-2">ID</th><th className="px-3 py-2">Site</th><th className="px-3 py-2">Company</th><th className="px-3 py-2">Agent</th><th className="px-3 py-2">Remarks</th><th className="px-3 py-2 text-right">Amount</th><th className="px-3 py-2 text-right">Upline %</th><th className="px-3 py-2 text-right">Share</th><th className="px-3 py-2 text-right">Balance</th>{canEdit ? <th className="px-3 py-2 text-right">Actions</th> : null}</tr></thead>
          <tbody>{paged.rows.map((row) => <tr key={`${row.kind}-${row.id}`} className={`cursor-default border-t border-white hover:brightness-95 ${showDeleted ? "bg-[#ff5722] text-black" : Number(row.share) < 0 ? "bg-[#f8d7da]" : "bg-[#fff3cd]"}`}>
            <td className="whitespace-nowrap px-3 py-2">{dayStamp(row.date, row.createdAt)}</td>
            <td className="px-3 py-2 font-semibold">{row.idValue}</td>
            <td className="px-3 py-2">{row.site}</td>
            <td className="px-3 py-2">{row.company}</td>
            <td className="px-3 py-2">{row.agent}</td>
            <td className="px-3 py-2">{row.remarks || "-"}</td>
            <td className="px-3 py-2 text-right font-mono">{whole(row.amount)}</td>
            <td className="px-3 py-2 text-right font-mono">{row.rate}</td>
            <td className="px-3 py-2 text-right font-mono font-semibold">{whole(row.share)}</td>
            <td className={`px-3 py-2 text-right font-mono font-semibold ${showDeleted ? "" : balanceTone(row.balance)}`}>{showDeleted ? "-" : whole(row.balance)}</td>
            {canEdit ? <td className="px-3 py-2"><div className="flex justify-end gap-1">{row.kind === "payment" ? showDeleted ? <ActionButton action={restoreUplineGroupEntryAction} fields={{ entryId: row.id }} label="Restore" confirmMessage="Restore this entry?" /> : <ActionButton action={deleteUplineGroupEntryAction} fields={{ entryId: row.id }} label="Delete" danger confirmMessage="Delete this entry? It can be restored later." /> : null}</div></td> : null}
          </tr>)}</tbody>
        </table></div>
        {!visible.length ? <p className="px-3 py-8 text-center text-xs text-[#647386]">{showDeleted ? "Nothing deleted." : "No entries yet."}</p> : null}
        <Pagination pathname={`/upline-groups/${group.id}`} params={{ tab: "entries", deleted: showDeleted ? "1" : undefined }} page={paged.current} pages={paged.pages} total={paged.total} />
      </section>
      {canEdit && !showDeleted ? <GroupEntryBar groupId={group.id} /> : null}
    </> : null}
    {tab === "sites" ? <section className="overflow-hidden rounded-lg border bg-white"><div className="overflow-x-auto"><table className="w-full min-w-[420px] text-left text-xs">
      <thead className="bg-[#fff4d7] text-[#59400f]"><tr><th className="px-3 py-2">Site</th><th className="px-3 py-2">Upline %</th>{canEdit ? <th className="px-3 py-2 text-right">Actions</th> : null}</tr></thead>
      <tbody>{group.sites.map((site) => <tr key={site.id} className="border-t"><td className="px-3 py-2 font-semibold"><Link prefetch={false} href={`/sites/${site.id}`} className="text-[#8a6012] hover:underline">{site.name}</Link></td><td className="px-3 py-2">{site.uplinePercentage.toFixed(2)}%</td>{canEdit ? <td className="px-3 py-2"><div className="flex justify-end gap-1">
        <FormModal compact size="sm" trigger="Edit" title={`Edit ${site.name}`}><SiteFormBody site={{ id: site.id, name: site.name, uplinePercentage: site.uplinePercentage.toString() }} /></FormModal>
        <ActionButton action={assignSiteGroupAction} fields={{ siteId: site.id, uplineGroupId: "" }} label="Unassign" danger confirmMessage={`Unassign ${site.name} from ${group.name}?`} />
      </div></td> : null}</tr>)}</tbody>
    </table></div>{!group.sites.length ? <p className="px-3 py-8 text-center text-xs text-[#647386]">No sites yet.</p> : null}</section> : null}
  </>;
}
