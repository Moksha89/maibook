import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FormModal } from "@/components/ui/form-modal";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { ActionButton } from "@/components/ui/action-button";
import { hasPermission, requirePermission } from "@/lib/auth/permissions";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { deleteCompanyAction, setCompanyStatusAction } from "./actions";
import { CompanyForm } from "./company-form";
import { EditCompanyForm } from "./edit-company-form";

export const metadata: Metadata = { title: "Companies" };

export default async function CompaniesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requirePermission("companies.read");
  const session = await requireSession();
  const { q = "" } = await searchParams;
  const superAdmin = session.user.roles.some(({ role }) => role.key === "superadmin");
  const [canCreate, canUpdate, canDelete, companies] = await Promise.all([hasPermission("companies.create"), hasPermission("companies.update"), hasPermission("companies.delete"), db.company.findMany({
    where: {
      deletedAt: null,
      ...(superAdmin ? {} : { userAccess: { some: { userId: session.userId } } }),
      ...(q.trim() ? { OR: [{ name: { contains: q.trim(), mode: "insensitive" } }, { code: { contains: q.trim(), mode: "insensitive" } }] } : {}),
    },
    include: { _count: { select: { agents: true, ledgerEntries: true, identifiers: true } } },
    orderBy: { name: "asc" },
    take: 100,
  })]);
  const balanceRows = await db.companyAgent.groupBy({ by: ["companyId"], where: { companyId: { in: companies.map((company) => company.id) }, removedAt: null }, _sum: { currentBalance: true } });
  const balances = new Map(balanceRows.map((row) => [row.companyId, Number(row._sum.currentBalance ?? 0)]));

  return (
    <>
      <PageHeader title="Companies" description="Manage company workspaces, assignments, and ledger activity." actions={canCreate ? <FormModal trigger="Add company" title="Create company"><CompanyForm /></FormModal> : null} />
      <section className="mt-3 overflow-hidden rounded-lg border bg-white">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2">
          <h2 className="text-sm font-bold">Company directory</h2>
          <form className="flex items-center gap-1.5"><Input name="q" defaultValue={q} placeholder="Search companies" className="h-8 w-52" /><Button type="submit" variant="secondary" aria-label="Search"><Search className="size-4" /></Button></form>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-xs">
            <thead className="bg-[#fff4d7] text-[#59400f]"><tr><th className="px-3 py-2">Company</th><th className="px-3 py-2">Code</th><th className="px-3 py-2">Currency</th><th className="px-3 py-2 text-right">Agents</th><th className="px-3 py-2 text-right">IDs</th><th className="px-3 py-2 text-right">Entries</th><th className="px-3 py-2 text-right">Agent balance</th><th className="px-3 py-2">Status</th><th className="px-3 py-2 text-right">Actions</th></tr></thead>
            <tbody>{companies.map((company) => <tr key={company.id} className="border-t hover:bg-[#fafbfc]"><td className="px-3 py-2 font-semibold"><Link href={`/companies/${company.id}`} className="text-[#8a6012] hover:underline">{company.name}</Link>{company.contactPhone || company.contactEmail ? <div className="text-[10px] font-normal text-[#647386]">{[company.contactPhone, company.contactEmail].filter(Boolean).join(" · ")}</div> : null}</td><td className="px-3 py-2 font-mono text-[11px]">{company.code ?? "—"}</td><td className="px-3 py-2">{company.currency}</td><td className="px-3 py-2 text-right font-mono">{company._count.agents}</td><td className="px-3 py-2 text-right font-mono">{company._count.identifiers}</td><td className="px-3 py-2 text-right font-mono">{company._count.ledgerEntries}</td><td className={`px-3 py-2 text-right font-mono ${(balances.get(company.id) ?? 0) < 0 ? "text-[#b42318]" : ""}`}>{(balances.get(company.id) ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td><td className="px-3 py-2"><StatusBadge tone={company.status === "ACTIVE" ? "success" : "neutral"}>{company.status}</StatusBadge></td><td className="px-3 py-2"><div className="flex justify-end gap-1"><Link href={`/companies/${company.id}`} className="inline-flex h-7 items-center rounded border bg-white px-2 font-semibold text-[#203650] hover:bg-[#f4f6f8]">Open</Link>{canUpdate ? <FormModal compact trigger="Edit" title={`Edit ${company.name}`}><EditCompanyForm company={{ id: company.id, name: company.name, code: company.code, currency: company.currency, defaultRate: company.defaultRate?.toString() ?? null, reportHeader: company.reportHeader, reportFooter: company.reportFooter, contactPhone: company.contactPhone, contactEmail: company.contactEmail, notes: company.notes }} /></FormModal> : null}{canUpdate ? <ActionButton action={setCompanyStatusAction} fields={{ companyId: company.id, status: company.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" }} label={company.status === "ACTIVE" ? "Deactivate" : "Activate"} /> : null}{canDelete ? <ActionButton action={deleteCompanyAction} fields={{ companyId: company.id }} label="Remove" danger confirmMessage={`Remove ${company.name}? This cannot be undone.`} /> : null}</div></td></tr>)}</tbody>
          </table>
        </div>
        {!companies.length ? <p className="px-3 py-8 text-center text-xs text-[#647386]">No companies match this view.</p> : null}
      </section>
    </>
  );
}
