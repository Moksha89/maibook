"use client";

import { useActionState } from "react";
import { Building2, LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ActionState } from "@/lib/actions/types";
import { createCompanyAction } from "./actions";

const initialState: ActionState = {};

export function CompanyForm() {
  const [state, action, pending] = useActionState(createCompanyAction, initialState);
  return (
    <form action={action} className="rounded-lg border bg-white p-3">
      <div className="mb-3 flex items-center gap-2"><Building2 className="size-4 text-[#a97819]" /><h2 className="text-sm font-bold">Add company</h2></div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-xs font-semibold text-[#3b4d63]">Name<Input name="name" className="mt-1" required /></label>
        <label className="text-xs font-semibold text-[#3b4d63]">Code<Input name="code" className="mt-1" /></label>
        <label className="text-xs font-semibold text-[#3b4d63]">Currency<Input name="currency" className="mt-1" defaultValue="INR" maxLength={3} required /></label>
        <label className="text-xs font-semibold text-[#3b4d63]">Default rate<Input name="defaultRate" className="mt-1" type="number" min="0" step="0.00000001" /></label>
        <label className="text-xs font-semibold text-[#3b4d63]">Contact phone<Input name="contactPhone" className="mt-1" maxLength={30} /></label>
        <label className="text-xs font-semibold text-[#3b4d63]">Contact email<Input name="contactEmail" type="email" className="mt-1" maxLength={254} /></label>
        <label className="text-xs font-semibold text-[#3b4d63] sm:col-span-2">Notes<Input name="notes" className="mt-1" maxLength={2000} /></label>
      </div>
      {state.message ? <p className={`mt-2 text-xs ${state.status === "error" ? "text-[#b42318]" : "text-[#16794b]"}`}>{state.message}</p> : null}
      {state.fieldErrors ? <p className="mt-2 text-xs text-[#b42318]">Check the highlighted company details and try again.</p> : null}
      <div className="mt-3 flex justify-end"><Button type="submit" disabled={pending}>{pending ? <LoaderCircle className="size-4 animate-spin" /> : null}{pending ? "Saving" : "Create company"}</Button></div>
    </form>
  );
}
