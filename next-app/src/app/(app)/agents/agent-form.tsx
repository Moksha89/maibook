"use client";

import { useActionState, useState } from "react";
import { LoaderCircle, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { FormFooter } from "@/components/ui/form-footer";
import type { ActionState } from "@/lib/actions/types";
import { createAgentAction } from "./actions";

export function AgentForm({ companies, agentNames = [] }: { companies: { id: string; name: string }[]; agentNames?: string[] }) {
  const [state, action, pending] = useActionState(createAgentAction, {} as ActionState);
  const [typed, setTyped] = useState("");
  const existing = agentNames.some((name) => name.trim().toLowerCase() === typed.trim().toLowerCase()) && typed.trim().length > 1;
  return (
    <form action={action} className="rounded-lg border bg-white p-3">
      <div className="mb-3 flex items-center gap-2"><UserPlus className="size-4 text-[#a97819]" /><h2 className="text-sm font-bold">Add agent</h2></div>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
        <label className="text-xs font-bold text-[#0d1a2c]">Name<Input name="name" className="mt-1" required list="existing-agent-names" autoComplete="off" value={typed} onChange={(event) => setTyped(event.target.value)} /><datalist id="existing-agent-names">{agentNames.map((name) => <option key={name} value={name} />)}</datalist></label>
        <label className="text-xs font-bold text-[#0d1a2c]">Phone<Input name="phone" className="mt-1" inputMode="tel" /></label>
        <label className="text-xs font-bold text-[#0d1a2c]">Email<Input name="email" className="mt-1" type="email" /></label>
        <label className="text-xs font-bold text-[#0d1a2c]">Company<Select name="companyId" className="mt-1" required defaultValue={companies.length === 1 ? companies[0].id : ""}><option value="">Select company</option>{companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</Select></label>
        <label className="text-xs font-bold text-[#0d1a2c]">Opening balance<Input name="openingBalance" className="mt-1" type="number" defaultValue="0" step="0.00000001" required /></label>
      </div>
      {existing ? <p className="mt-2 text-xs text-[#8a4b08]">An agent with this name already exists. Submitting will add the existing agent to the selected company instead of creating a duplicate.</p> : null}
      {state.message ? <p className={`mt-2 text-xs ${state.status === "error" ? "text-[#b42318]" : "text-[#16794b]"}`}>{state.message}</p> : null}
      {state.fieldErrors ? <p className="mt-2 text-xs text-[#b42318]">Check the agent details and try again.</p> : null}
      <FormFooter><Button type="submit" disabled={pending}>{pending ? <LoaderCircle className="size-4 animate-spin" /> : null}{pending ? "Saving" : "Create agent"}</Button></FormFooter>
    </form>
  );
}
