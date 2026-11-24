import Link from "next/link";
import { notFound } from "next/navigation";

import { ActionButton } from "@/components/ui/action-button";
import { FormModal } from "@/components/ui/form-modal";
import { PageHeader } from "@/components/ui/page-header";
import { hasPermission, requireCompanyAccess, requirePermission } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import { dayStamp, whole } from "@/lib/format";
import { assignSiteGroupAction } from "../../sites/actions";
import { AssignSiteToGroupBody, SiteFormBody } from "../../sites/site-forms";

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border bg-white px-3 py-2"><p className="text-[10px] font-bold uppercase tracking-wide text-[#647386]">{label}</p><p className="mt-0.5 truncate font-mono text-sm font-semibold">{value}</p></div>;
}

export default async function UplineGroupPage({ params, searchParams }: { params: Promise<{ groupId: string }>; searchParams: Promise<{ tab?: string }> }) {
  const tab = (await searchParams).tab === "entries" ? "entries" : "sites";
  await requirePermission("uplines.read");
  const { groupId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(groupId)) notFound();
  const group = await db.uplineGroup.findUnique({ where: { id: groupId }, include: { company: { select: { name: true } }, members: { include: { upline: { select: { name: true } } } }, sites: { orderBy: { name: "asc" } } } });
  if (!group) notFound();
  await requireCompanyAccess(group.companyId);
  const [canCreate, canEdit, unassigned] = await Promise.all([
    hasPermission("uplines.create"), hasPermission("uplines.update"),
    db.site.findMany({ where: { uplineGroupId: null }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  const entries = await db.settlement.findMany({ where: { status: "POSTED", identifier: { site: { uplineGroupId: groupId } } }, include: { identifier: { select: { value: true, site: { select: { name: true } } } }, company: { select: { name: true } }, agent: { select: { name: true } } }, orderBy: [{ settlementDate: "desc" }, { createdAt: "desc" }], take: 500 });
  const signed = (amount: { isNegative(): boolean }, value: unknown) => (amount.isNegative() ? -1 : 1) * Math.abs(Number(value));
  const earned = entries.reduce((sum, row) => sum + signed(row.amount, row.uplineShare), 0);
  const tabClass = (active: boolean) => `rounded-full border px-3 py-1.5 text-xs font-semibold ${active ? "border-[#e0b44a] bg-[#fff4d7] text-[#71500d]" : "bg-white text-[#3b4d63]"}`;
  const totalPct = group.sites.reduce((sum, site) => sum + Number(site.uplinePercentage), 0);
  const avgPct = group.sites.length ? totalPct / group.sites.length : 0;
  return <>
    <PageHeader title={group.name} actions={<div className="flex flex-wrap items-center gap-2">
      <Link href="/upline-groups" className="rounded-full border bg-white px-3 py-1.5 text-xs font-semibold">Back</Link>
      {canEdit ? <FormModal size="sm" trigger="Assign site" title={`Assign site to ${group.name}`}><AssignSiteToGroupBody groupId={group.id} sites={unassigned} /></FormModal> : null}
      {canCreate ? <FormModal size="sm" trigger="Create site" title="Create site"><SiteFormBody groupId={group.id} /></FormModal> : null}
    </div>} />
    <div className="mb-3 grid grid-cols-2 gap-2 md:grid-cols-4">
      <Stat label="Sites" value={String(group.sites.length)} />
      <Stat label="Average upline %" value={`${avgPct.toFixed(2)}%`} />
      <Stat label="Upline earned" value={whole(earned)} />
      <Stat label="Company" value={group.company.name} />
    </div>
    <div className="mb-2 flex gap-2"><Link prefetch={false} href={`/upline-groups/${group.id}`} className={tabClass(tab === "sites")}>Sites ({group.sites.length})</Link><Link prefetch={false} href={`/upline-groups/${group.id}?tab=entries`} className={tabClass(tab === "entries")}>Entries ({entries.length})</Link></div>
    {tab === "entries" ? <section className="overflow-hidden rounded-lg border bg-white"><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-xs">
      <thead className="bg-[#ffeebb] text-[#152235]"><tr><th className="px-3 py-2">Date</th><th className="px-3 py-2">ID</th><th className="px-3 py-2">Site</th><th className="px-3 py-2">Company</th><th className="px-3 py-2">Agent</th><th className="px-3 py-2 text-right">Amount</th><th className="px-3 py-2 text-right">Upline %</th><th className="px-3 py-2 text-right">Upline share</th></tr></thead>
      <tbody>{entries.map((row) => <tr key={row.id} className={`cursor-default border-t border-white hover:brightness-95 ${Number(row.amount) < 0 ? "bg-[#f8d7da]" : "bg-[#fff3cd]"}`}><td className="whitespace-nowrap px-3 py-2">{dayStamp(row.settlementDate, row.createdAt)}</td><td className="whitespace-nowrap px-3 py-2 font-semibold">{row.identifier.value}</td><td className="px-3 py-2">{row.identifier.site?.name ?? "-"}</td><td className="px-3 py-2">{row.company.name}</td><td className="px-3 py-2">{row.agent.name}</td><td className="px-3 py-2 text-right font-mono">{whole(row.amount)}</td><td className="px-3 py-2 text-right font-mono">{row.uplinePercentage.toFixed(2)}%</td><td className="px-3 py-2 text-right font-mono font-semibold">{whole(signed(row.amount, row.uplineShare))}</td></tr>)}</tbody>
    </table></div>{!entries.length ? <p className="px-3 py-8 text-center text-xs text-[#647386]">No settlements yet.</p> : null}</section> : null}
    {tab === "sites" ? <section className="overflow-hidden rounded-lg border bg-white"><div className="overflow-x-auto"><table className="w-full min-w-[420px] text-left text-xs">
      <thead className="bg-[#fff4d7] text-[#59400f]"><tr><th className="px-3 py-2">Site</th><th className="px-3 py-2">Upline %</th>{canEdit ? <th className="px-3 py-2 text-right">Actions</th> : null}</tr></thead>
      <tbody>{group.sites.map((site) => <tr key={site.id} className="border-t"><td className="px-3 py-2 font-semibold"><Link prefetch={false} href={`/sites/${site.id}`} className="text-[#8a6012] hover:underline">{site.name}</Link></td><td className="px-3 py-2">{site.uplinePercentage.toFixed(2)}%</td>{canEdit ? <td className="px-3 py-2"><div className="flex justify-end gap-1">
        <FormModal compact size="sm" trigger="Edit" title={`Edit ${site.name}`}><SiteFormBody site={{ id: site.id, name: site.name, uplinePercentage: site.uplinePercentage.toString() }} /></FormModal>
        <ActionButton action={assignSiteGroupAction} fields={{ siteId: site.id, uplineGroupId: "" }} label="Unassign" danger confirmMessage={`Unassign ${site.name} from ${group.name}?`} />
      </div></td> : null}</tr>)}</tbody>
    </table></div>{!group.sites.length ? <p className="px-3 py-8 text-center text-xs text-[#647386]">No sites yet.</p> : null}</section> : null}
  </>;
}
