import type { Metadata } from "next";
import Link from "next/link";

import { FilterForm } from "@/components/ui/filter-form";
import { Pagination } from "@/components/ui/pagination";
import { ExpandingSearch } from "@/components/ui/expanding-search";
import { LinkButton } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { requirePermission } from "@/lib/auth/permissions";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { companyPnl } from "@/lib/services/expenses";
import { pageRows } from "@/lib/paging";
import { balanceTone, whole } from "@/lib/format";

export const metadata: Metadata = { title: "Expenses" };

const money = (value: number) => Number(whole(value)).toLocaleString("en-IN");

/** Expense module home: every company the user can access, with its expense total and final PNL. */
export default async function ExpensesPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  await requirePermission("expenses.read");
  const session = await requireSession();
  const { q = "", page } = await searchParams;
  const superAdmin = session.user.roles.some(({ role }) => role.key === "superadmin");
  const companies = await db.company.findMany({
    where: { deletedAt: null, ...(superAdmin ? {} : { userAccess: { some: { userId: session.userId } } }), ...(q.trim() ? { name: { contains: q.trim(), mode: "insensitive" as const } } : {}) },
    select: { id: true, name: true, status: true },
    orderBy: { name: "asc" },
    take: 200,
  });
  const pnl = await companyPnl(companies.map((company) => company.id));
  const totals = [...pnl.values()].reduce((sum, row) => ({ profit: sum.profit + row.profit, expenses: sum.expenses + row.expenses, finalPnl: sum.finalPnl + row.finalPnl }), { profit: 0, expenses: 0, finalPnl: 0 });
  const paged = pageRows(companies, page);

  return (
    <>
      <PageHeader title="Expenses" />
      <section className="overflow-hidden rounded-lg border bg-white">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2">
          <h2 className="text-sm font-bold">Companies</h2>
          <FilterForm className="flex items-center gap-1.5"><ExpandingSearch defaultValue={q} label="Search companies" /></FilterForm>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-xs">
            <thead className="bg-[#fff4d7] text-[#59400f]"><tr><th className="px-3 py-2">Company</th><th className="px-3 py-2 text-right">Entries</th><th className="px-3 py-2 text-right">Company profit</th><th className="px-3 py-2 text-right">Expenses</th><th className="px-3 py-2 text-right">Final PNL</th><th className="px-3 py-2 text-right">Actions</th></tr></thead>
            <tbody>{paged.rows.map((company) => { const row = pnl.get(company.id)!; return <tr key={company.id} className="border-t hover:bg-[#fafbfc]"><td className="px-3 py-2 font-semibold"><Link prefetch={false} href={`/expenses/${company.id}`} className="text-[#8a6012] hover:underline">{company.name}</Link></td><td className="px-3 py-2 text-right font-mono">{row.expenseCount}</td><td className="px-3 py-2 text-right font-mono">{money(row.profit)}</td><td className="px-3 py-2 text-right font-mono">{money(row.expenses)}</td><td className={`px-3 py-2 text-right font-mono font-semibold ${balanceTone(row.finalPnl)}`}>{money(row.finalPnl)}</td><td className="px-3 py-2"><div className="flex justify-end"><LinkButton href={`/expenses/${company.id}`} size="xs" iconOnly variant="secondary">Open expenses</LinkButton></div></td></tr>; })}</tbody>
            {companies.length > 1 ? <tfoot className="border-t-2 bg-[#fffaf0] font-semibold"><tr><td className="px-3 py-2">Total</td><td className="px-3 py-2 text-right font-mono">{[...pnl.values()].reduce((sum, row) => sum + row.expenseCount, 0)}</td><td className="px-3 py-2 text-right font-mono">{money(totals.profit)}</td><td className="px-3 py-2 text-right font-mono">{money(totals.expenses)}</td><td className={`px-3 py-2 text-right font-mono ${balanceTone(totals.finalPnl)}`}>{money(totals.finalPnl)}</td><td /></tr></tfoot> : null}
          </table>
        </div>
        {!companies.length ? <p className="px-3 py-8 text-center text-xs text-[#647386]">No companies match this view.</p> : null}
        <Pagination pathname="/expenses" params={{ q }} page={paged.current} pages={paged.pages} total={paged.total} />
      </section>
    </>
  );
}
