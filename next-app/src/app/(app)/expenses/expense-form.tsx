"use client";

import { useEffect, useRef, useState } from "react";
import { Check, MessageSquare, Tag, X } from "lucide-react";

import { AutocompleteInput } from "@/components/ui/autocomplete-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useModalAction } from "@/components/ui/use-modal-action";
import type { ActionState } from "@/lib/actions/types";
import { createExpenseAction, updateExpenseAction } from "./actions";

/** Suggestions are only what was typed before for this company (like ledger remarks); any free text is allowed. */
export interface ExpenseFormOptions { categories: string[]; remarks: string[] }
export interface ExpenseValues { id: string; amount: string; category: string; remarks: string | null }

/** Compact company expense form (no labels, no date: it is recorded automatically): amount, category, remarks; OK / Clear. */
export function ExpenseForm({ companyId, options, expense }: { companyId: string; options: ExpenseFormOptions; expense?: ExpenseValues }) {
  const [state, action, pending] = useModalAction(expense ? updateExpenseAction : createExpenseAction, {} as ActionState);
  const formRef = useRef<HTMLFormElement>(null);
  const [category, setCategory] = useState(expense?.category ?? "");
  const [remarks, setRemarks] = useState(expense?.remarks ?? "");
  const clear = () => { setCategory(expense?.category ?? ""); setRemarks(expense?.remarks ?? ""); };
  // Clear the controlled fields once per successful save (render-phase update instead of setState in an effect).
  const [seenState, setSeenState] = useState(state);
  if (seenState !== state) { setSeenState(state); if (state.status === "success" && !expense) { setCategory(""); setRemarks(""); } }
  useEffect(() => { if (state.status === "success" && !expense) formRef.current?.reset(); }, [state, expense]);

  return (
    <form ref={formRef} action={action} aria-label={expense ? "Edit expense" : "Create expense"} className="rounded-lg border bg-white p-2 sm:p-3">
      <input type="hidden" name={expense ? "expenseId" : "companyId"} value={expense ? expense.id : companyId} />
      <div className="flex flex-wrap items-center gap-1.5 lg:flex-nowrap [&_[role=alert]]:hidden [&_.rounded-full]:!h-8 [&_.rounded-full]:!text-xs">
        <Input name="amount" type="number" aria-label="Amount" title="Amount" placeholder="Amount" min={0.01} step="0.01" defaultValue={expense?.amount} className="w-32 shrink-0" required />
        <div className="min-w-0 flex-1 basis-40 [&_input]:uppercase [&_li]:uppercase"><AutocompleteInput name="category" aria-label="Category" title="Category" placeholder="Category" icon={Tag} maxLength={60} uppercase required options={options.categories} value={category} onValueChange={setCategory} /></div>
        <div className="min-w-0 flex-[1.3] basis-48 [&_input]:uppercase [&_li]:uppercase"><AutocompleteInput name="remarks" aria-label="Remarks" title="Remarks" placeholder="Remarks" icon={MessageSquare} maxLength={500} uppercase options={options.remarks} value={remarks} onValueChange={setRemarks} /></div>
        <div className="flex shrink-0 gap-1 [&_button]:!size-7 [&_button_svg]:!size-3.5">
          <Button type="submit" iconOnly icon={Check} aria-label={expense ? "Save expense" : "Add expense"} title={expense ? "Save expense" : "Add expense"} loading={pending} className="!bg-[#ffc107] !text-[#111] !ring-0 hover:!brightness-110" />
          <Button type="reset" iconOnly icon={X} aria-label="Clear" title="Clear" onClick={clear} className="!bg-[#795548] !text-white !ring-0 hover:!brightness-110" />
        </div>
      </div>
      {state.message ? <p role="status" className={`mt-1.5 px-1 text-[11px] ${state.status === "error" ? "text-[#b42318]" : "text-[#16794b]"}`}>{state.message}</p> : null}
    </form>
  );
}
