import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { hasPermission, requirePermission } from "@/lib/auth/permissions";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { changeCompanyStatusAction } from "./actions";
import { CompanyForm } from "./company-form";

export const metadata: Metadata = { title: "Companies" };

export default async function CompaniesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requirePermission("companies.read");
  const session = await requireSession();
  const { q = "" } = await searchParams;
  const superAdmin = session.user.roles.some(({ role }) => role.key === "superadmin");
  const [canCreate, companies] = await Promise.all([hasPermission("companies.create"), db.company.findMany({
    where: {
      deletedAt: null,
      ...(superAdmin ? {} : { userAccess: { some: { userId: session.userId } } }),
      ...(q.trim() ? { OR: [{ name: { contains: q.trim(), mode: "insensitive" } }, { code: { contains: q.trim(), mode: "insensitive" } }] } : {}),
    },
    include: { _count: { select: { agents: true, ledgerEntries: true, identifiers: true } } },
    orderBy: { name: "asc" },
    take: 100,
  })]);

  return (
    <>
      <PageHeader title="Companies" description="Manage company workspaces, assignments, and ledger activity." />
      {canCreate ? <CompanyForm /> : null}
      <section className="mt-3 overflow-hidden rounded-lg border bg-white">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2">
          <h2 className="text-sm font-bold">Company directory</h2>
          <form className="flex items-center gap-1.5"><Input name="q" defaultValue={q} placeholder="Search companies" className="h-8 w-52" /><Button type="submit" variant="secondary" aria-label="Search"><Search className="size-4" /></Button></form>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead className="bg-[#fff4d7] text-[#59400f]"><tr><th className="px-3 py-2">Company</th><th className="px-3 py-2">Code</th><th className="px-3 py-2">Currency</th><th className="px-3 py-2 text-right">Agents</th><th className="px-3 py-2 text-right">IDs</th><th className="px-3 py-2 text-right">Entries</th><th className="px-3 py-2">Status</th><th className="px-3 py-2 text-right">Actions</th></tr></thead>
            <tbody>{companies.map((company) => <tr key={company.id} className="border-t hover:bg-[#fafbfc]"><td className="px-3 py-2 font-semibold"><Link href={`/companies/${company.id}`} className="text-[#8a6012] hover:underline">{company.name}</Link></td><td className="px-3 py-2 font-mono text-[11px]">{company.code ?? "—"}</td><td className="px-3 py-2">{company.currency}</td><td className="px-3 py-2 text-right font-mono">{company._count.agents}</td><td className="px-3 py-2 text-right font-mono">{company._count.identifiers}</td><td className="px-3 py-2 text-right font-mono">{company._count.ledgerEntries}</td><td className="px-3 py-2"><StatusBadge tone={company.status === "ACTIVE" ? "success" : "neutral"}>{company.status}</StatusBadge></td><td className="px-3 py-2"><div className="flex justify-end gap-1"><Link href={`/companies/${company.id}`} className="inline-flex h-7 items-center rounded border bg-white px-2 font-semibold text-[#203650] hover:bg-[#f4f6f8]">Open</Link><form action={changeCompanyStatusAction}><input type="hidden" name="companyId" value={company.id} /><input type="hidden" name="status" value={company.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"} /><button className="h-7 rounded border bg-white px-2 font-semibold text-[#53657a] hover:bg-[#f4f6f8]">{company.status === "ACTIVE" ? "Deactivate" : "Activate"}</button></form></div></td></tr>)}</tbody>
          </table>
        </div>
        {!companies.length ? <p className="px-3 py-8 text-center text-xs text-[#647386]">No companies match this view.</p> : null}
      </section>
    </>
  );
}
