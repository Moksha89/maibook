import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";

import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { requirePermission } from "@/lib/auth/permissions";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Agent" };

const money = (value: { toFixed: (digits: number) => string } | number) => Number(typeof value === "number" ? value : value.toFixed(2)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default async function AgentDetailPage({ params }: { params: Promise<{ agentId: string }> }) {
  await requirePermission("agents.read");
  const session = await requireSession();
  const { agentId } = await params;
  if (!z.string().uuid().safeParse(agentId).success) notFound();
  const superAdmin = session.user.roles.some(({ role }) => role.key === "superadmin");
  const accessFilter = superAdmin ? {} : { userAccess: { some: { userId: session.userId } } };
  const agent = await db.agent.findFirst({
    where: { id: agentId, deletedAt: null, companies: { some: { removedAt: null, company: accessFilter } } },
    include: {
      companies: { where: { removedAt: null, company: accessFilter }, include: { company: { select: { id: true, name: true, currency: true } } }, orderBy: { company: { name: "asc" } } },
      identifiers: { where: { deletedAt: null, company: accessFilter }, include: { company: { select: { name: true } } }, orderBy: { value: "asc" } },
    },
  });
  if (!agent) notFound();
  const companyIds = agent.companies.map((link) => link.companyId);
  const [lines, settlementSum] = await Promise.all([
    db.ledgerEntryLine.findMany({ where: { agentId, companyId: { in: companyIds }, entry: { deletedAt: null } }, include: { company: { select: { name: true } }, entry: { select: { entryDate: true, entryType: true, remarks: true } } }, orderBy: [{ entry: { entryDate: "desc" } }, { createdAt: "desc" }, { sequence: "desc" }], take: 50 }),
    db.settlement.aggregate({ where: { agentId, companyId: { in: companyIds }, status: "POSTED" }, _count: true, _sum: { amount: true, agentShare: true } }),
  ]);
  const total = agent.companies.reduce((sum, link) => sum + Number(link.currentBalance), 0);
  const th = "px-3 py-2";
  return (
    <>
      <PageHeader title={agent.name} description={[agent.phone, agent.email].filter(Boolean).join(" · ") || "Agent profile"} actions={<><StatusBadge tone={agent.status === "ACTIVE" ? "success" : "neutral"}>{agent.status}</StatusBadge><Link href="/agents" className="inline-flex h-8 items-center rounded-md border bg-white px-3 text-xs font-semibold text-[#10233f]">All agents</Link></>} />
      <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {([["Companies", String(agent.companies.length)], ["IDs", String(agent.identifiers.length)], ["Total coin balance", money(total)], ["Settlements posted", `${settlementSum._count} · agent share ${money(Number(settlementSum._sum.agentShare ?? 0))}`]] as const).map(([label, value]) => <div key={label} className="rounded-lg border bg-white px-3 py-2"><div className="text-[10px] font-bold uppercase tracking-wide text-[#647386]">{label}</div><div className="mt-0.5 font-mono text-sm font-bold text-[#0d1a2c]">{value}</div></div>)}
      </div>
      <section className="mb-3 overflow-hidden rounded-lg border bg-white"><h2 className="border-b px-3 py-2 text-sm font-bold">Company balances</h2><div className="overflow-x-auto"><table className="w-full min-w-[560px] text-left text-xs"><thead className="bg-[#fff4d7] text-[#59400f]"><tr><th className={th}>Company</th><th className={`${th} text-right`}>Opening</th><th className={`${th} text-right`}>Current</th><th className={`${th} text-right`}>Ledger</th></tr></thead><tbody>{agent.companies.map((link) => <tr key={link.companyId} className="border-t"><td className="px-3 py-2 font-semibold"><Link className="text-[#8a6012] hover:underline" href={`/companies/${link.companyId}?agent=${agentId}`}>{link.company.name}</Link></td><td className="px-3 py-2 text-right font-mono">{money(link.openingBalance)}</td><td className={`px-3 py-2 text-right font-mono font-semibold ${link.currentBalance.isNegative() ? "text-[#b42318]" : "text-[#16794b]"}`}>{money(link.currentBalance)}</td><td className="px-3 py-2 text-right"><a className="font-semibold text-[#203650] underline" href={`/api/companies/${link.companyId}/ledger/export?agent=${agentId}`}>CSV</a></td></tr>)}</tbody></table></div></section>
      <section className="mb-3 overflow-hidden rounded-lg border bg-white"><h2 className="border-b px-3 py-2 text-sm font-bold">IDs</h2><div className="overflow-x-auto"><table className="w-full min-w-[560px] text-left text-xs"><thead className="bg-[#fff4d7] text-[#59400f]"><tr><th className={th}>ID</th><th className={th}>Company</th><th className={th}>Type</th><th className={`${th} text-right`}>Agent %</th><th className={th}>Status</th></tr></thead><tbody>{agent.identifiers.map((id) => <tr key={id.id} className="border-t"><td className="px-3 py-2 font-mono font-semibold">{id.value}</td><td className="px-3 py-2">{id.company.name}</td><td className="px-3 py-2">{id.type}</td><td className="px-3 py-2 text-right font-mono">{id.percentageRate.toFixed(2)}</td><td className="px-3 py-2"><StatusBadge tone={id.status === "ACTIVE" ? "success" : "neutral"}>{id.status}</StatusBadge></td></tr>)}</tbody></table></div>{!agent.identifiers.length ? <p className="px-3 py-6 text-center text-xs text-[#647386]">No IDs registered for this agent.</p> : null}</section>
      <section className="overflow-hidden rounded-lg border bg-white"><h2 className="border-b px-3 py-2 text-sm font-bold">Recent ledger activity</h2><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-xs"><thead className="bg-[#fff4d7] text-[#59400f]"><tr><th className={th}>Date</th><th className={th}>Company</th><th className={th}>Type</th><th className={`${th} text-right`}>Coins</th><th className={`${th} text-right`}>Balance</th><th className={th}>Remarks</th></tr></thead><tbody>{lines.map((line) => <tr key={line.id} className="border-t"><td className="whitespace-nowrap px-3 py-2">{line.entry.entryDate.toLocaleDateString()}</td><td className="px-3 py-2">{line.company.name}</td><td className="px-3 py-2">{line.entry.entryType.replaceAll("_", " ")}</td><td className={`px-3 py-2 text-right font-mono ${line.coins.isNegative() ? "text-[#b42318]" : "text-[#16794b]"}`}>{money(line.coins)}</td><td className="px-3 py-2 text-right font-mono">{money(line.closingBalance)}</td><td className="px-3 py-2 text-[#647386]">{line.entry.remarks || "—"}</td></tr>)}</tbody></table></div>{!lines.length ? <p className="px-3 py-6 text-center text-xs text-[#647386]">No ledger activity yet.</p> : null}</section>
    </>
  );
}
