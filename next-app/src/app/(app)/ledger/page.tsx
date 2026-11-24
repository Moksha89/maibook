import { randomUUID } from "node:crypto";
import { FilterForm } from "@/components/ui/filter-form";
import type { Metadata } from "next";

import { FormModal } from "@/components/ui/form-modal";
import { PageHeader } from "@/components/ui/page-header";
import { hasPermission, requirePermission } from "@/lib/auth/permissions";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { deleteLedgerEntryAction, restoreLedgerEntryAction } from "./actions";
import { TransferForm } from "./transfer-form";
import { QuickEntryBar } from "./quick-entry-bar";
import { EntryRow } from "./entry-row";
import { Select } from "@/components/ui/input";
import { Button, LinkButton } from "@/components/ui/button";
import { whole, balanceTone, stamp, dayStamp } from "@/lib/format";

export const metadata: Metadata = { title: "Ledger" };

export default async function LedgerPage({ searchParams }: { searchParams: Promise<{ companyId?: string }> }) {
  await requirePermission("ledger.read");
  const session = await requireSession();
  const { companyId } = await searchParams;
  const superAdmin = session.user.roles.some(({ role }) => role.key === "superadmin");
  const companyAccess = superAdmin ? {} : { userAccess: { some: { userId: session.userId } } };
  const [canCreate, canDelete, canUpdate, companies] = await Promise.all([
    hasPermission("ledger.create"),
    hasPermission("ledger.delete"),
    hasPermission("ledger.update"),
    db.company.findMany({ where: { deletedAt: null, status: "ACTIVE", ...companyAccess }, include: { agents: { where: { removedAt: null }, include: { agent: { select: { id: true, name: true } } }, orderBy: { agent: { name: "asc" } } } }, orderBy: { name: "asc" } }),
  ]);
  const allowedCompanyIds = companies.map((company) => company.id);
  const selectedCompanyId = companyId && allowedCompanyIds.includes(companyId) ? companyId : undefined;
  const entryWhere = { companyId: selectedCompanyId ? selectedCompanyId : { in: allowedCompanyIds } };
  const [entries, deletedEntries] = await Promise.all([
    db.ledgerEntry.findMany({ where: { deletedAt: null, ...entryWhere }, include: { company: { select: { name: true, currency: true } }, lines: { include: { agent: { select: { name: true } } }, orderBy: { sequence: "asc" } } }, orderBy: [{ entryDate: "desc" }, { createdAt: "desc" }], take: 100 }),
    canUpdate ? db.ledgerEntry.findMany({ where: { deletedAt: { not: null }, entryType: { in: ["TRANSACTION", "MANUAL_AGENT"] }, ...entryWhere }, include: { company: { select: { name: true } }, lines: { where: { accountType: "AGENT" }, include: { agent: { select: { name: true } } }, orderBy: { sequence: "asc" } } }, orderBy: { deletedAt: "desc" }, take: 25 }) : Promise.resolve([]),
  ]);
  const formCompanies = companies.map((company) => ({ id: company.id, name: company.name, defaultRate: company.defaultRate?.toString() ?? null, agents: company.agents.map(({ agent }) => agent) }));
  const quickCompanies = companies.map((company) => ({ id: company.id, name: company.name, defaultRate: company.defaultRate?.toString() ?? null, agents: company.agents.map(({ agent, currentBalance }) => ({ id: agent.id, name: agent.name, balance: currentBalance.toString() })) }));
  const remarkOptions = [...new Set(entries.map((entry) => entry.remarks?.trim()).filter((value): value is string => Boolean(value)))].slice(0, 300);

  return <>
    <PageHeader title="Ledger" actions={canCreate && formCompanies.length ? <FormModal trigger="Add entry" title="Create ledger entry" size="xl"><TransferForm companies={formCompanies} initialIdempotencyKey={randomUUID()} /></FormModal> : null} />
    <section className="mt-3 overflow-hidden rounded-lg border bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2"><h2 className="text-sm font-bold">Latest entries</h2><FilterForm><Select name="companyId" defaultValue={selectedCompanyId ?? ""}  compact><option value="">All companies</option>{companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</Select><Button type="submit" variant="secondary" className="ml-1.5">Apply</Button></FilterForm></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[1040px] text-left text-xs"><thead className="bg-[#ffeebb] text-[#152235]"><tr><th className="px-3 py-2">Date</th><th className="px-3 py-2">Company</th><th className="px-3 py-2">Agent</th><th className="px-3 py-2 text-right" title="Units moved (coins)">Coins</th><th className="px-3 py-2 text-right" title="Money per coin">Rate</th><th className="px-3 py-2 text-right" title="Money received = coins × rate">Credit (amount)</th><th className="px-3 py-2 text-right" title="Money paid = coins × rate">Debit (amount)</th><th className="px-3 py-2 text-right" title="Running balance in coins, not money">Coin balance</th><th className="px-3 py-2">Remarks</th></tr></thead><tbody>{entries.flatMap((entry) => entry.lines.map((line, index) => <EntryRow key={line.id} data={{ entryId: entry.id, lineId: line.id, editable: entry.entryType === "TRANSACTION" && entry.lines.filter((other) => other.agentId).length === 2 && Boolean(line.agentId), deleted: false, modified: false, counterparty: [...new Set(entry.lines.filter((other) => other.id !== line.id && other.agentId !== line.agentId).map((other) => other.agent?.name || "Company"))].join(", ") || "Company", coins: line.coins.toString(), rate: line.rate.toString(), remarks: entry.remarks ?? "", entryDate: entry.entryDate.toISOString().slice(0, 10) }} className={Number(line.debit) > 0 ? "bg-[#f8d7da]" : "bg-[#fff3cd]"}><td className="px-3 py-2">{index === 0 ? dayStamp(entry.entryDate, entry.createdAt) : ""}</td><td className="px-3 py-2">{index === 0 ? entry.company.name : ""}</td><td className="px-3 py-2 font-semibold">{line.agent?.name ?? line.accountType}</td><td className={"px-3 py-2 text-right font-mono"}>{whole(line.coins)}</td><td className="px-3 py-2 text-right font-mono">{line.rate.toFixed(4)}</td><td className="px-3 py-2 text-right font-mono">{line.credit.isZero() ? "-" : whole(line.credit)}</td><td className="px-3 py-2 text-right font-mono">{line.debit.isZero() ? "-" : whole(line.debit)}</td><td className={`px-3 py-2 text-right font-mono font-semibold ${balanceTone(line.closingBalance)}`}>{whole(line.closingBalance)}</td><td className="max-w-48 truncate px-3 py-2 text-[#647386]">{index === 0 ? entry.remarks || "-" : ""}</td></EntryRow>))}</tbody></table></div>
      {!entries.length ? <p className="px-3 py-8 text-center text-xs text-[#647386]">No ledger entries match this view.</p> : null}
    </section>
    {canUpdate ? <section className="mt-3 overflow-hidden rounded-lg border bg-white"><div className="border-b px-3 py-2"><h2 className="text-sm font-bold">Deleted entries</h2></div><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-xs"><thead className="bg-[#f4f6f8]"><tr><th className="px-3 py-2">Date</th><th className="px-3 py-2">Company</th><th className="px-3 py-2">Agents</th><th className="px-3 py-2">Deleted</th><th className="px-3 py-2 text-right">Action</th></tr></thead><tbody>{deletedEntries.map((entry) => <tr key={entry.id} className="border-t"><td className="px-3 py-2">{dayStamp(entry.entryDate, entry.createdAt)}</td><td className="px-3 py-2">{entry.company.name}</td><td className="px-3 py-2">{entry.lines.map((line) => line.agent?.name || line.accountType).join(" / ")}</td><td className="px-3 py-2">{stamp(entry.deletedAt)}</td><td className="px-3 py-2 text-right"><form action={restoreLedgerEntryAction}><input type="hidden" name="entryId" value={entry.id} /><input type="hidden" name="companyId" value={entry.companyId} /><Button type="submit" size="xs" iconOnly variant="secondary">Restore and recalculate</Button></form></td></tr>)}</tbody></table></div>{!deletedEntries.length ? <p className="px-3 py-6 text-center text-xs text-[#647386]">No deleted entries.</p> : null}</section> : null}
    {canCreate && quickCompanies.length ? <QuickEntryBar key={selectedCompanyId ?? "all"} companies={selectedCompanyId ? quickCompanies.filter((company) => company.id === selectedCompanyId) : quickCompanies} remarkOptions={remarkOptions} initialIdempotencyKey={randomUUID()} /> : null}
  </>;
}
