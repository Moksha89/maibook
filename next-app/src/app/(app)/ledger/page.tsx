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
import { Select } from "@/components/ui/input";
import { Button, LinkButton } from "@/components/ui/button";

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

  return <>
    <PageHeader title="Ledger" description="Agent transfers with atomic updates, historical editing, recovery, and cascading balance recalculation. Coins and Coin balance are units; Credit and Debit are money (coins × rate)." actions={canCreate && formCompanies.length ? <FormModal trigger="Add entry" title="Create ledger entry" size="xl"><TransferForm companies={formCompanies} initialIdempotencyKey={randomUUID()} /></FormModal> : null} />
    <section className="mt-3 overflow-hidden rounded-lg border bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2"><h2 className="text-sm font-bold">Latest entries</h2><FilterForm><Select name="companyId" defaultValue={selectedCompanyId ?? ""}  compact><option value="">All companies</option>{companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</Select><Button type="submit" variant="secondary" className="ml-1.5">Apply</Button></FilterForm></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[1040px] text-left text-xs"><thead className="bg-[#fff4d7] text-[#59400f]"><tr><th className="px-3 py-2">Date</th><th className="px-3 py-2">Company</th><th className="px-3 py-2">Agent</th><th className="px-3 py-2 text-right" title="Units moved (coins)">Coins</th><th className="px-3 py-2 text-right" title="Money per coin">Rate</th><th className="px-3 py-2 text-right" title="Money received = coins × rate">Credit (amount)</th><th className="px-3 py-2 text-right" title="Money paid = coins × rate">Debit (amount)</th><th className="px-3 py-2 text-right" title="Running balance in coins, not money">Coin balance</th><th className="px-3 py-2">Remarks</th><th className="px-3 py-2 text-right">Actions</th></tr></thead><tbody>{entries.flatMap((entry) => entry.lines.map((line, index) => <tr key={line.id} className="border-t hover:bg-[#fafbfc]"><td className="px-3 py-2">{index === 0 ? entry.entryDate.toLocaleDateString() : ""}</td><td className="px-3 py-2">{index === 0 ? entry.company.name : ""}</td><td className="px-3 py-2 font-semibold">{line.agent?.name ?? line.accountType}</td><td className={`px-3 py-2 text-right font-mono ${line.coins.isNegative() ? "text-[#b42318]" : "text-[#16794b]"}`}>{line.coins.toFixed(2)}</td><td className="px-3 py-2 text-right font-mono">{line.rate.toFixed(4)}</td><td className="px-3 py-2 text-right font-mono text-[#16794b]">{line.credit.isZero() ? "None" : line.credit.toFixed(2)}</td><td className="px-3 py-2 text-right font-mono text-[#b42318]">{line.debit.isZero() ? "None" : line.debit.toFixed(2)}</td><td className={`px-3 py-2 text-right font-mono font-semibold ${line.closingBalance.isNegative() ? "text-[#b42318]" : "text-[#16794b]"}`}>{line.closingBalance.toFixed(2)}</td><td className="max-w-48 truncate px-3 py-2 text-[#647386]">{index === 0 ? entry.remarks || "None" : ""}</td><td className="px-3 py-2 text-right">{index === 0 ? <div className="flex justify-end gap-1">{canUpdate && ((entry.entryType === "TRANSACTION" && entry.lines.length === 2) || entry.entryType === "MANUAL_AGENT") ? <LinkButton href={`/ledger/${entry.id}/edit`} size="xs" iconOnly variant="secondary">Edit</LinkButton> : null}{canDelete && (entry.entryType === "TRANSACTION" || entry.entryType === "MANUAL_AGENT") ? <form action={deleteLedgerEntryAction}><input type="hidden" name="entryId" value={entry.id} /><input type="hidden" name="companyId" value={entry.companyId} /><Button type="submit" size="xs" iconOnly variant="dangerSoft">Delete</Button></form> : null}</div> : null}</td></tr>))}</tbody></table></div>
      {!entries.length ? <p className="px-3 py-8 text-center text-xs text-[#647386]">No ledger entries match this view.</p> : null}
    </section>
    {canUpdate ? <section className="mt-3 overflow-hidden rounded-lg border bg-white"><div className="border-b px-3 py-2"><h2 className="text-sm font-bold">Deleted entries</h2></div><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-xs"><thead className="bg-[#f4f6f8]"><tr><th className="px-3 py-2">Date</th><th className="px-3 py-2">Company</th><th className="px-3 py-2">Agents</th><th className="px-3 py-2">Deleted</th><th className="px-3 py-2 text-right">Action</th></tr></thead><tbody>{deletedEntries.map((entry) => <tr key={entry.id} className="border-t"><td className="px-3 py-2">{entry.entryDate.toLocaleDateString()}</td><td className="px-3 py-2">{entry.company.name}</td><td className="px-3 py-2">{entry.lines.map((line) => line.agent?.name || line.accountType).join(" / ")}</td><td className="px-3 py-2">{entry.deletedAt?.toLocaleString()}</td><td className="px-3 py-2 text-right"><form action={restoreLedgerEntryAction}><input type="hidden" name="entryId" value={entry.id} /><input type="hidden" name="companyId" value={entry.companyId} /><Button type="submit" size="xs" iconOnly variant="secondary">Restore and recalculate</Button></form></td></tr>)}</tbody></table></div>{!deletedEntries.length ? <p className="px-3 py-6 text-center text-xs text-[#647386]">No deleted entries.</p> : null}</section> : null}
  </>;
}
