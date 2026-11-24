import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { FormModal } from "@/components/ui/form-modal";
import { LinkButton } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs } from "@/components/ui/tabs";
import { hasPermission, requireCompanyAccess, requirePermission } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import { singleCompanyPnl } from "@/lib/services/expenses";
import { balanceTone, stamp, whole } from "@/lib/format";
import { ExpenseForm, type ExpenseFormOptions } from "../expense-form";
import { DeleteExpenseButton } from "../expense-actions";

export const metadata: Metadata = { title: "Company expenses" };

const money = (value: unknown) => Number(whole(value)).toLocaleString("en-IN");

/** One company's expenses: Expenses list (modify / delete) and Create Expense tabs, with profit, expenses and final PNL. */
export default async function CompanyExpensesPage({ params, searchParams }: { params: Promise<{ companyId: string }>; searchParams: Promise<{ tab?: string }> }) {
  await requirePermission("expenses.read");
  const { companyId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(companyId)) notFound();
  await requireCompanyAccess(companyId, "READ");
  const [company, canCreate, canUpdate, canDelete, fullAccess] = await Promise.all([
    db.company.findFirst({ where: { id: companyId, deletedAt: null }, select: { id: true, name: true, status: true } }),
    hasPermission("expenses.create"),
    hasPermission("expenses.update"),
    hasPermission("expenses.delete"),
    requireCompanyAccess(companyId, "FULL").then(() => true, () => false),
  ]);
  if (!company) notFound();
  const mayCreate = canCreate && fullAccess;
  const mayEdit = canUpdate && fullAccess;
  const mayDelete = canDelete && fullAccess;
  const requested = (await searchParams).tab;
  const tab = requested === "create" && mayCreate ? "create" : "expenses";

  const [expenses, pnl] = await Promise.all([
    db.expense.findMany({ where: { companyId, deletedAt: null }, orderBy: [{ expenseDate: "desc" }, { createdAt: "desc" }], take: 500 }),
    singleCompanyPnl(companyId),
  ]);
  // Like ledger remarks: suggest only what was typed before for this company (newest first); free text is always allowed.
  const typed = (values: (string | null)[]) => [...new Set(values.map((value) => value?.trim()).filter((value): value is string => Boolean(value)))].slice(0, 300);
  const options: ExpenseFormOptions = { categories: typed(expenses.map((row) => row.category)), remarks: typed(expenses.map((row) => row.remarks)) };
  const stat = (label: string, value: number, className = "") => <div className="rounded-lg border bg-white px-3 py-2"><p className="text-[10px] font-bold uppercase tracking-wide text-[#647386]">{label}</p><p className={`mt-0.5 font-mono text-sm font-semibold ${className}`}>{money(value)}</p></div>;

  return (
    <>
      <PageHeader title={`${company.name} expenses`} actions={<LinkButton href="/expenses" iconOnly icon={ArrowLeft} aria-label="Back to expenses" title="Back to expenses" className="!size-7 [&_svg]:!size-3.5" />} />
      <div className="mb-3 grid grid-cols-3 gap-2">{stat("Company profit", pnl.profit)}{stat("Expenses", pnl.expenses)}{stat("Final PNL", pnl.finalPnl, balanceTone(pnl.finalPnl))}</div>
      <Tabs label="Expense sections" className="mb-3" active={tab} items={[{ key: "expenses", label: `Expenses (${expenses.length})`, href: `/expenses/${companyId}?tab=expenses` }, ...(mayCreate ? [{ key: "create", label: "Create Expense", href: `/expenses/${companyId}?tab=create` }] : [])]} />

      {tab === "create" ? <ExpenseForm companyId={companyId} options={options} /> : null}

      {tab === "expenses" ? <section className="overflow-hidden rounded-lg border bg-white">
        <div className="flex items-center justify-between gap-2 border-b px-3 py-2"><h2 className="text-sm font-bold">Expenses</h2><span className="shrink-0 rounded-full border border-[#d5dbe6] bg-[#f7f8fa] px-3 py-1 text-xs text-[#647386]">Total <b className="ml-1 font-mono text-sm text-[#152235]">{money(pnl.expenses)}</b></span></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-left text-xs">
          <thead className="bg-[#ffeebb] text-[#152235]"><tr><th className="px-3 py-2">Date</th><th className="px-3 py-2">Category</th><th className="px-3 py-2">Remarks</th><th className="px-3 py-2 text-right">Amount</th>{mayEdit || mayDelete ? <th className="px-3 py-2 text-right">Actions</th> : null}</tr></thead>
          <tbody>{expenses.map((expense) => <tr key={expense.id} className="cursor-default border-t border-white bg-[#fff3cd] hover:brightness-95">
            <td className="whitespace-nowrap px-3 py-2">{stamp(expense.createdAt)}</td>
            <td className="px-3 py-2 font-semibold">{expense.category}</td>
            <td className="px-3 py-2">{expense.remarks || "-"}</td>
            <td className="px-3 py-2 text-right font-mono font-semibold">{money(expense.amount)}</td>
            {mayEdit || mayDelete ? <td className="px-3 py-2"><div className="flex justify-end gap-1">
              {mayEdit ? <FormModal compact size="lg" trigger="Modify" title={`Modify expense ${expense.category}`} triggerClassName="!size-7 !bg-[#2196f3] !text-white !ring-0 hover:!brightness-110 [&_svg]:!size-3.5"><ExpenseForm companyId={companyId} options={options} expense={{ id: expense.id, amount: expense.amount.toString(), category: expense.category, remarks: expense.remarks }} /></FormModal> : null}
              {mayDelete ? <DeleteExpenseButton expenseId={expense.id} label={`${expense.category} ${money(expense.amount)}`} /> : null}
            </div></td> : null}
          </tr>)}</tbody>
        </table></div>
        {!expenses.length ? <p className="px-3 py-8 text-center text-xs text-[#647386]">No expenses yet.</p> : null}
      </section> : null}
    </>
  );
}
