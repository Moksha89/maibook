"use client";

import { useModalAction } from "@/components/ui/use-modal-action";
import { useState } from "react";
import { LoaderCircle, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { FormFooter } from "@/components/ui/form-footer";
import type { ActionState } from "@/lib/actions/types";
import { createAgentAction } from "./actions";
import { SegmentedToggle } from "@/components/ui/toggle";

export function AgentForm({ companies, agentNames = [], fixedCompany }: { companies: { id: string; name: string }[]; agentNames?: string[]; fixedCompany?: { id: string; name: string } }) {
  const [state, action, pending] = useModalAction(createAgentAction, {} as ActionState);
  const [typed, setTyped] = useState("");
  const existing = agentNames.some((name) => name.trim().toLowerCase() === typed.trim().toLowerCase()) && typed.trim().length > 1;
  return (
    <form action={action} className="rounded-lg border bg-white p-3">
      <div className="mb-3 flex items-center gap-2"><UserPlus className="size-4 text-[#a97819]" /><h2 className="text-sm font-bold">Add agent</h2></div>
      <div className="grid grid-cols-2 gap-x-2 gap-y-2">
        <label className="col-span-2 text-xs font-bold text-[#0d1a2c] sm:col-span-1">Name<Input uppercase name="name" className="mt-1" required list="existing-agent-names" autoComplete="off" value={typed} onChange={(event) => setTyped(event.target.value)} /><datalist id="existing-agent-names">{agentNames.map((name) => <option key={name} value={name} />)}</datalist></label>
        <label className="text-xs font-bold text-[#0d1a2c]">Type<div className="mt-1"><SegmentedToggle name="type" label="Agent type" size="xs" className="w-fit" defaultValue="AGENT" submitOnChange={false} options={[{ value: "AGENT", label: "Agent" }, { value: "SUB_AGENT", label: "Sub-agent" }]} /></div></label>
        <label className="text-xs font-bold text-[#0d1a2c]">Phone<Input name="phone" className="mt-1" inputMode="tel" /></label>
        {fixedCompany ? <label className="col-span-2 text-xs font-bold text-[#0d1a2c] sm:col-span-1">Company<input type="hidden" name="companyId" value={fixedCompany.id} /><Input aria-label="Company" className="mt-1" value={fixedCompany.name} readOnly title="Agent is added to this company" /></label> : <label className="col-span-2 text-xs font-bold text-[#0d1a2c] sm:col-span-1">Company<Select name="companyId" className="mt-1" required defaultValue={companies.length === 1 ? companies[0].id : ""}><option value="">Select company</option>{companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</Select></label>}
        <label className="text-xs font-bold text-[#0d1a2c]">Opening balance<Input name="openingBalance" className="mt-1" type="number" defaultValue="0" step="0.01" required /></label>
      </div>
      {existing ? <p className="mt-2 text-xs text-[#8a4b08]">Existing agent - will be linked to this company.</p> : null}
      {state.message ? <p className={`mt-2 text-xs ${state.status === "error" ? "text-[#b42318]" : "text-[#16794b]"}`}>{state.message}</p> : null}
      {state.fieldErrors ? <ul className="mt-2 list-disc pl-4 text-xs text-[#b42318]">{Object.values(state.fieldErrors).map((messages, index) => <li key={index}>{messages[0]}</li>)}</ul> : null}
      <FormFooter><Button type="submit" disabled={pending}>{pending ? <LoaderCircle className="size-4 animate-spin" /> : null}{pending ? "Saving" : "Create agent"}</Button></FormFooter>
    </form>
  );
}
