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
        <label className="text-xs font-bold text-[#0d1a2c]">Name<Input name="name" className="mt-1" required /></label>
        <label className="text-xs font-bold text-[#0d1a2c]">Code<Input name="code" className="mt-1" /></label>
        <label className="text-xs font-bold text-[#0d1a2c] sm:col-span-2">Notes<textarea name="notes" className="mt-1 min-h-20 w-full resize-y rounded-md border bg-white px-2.5 py-2 font-normal outline-none transition focus:border-[#a97819] focus:ring-2 focus:ring-[#f2d693]" maxLength={2000} /></label>
      </div>
      {state.message ? <p className={`mt-2 text-xs ${state.status === "error" ? "text-[#b42318]" : "text-[#16794b]"}`}>{state.message}</p> : null}
      {state.fieldErrors ? <ul className="mt-2 list-disc pl-4 text-xs text-[#b42318]">{Object.values(state.fieldErrors).map((messages, index) => <li key={index}>{messages[0]}</li>)}</ul> : null}
      <FormFooter><Button type="submit" disabled={pending}>{pending ? <LoaderCircle className="size-4 animate-spin" /> : null}{pending ? "Saving" : "Create company"}</Button></FormFooter>
    </form>
  );
}
