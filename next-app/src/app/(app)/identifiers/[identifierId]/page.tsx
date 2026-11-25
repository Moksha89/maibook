import { isUuid } from "@/lib/validation/common";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { LinkButton } from "@/components/ui/button";
import { hasPermission, requirePermission } from "@/lib/auth/permissions";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { payableShare, signedSettlementShare as signedShare } from "@/lib/domain/finance";
import { balanceTone, whole, dayStamp } from "@/lib/format";
import { IdentifierSettlementBar } from "./settlement-bar";
import { AssignAgentButton, UnassignAgentButton } from "./assign-agent-form";

export const metadata: Metadata = { title: "ID" };

export default async function IdentifierPage({ params }: { params: Promise<{ identifierId: string }> }) {
  await requirePermission("identifiers.read");
  const { identifierId } = await params;
  if (!isUuid(identifierId)) notFound();
  if (!/^[0-9a-f-]{36}$/i.test(identifierId)) notFound();
  const session = await requireSession();
  const superAdmin = session.user.roles.some(({ role }) => role.key === "superadmin");
  const identifier = await db.agentIdentifier.findFirst({
    where: { id: identifierId, deletedAt: null, ...(superAdmin ? {} : { OR: [{ company: { userAccess: { some: { userId: session.userId } } } }, { companyId: null }] }) },
    include: {
      company: { select: { id: true, name: true, uplines: { where: { deletedAt: null, status: "ACTIVE" }, orderBy: { name: "asc" }, select: { id: true, name: true, percentageRate: true } } } },
      site: { select: { name: true } },
      agent: { select: { name: true } },
      settlements: { where: { status: "POSTED" }, orderBy: [{ settlementDate: "desc" }, { createdAt: "desc" }], take: 500 },
    },
  });
  if (!identifier) notFound();
  const canCreate = await hasPermission("settlements.create");
  const canEdit = await hasPermission("identifiers.update");
  const companyAgents = identifier.companyId ? (await db.companyAgent.findMany({ where: { companyId: identifier.companyId, removedAt: null }, include: { agent: { select: { id: true, name: true } } }, orderBy: { agent: { name: "asc" } } })).map((row) => row.agent).filter((agent) => agent.id !== identifier.agentId) : [];
  const applied = identifier.type === "SUB_AGENT" ? 100 - Number(identifier.percentageRate) : Number(identifier.percentageRate);
  const info: [string, string][] = [["Company", identifier.company?.name ?? "-"], ["Agent", identifier.agent?.name ?? "-"], ["Site", identifier.site?.name ?? "-"], ["Type", identifier.type === "SUB_AGENT" ? "Sub Agent" : "Agent"], ["Agent %", `${applied.toFixed(2)}%`]];
  const canPost = canCreate && identifier.status === "ACTIVE" && identifier.company && identifier.agentId;

  return <>
    <PageHeader title={identifier.value} actions={<><LinkButton href="/identifiers" iconOnly icon={ArrowLeft} aria-label="Back to IDs" title="Back to IDs" className="!size-7 [&_svg]:!size-3.5" /><StatusBadge tone={identifier.status === "ACTIVE" ? "success" : "neutral"}>{identifier.status}</StatusBadge>{canEdit && identifier.companyId ? <span className="[&_button]:!size-7 [&_button_svg]:!size-3.5"><AssignAgentButton identifierId={identifier.id} identifierValue={identifier.value} agents={companyAgents} /></span> : null}{canEdit && identifier.agent ? <UnassignAgentButton identifierId={identifier.id} identifierValue={identifier.value} agentName={identifier.agent.name} /> : null}</>} />
    <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
      {info.map(([label, value]) => <div key={label} className="rounded-lg border bg-white px-3 py-2"><p className="text-[10px] font-bold uppercase tracking-wide text-[#647386]">{label}</p><p className="mt-0.5 truncate text-sm font-semibold">{value}</p></div>)}
      <div className="rounded-lg border bg-white px-3 py-2"><p className="text-[10px] font-bold uppercase tracking-wide text-[#647386]">Balance</p><p className={`mt-0.5 font-mono text-sm font-semibold ${balanceTone(identifier.currentBalance)}`}>{Number(whole(identifier.currentBalance)).toLocaleString()}</p></div>
    </div>
    <section className="overflow-hidden rounded-lg border bg-white">
      <div className="border-b px-3 py-2"><h2 className="text-sm font-bold">Settlements ({identifier.settlements.length})</h2></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[820px] text-left text-xs"><thead className="bg-[#ffeebb] text-[#152235]"><tr><th className="px-3 py-2">Date</th><th className="px-3 py-2">Remarks</th><th className="px-3 py-2 text-right">Amount</th><th className="px-3 py-2 text-right">Agent %</th><th className="px-3 py-2 text-right">Agent share</th><th className="px-3 py-2 text-right">Upline share</th><th className="px-3 py-2 text-right">Company share</th><th className="px-3 py-2">Status</th></tr></thead>
      <tbody>{identifier.settlements.map((settlement) => <tr key={settlement.id} className={`cursor-default border-t border-white hover:brightness-95 ${settlement.status !== "POSTED" ? "bg-[#ff5722] text-black" : Number(settlement.amount) < 0 ? "bg-[#f8d7da]" : "bg-[#fff3cd]"}`}><td className="px-3 py-2">{dayStamp(settlement.settlementDate, settlement.createdAt)}</td><td className="px-3 py-2">{settlement.remarks || "-"}</td><td className="px-3 py-2 text-right font-mono font-semibold">{whole(settlement.amount)}</td><td className="px-3 py-2 text-right font-mono">{settlement.agentPercentage.toFixed(2)}%</td><td className="px-3 py-2 text-right font-mono">{whole(signedShare(settlement.amount, settlement.agentShare))}</td><td className="px-3 py-2 text-right font-mono">{whole(payableShare(settlement.amount, settlement.uplineShare))}</td><td className="px-3 py-2 text-right font-mono">{whole(signedShare(settlement.amount, settlement.companyShare))}</td><td className="px-3 py-2"><StatusBadge tone={settlement.status === "POSTED" ? "success" : "danger"}>{settlement.status}</StatusBadge></td></tr>)}</tbody></table></div>
      {!identifier.settlements.length ? <p className="px-3 py-6 text-center text-xs text-[#647386]">No settlements yet.</p> : null}
    </section>
    {canPost && identifier.company ? <IdentifierSettlementBar companyId={identifier.company.id} identifierId={identifier.id} uplines={identifier.company.uplines.map((upline) => ({ id: upline.id, name: upline.name, percentageRate: upline.percentageRate.toString() }))} /> : null}
  </>;
}
