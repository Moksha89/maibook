"use client";

import { useActionState } from "react";
import { LoaderCircle, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ActionState } from "@/lib/actions/types";
import { createAgentAction } from "./actions";

export function AgentForm({ companies }: { companies: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState(createAgentAction, {} as ActionState);
  return (
    <form action={action} className="rounded-lg border bg-white p-3">
      <div className="mb-3 flex items-center gap-2"><UserPlus className="size-4 text-[#a97819]" /><h2 className="text-sm font-bold">Add agent</h2></div>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
        <label className="text-xs font-semibold text-[#3b4d63]">Name<Input name="name" className="mt-1" required /></label>
        <label className="text-xs font-semibold text-[#3b4d63]">Phone<Input name="phone" className="mt-1" inputMode="tel" /></label>
        <label className="text-xs font-semibold text-[#3b4d63]">Email<Input name="email" className="mt-1" type="email" /></label>
        <label className="text-xs font-semibold text-[#3b4d63]">Company<select name="companyId" className="mt-1 h-9 w-full rounded-md border bg-white px-2.5" required><option value="">Select company</option>{companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</select></label>
        <label className="text-xs font-semibold text-[#3b4d63]">Opening balance<Input name="openingBalance" className="mt-1" type="number" defaultValue="0" step="0.00000001" required /></label>
      </div>
      {state.message ? <p className={`mt-2 text-xs ${state.status === "error" ? "text-[#b42318]" : "text-[#16794b]"}`}>{state.message}</p> : null}
      {state.fieldErrors ? <p className="mt-2 text-xs text-[#b42318]">Check the agent details and try again.</p> : null}
      <div className="mt-3 flex justify-end"><Button type="submit" disabled={pending}>{pending ? <LoaderCircle className="size-4 animate-spin" /> : null}{pending ? "Saving" : "Create agent"}</Button></div>
    </form>
  );
}
