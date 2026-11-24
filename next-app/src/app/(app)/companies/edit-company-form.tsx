"use client";

import { useModalAction } from "@/components/ui/use-modal-action";

import { LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormFooter } from "@/components/ui/form-footer";
import type { ActionState } from "@/lib/actions/types";
import { updateCompanyAction } from "./actions";

export interface EditableCompany { id: string; name: string; code: string | null; currency: string; defaultRate: string | null; reportHeader: string | null; reportFooter: string | null; contactPhone: string | null; contactEmail: string | null; notes: string | null }

export function EditCompanyForm({ company }: { company: EditableCompany }) {
  const [state, action, pending] = useModalAction(updateCompanyAction, {} as ActionState);
  return (
    <form action={action} className="rounded-lg border bg-white p-3">
      <input type="hidden" name="companyId" value={company.id} />
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-xs font-bold text-[#0d1a2c]">Name<Input name="name" className="mt-1" defaultValue={company.name} required /></label>
        <label className="text-xs font-bold text-[#0d1a2c]">Code<Input name="code" className="mt-1" defaultValue={company.code ?? ""} /></label>
        <label className="text-xs font-bold text-[#0d1a2c]">Currency<Input name="currency" className="mt-1" defaultValue={company.currency} maxLength={3} required /></label>
        <label className="text-xs font-bold text-[#0d1a2c]">Default rate<Input name="defaultRate" className="mt-1" type="number" min="0" step="0.00000001" defaultValue={company.defaultRate ?? ""} /></label>
        <label className="text-xs font-bold text-[#0d1a2c]">Contact phone<Input name="contactPhone" className="mt-1" defaultValue={company.contactPhone ?? ""} maxLength={30} /></label>
        <label className="text-xs font-bold text-[#0d1a2c]">Contact email<Input name="contactEmail" type="email" className="mt-1" defaultValue={company.contactEmail ?? ""} maxLength={254} /></label>
        <label className="text-xs font-bold text-[#0d1a2c] sm:col-span-2">Notes<Input name="notes" className="mt-1" defaultValue={company.notes ?? ""} maxLength={2000} /></label>
        <label className="text-xs font-bold text-[#0d1a2c] sm:col-span-2">Report header<Input name="reportHeader" className="mt-1" defaultValue={company.reportHeader ?? ""} maxLength={240} /></label>
        <label className="text-xs font-bold text-[#0d1a2c] sm:col-span-2">Report footer<Input name="reportFooter" className="mt-1" defaultValue={company.reportFooter ?? ""} maxLength={240} /></label>
      </div>
      {state.message ? <p className={`mt-2 text-xs ${state.status === "error" ? "text-[#b42318]" : "text-[#16794b]"}`}>{state.message}</p> : null}
      <FormFooter><Button type="submit" disabled={pending}>{pending ? <LoaderCircle className="size-4 animate-spin" /> : null}{pending ? "Saving" : "Save changes"}</Button></FormFooter>
    </form>
  );
}
