import { isUuid } from "@/lib/validation/common";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { LinkButton } from "@/components/ui/button";
import { ActionButton } from "@/components/ui/action-button";
import { hasPermission, requirePermission } from "@/lib/auth/permissions";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { summarizeSettlementProfit } from "@/lib/domain/finance";
import { shareAt } from "@/lib/services/owner-share-history";
import { AssignCompanyForm, EditOwnerForm } from "../owner-form";
import { deleteOwnerEntryAction, unassignOwnerCompanyAction } from "../actions";
import { Tabs } from "@/components/ui/tabs";
import { balanceTone, dayStamp } from "@/lib/format";

const money = (value: number) => value.toLocaleString(undefined, { maximumFractionDigits: 0, signDisplay: "negative" });
const tone = (value: number) => balanceTone(value);

export default async function OwnerPage({ params, searchParams }: { params: Promise<{ ownerId: string }>; searchParams: Promise<{ tab?: string }> }) {
  await requirePermission("owners.read");
  const { ownerId } = await params;
  if (!isUuid(ownerId)) notFound();
  const tab = (await searchParams).tab === "entries" ? "entries" : "companies";
  if (!/^[0-9a-f-]{36}$/i.test(ownerId)) notFound();
  const session = await requireSession();
  const superAdmin = session.user.roles.some(({ role }) => role.key === "superadmin");
  const access = superAdmin ? {} : { userAccess: { some: { userId: session.userId } } };
  const [owner, accessible, canEdit] = await Promise.all([
    db.owner.findUnique({ where: { id: ownerId }, include: { phoneNumbers: true, companyLinks: { include: { company: { select: { id: true, name: true } } }, orderBy: { company: { name: "asc" } } }, entries: { where: { deletedAt: null }, include: { company: { select: { name: true } } }, orderBy: [{ entryDate: "desc" }, { createdAt: "desc" }] } } }),
    db.company.findMany({ where: { deletedAt: null, ...access }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    hasPermission("owners.update"),
  ]);
  if (!owner) notFound();
  const accessibleIds = new Set(accessible.map((company) => company.id));
  const shareholders = await db.shareholder.findMany({ where: { deletedAt: null, normalizedName: owner.normalizedName, companyId: { in: [...accessibleIds] } }, include: { company: { select: { id: true, name: true } } }, orderBy: { company: { name: "asc" } } });
  const historyAll = await db.ownerShareHistory.findMany({ where: { ownerId: owner.id, companyId: { in: [...accessibleIds] } }, orderBy: { effectiveFrom: "asc" } });
  const companyIds = new Set<string>([
    ...owner.companyLinks.filter((link) => accessibleIds.has(link.companyId)).map((link) => link.companyId),
    ...shareholders.map((shareholder) => shareholder.companyId),
    ...historyAll.map((row) => row.companyId),
  ]);
  if (!superAdmin && owner.createdById !== session.userId && !companyIds.size) notFound();

  const companyRecords = companyIds.size ? await db.company.findMany({ where: { id: { in: [...companyIds] } }, select: { id: true, name: true }, orderBy: { name: "asc" } }) : [];
  const settlements = companyIds.size ? await db.settlement.findMany({ where: { companyId: { in: [...companyIds] }, status: "POSTED" }, select: { id: true, companyId: true, createdAt: true, settlementDate: true, remarks: true, amount: true, absoluteAmount: true, agentShare: true, uplineShare: true, companyShare: true, identifier: { select: { value: true } } } }) : [];
  const expenses = companyIds.size ? await db.expense.findMany({ where: { companyId: { in: [...companyIds] }, deletedAt: null }, select: { id: true, companyId: true, createdAt: true, expenseDate: true, category: true, remarks: true, amount: true } }) : [];
  const settlementRows: { id: string; date: Date; createdAt: Date; companyName: string; idValue: string; remarks: string; amount: number; ownerShare: number }[] = [];
  const companies = companyRecords.map((company) => {
    const shareholder = shareholders.find((row) => row.companyId === company.id && row.status === "ACTIVE") ?? shareholders.find((row) => row.companyId === company.id);
    const link = owner.companyLinks.find((row) => row.companyId === company.id);
    const percentage = Number((shareholder ?? link)?.percentage.toString() ?? 0);
    const linkHistory = historyAll.filter((row) => row.companyId === company.id);
    let companyProfit = 0;
    let ownerProfit = 0;
    // Each settlement uses the share % in force when it was posted. Settlements before the partner joined count as 0.
    for (const row of settlements.filter((item) => item.companyId === company.id)) {
      const profit = Number(summarizeSettlementProfit([{ amount: row.amount.toString(), absoluteAmount: row.absoluteAmount.toString(), agentShare: row.agentShare.toString(), uplineShare: row.uplineShare.toString(), companyShare: row.companyShare.toString() }]).companyProfit.toString());
      companyProfit += profit;
      const share = -((profit * shareAt(linkHistory, row.createdAt, 0)) / 100) || 0;
      ownerProfit += share;
      settlementRows.push({ id: row.id, date: row.settlementDate, createdAt: row.createdAt, companyName: company.name, idValue: row.identifier.value, remarks: row.remarks ?? "", amount: Number(row.amount.toString()), ownerShare: share });
    }
    let companyExpenses = 0;
    for (const row of expenses.filter((item) => item.companyId === company.id)) {
      const amount = Number(row.amount.toString());
      const share = (amount * shareAt(linkHistory, row.createdAt, 0)) / 100;
      companyExpenses += amount;
      ownerProfit += share;
      settlementRows.push({ id: row.id, date: row.expenseDate, createdAt: row.createdAt, companyName: company.name, idValue: "-", remarks: `EXPENSE ${row.category}${row.remarks ? `: ${row.remarks}` : ""}`, amount: -amount, ownerShare: share });
    }
    return { id: company.id, name: company.name, percentage, companyProfit, companyExpenses, finalPnl: companyProfit - companyExpenses, ownerProfit };
  });
  const assignedIds = new Set([...owner.companyLinks.map((link) => link.companyId), ...shareholders.filter((row) => row.status === "ACTIVE" && !row.deletedAt).map((row) => row.companyId)]);
  const free = accessible.filter((company) => !assignedIds.has(company.id));
  const entries = owner.entries.filter((entry) => !entry.companyId || accessibleIds.has(entry.companyId) || superAdmin);
  const totalProfit = companies.reduce((sum, row) => sum + row.ownerProfit, 0);
  settlementRows.sort((x, y) => y.date.getTime() - x.date.getTime() || y.createdAt.getTime() - x.createdAt.getTime());
  const paid = entries.filter((entry) => entry.direction === "PAID").reduce((sum, entry) => sum + Number(entry.amount.toString()), 0);
  const received = entries.filter((entry) => entry.direction === "RECEIVED").reduce((sum, entry) => sum + Number(entry.amount.toString()), 0);
  const balance = totalProfit + paid - received;
  const phone = owner.phoneNumbers.map((item) => item.phone).join(", ");
  const stat = (label: string, value: number, className = "") => <div className="rounded-lg border bg-white px-3 py-2"><p className="text-[10px] font-bold uppercase tracking-wide text-[#647386]">{label}</p><p className={`mt-0.5 font-mono text-sm font-semibold ${className}`}>{money(value)}</p></div>;

  return <>
    <PageHeader title={owner.name} actions={<><LinkButton href="/owners" iconOnly icon={ArrowLeft} aria-label="Back to owners" title="Back to owners" className="!size-7 [&_svg]:!size-3.5" /><StatusBadge tone={owner.status === "ACTIVE" ? "success" : "neutral"}>{owner.status}</StatusBadge>{canEdit ? <EditOwnerForm owner={{ id: owner.id, name: owner.name, email: owner.email ?? "", phone: owner.phoneNumbers[0]?.phone ?? "" }} /> : null}</>} />
    <p className="-mt-2 mb-3 text-xs text-[#647386]">Phone {phone || "-"} · Email {owner.email || "-"}</p>
    <div className="mb-3 grid grid-cols-2 gap-2 lg:grid-cols-4">{stat("Profit share", totalProfit, "")}{stat("Paid to partner", paid, "")}{stat("Received from partner", received, "")}{stat("Balance due", balance, tone(balance))}</div>

    <Tabs label="Owner sections" className="mb-3" active={tab} items={[{ key: "companies", label: `Companies (${companies.length})`, href: `/owners/${owner.id}?tab=companies` }, { key: "entries", label: `Entries (${settlementRows.length})`, href: `/owners/${owner.id}?tab=entries` }]} />

    {tab === "companies" ? <section className="overflow-hidden rounded-lg border bg-white">
      <div className="flex items-center justify-between gap-2 border-b px-3 py-2"><h2 className="text-sm font-bold">Companies</h2>{canEdit ? <span className="[&_button]:!size-7 [&_button_svg]:!size-3.5"><AssignCompanyForm ownerId={owner.id} ownerName={owner.name} companies={free} /></span> : null}</div>
      <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-xs"><thead className="bg-[#fff4d7] text-[#59400f]"><tr><th className="px-3 py-2">Company</th><th className="px-3 py-2 text-right">Share</th><th className="px-3 py-2 text-right" title="Company profit from posted settlements">Company profit</th><th className="px-3 py-2 text-right">Expenses</th><th className="px-3 py-2 text-right" title="Company profit minus expenses">Final PNL</th><th className="px-3 py-2 text-right" title="Partner share of final PNL">Partner profit</th>{canEdit ? <th className="px-3 py-2 text-right">Actions</th> : null}</tr></thead>
      <tbody>{companies.map((row) => <tr key={row.id} className="border-t"><td className="px-3 py-2 font-semibold"><Link prefetch={false} href={`/companies/${row.id}`} className="hover:text-[#2196f3] hover:underline">{row.name}</Link></td><td className="px-3 py-2 text-right font-mono">{row.percentage.toFixed(2)}%</td><td className={"px-3 py-2 text-right font-mono"}>{money(row.companyProfit)}</td><td className="px-3 py-2 text-right font-mono">{money(row.companyExpenses)}</td><td className="px-3 py-2 text-right font-mono">{money(row.finalPnl)}</td><td className={"px-3 py-2 text-right font-mono font-semibold"}>{money(row.ownerProfit)}</td>{canEdit ? <td className="px-3 py-2"><div className="flex justify-end"><ActionButton action={unassignOwnerCompanyAction} fields={{ ownerId: owner.id, companyId: row.id }} label="Unassign" danger confirmMessage={`Unassign ${owner.name} from ${row.name}?`} /></div></td> : null}</tr>)}</tbody></table></div>
      {!companies.length ? <p className="px-3 py-6 text-center text-xs text-[#647386]">Not assigned to any company yet.</p> : null}
    </section> : null}

    {tab === "entries" ? <><section className="overflow-hidden rounded-lg border bg-white">
      <div className="flex items-center justify-between gap-2 border-b px-3 py-2"><h2 className="text-sm font-bold">Entries</h2><span className="shrink-0 rounded-full border border-[#d5dbe6] bg-[#f7f8fa] px-3 py-1 text-xs text-[#647386]">Balance due <b className={`ml-1 font-mono text-sm ${tone(balance)}`}>{money(balance)}</b></span></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-xs"><thead className="bg-[#ffeebb] text-[#152235]"><tr><th className="px-3 py-2">Date</th><th className="px-3 py-2">Company</th><th className="px-3 py-2">ID</th><th className="px-3 py-2">Remarks</th><th className="px-3 py-2 text-right">Amount</th><th className="px-3 py-2 text-right">Partner share</th></tr></thead>
      <tbody>{settlementRows.map((row) => <tr key={row.id} className={`cursor-default border-t border-white hover:brightness-95 ${Number(row.ownerShare) < 0 ? "bg-[#f8d7da]" : "bg-[#fff3cd]"}`}><td className="whitespace-nowrap px-3 py-2">{dayStamp(row.date, row.createdAt)}</td><td className="px-3 py-2">{row.companyName}</td><td className="px-3 py-2 font-mono font-semibold">{row.idValue}</td><td className="px-3 py-2">{row.remarks || "-"}</td><td className="px-3 py-2 text-right font-mono font-semibold">{money(row.amount)}</td><td className="px-3 py-2 text-right font-mono">{money(row.ownerShare)}</td></tr>)}</tbody></table></div>
      {!settlementRows.length ? <p className="px-3 py-6 text-center text-xs text-[#647386]">No entries yet.</p> : null}
    </section>
    </> : null}
  </>;
}
