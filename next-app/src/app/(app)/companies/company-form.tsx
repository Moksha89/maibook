"use client";

import { useModalAction } from "@/components/ui/use-modal-action";

import { Building2, LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormFooter } from "@/components/ui/form-footer";
import type { ActionState } from "@/lib/actions/types";
import { createCompanyAction } from "./actions";

const initialState: ActionState = {};

export function CompanyForm() {
  const [state, action, pending] = useModalAction(createCompanyAction, initialState);
  return (
    <form action={action} className="rounded-lg border bg-white p-3">
      <div className="mb-3 flex items-center gap-2"><Building2 className="size-4 text-[#a97819]" /><h2 className="text-sm font-bold">Add company</h2></div>
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="text-xs font-bold text-[#0d1a2c]">Company name<Input uppercase name="name" className="mt-1" required /></label>
        <label className="text-xs font-bold text-[#0d1a2c]">Company code<Input name="code" className="mt-1" /></label>
        <label className="text-xs font-bold text-[#0d1a2c] sm:col-span-2">Notes<textarea name="notes" rows={3} maxLength={2000} className="mt-1 block w-full rounded-md border border-[#d6dde6] bg-white px-3 py-2 text-sm font-normal outline-none focus:border-[#a97819]" /></label>
      </div>
      {state.message ? <p className={`mt-2 text-xs ${state.status === "error" ? "text-[#b42318]" : "text-[#16794b]"}`}>{state.message}</p> : null}
      {state.fieldErrors ? <ul className="mt-2 list-disc pl-4 text-xs text-[#b42318]">{Object.values(state.fieldErrors).map((messages, index) => <li key={index}>{messages[0]}</li>)}</ul> : null}
      <FormFooter><Button type="submit" disabled={pending}>{pending ? <LoaderCircle className="size-4 animate-spin" /> : null}{pending ? "Saving" : "Create company"}</Button></FormFooter>
    </form>
  );
}
