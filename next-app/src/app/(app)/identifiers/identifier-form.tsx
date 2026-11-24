"use client";

import { useModalAction } from "@/components/ui/use-modal-action";
import { useState } from "react";
import { IdCard, LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { FormFooter } from "@/components/ui/form-footer";
import type { ActionState } from "@/lib/actions/types";
import { createIdentifierAction } from "./actions";
import { SegmentedToggle } from "@/components/ui/toggle";

interface CompanyOption { id: string; name: string; agents: { id: string; name: string }[] }

export function IdentifierForm({ companies }: { companies: CompanyOption[] }) {
  const [state, action, pending] = useModalAction(createIdentifierAction, {} as ActionState);
  const [companyId, setCompanyId] = useState(companies[0]?.id ?? "");
  const company = companies.find((option) => option.id === companyId);
  return (
    <form action={action} className="rounded-lg border bg-white p-3">
      <div className="mb-3 flex items-center gap-2"><IdCard className="size-4 text-[#a97819]" /><h2 className="text-sm font-bold">Add ID</h2></div>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
        <label className="text-xs font-bold text-[#0d1a2c]">Company<Select name="companyId" className="mt-1" value={companyId} onChange={(event) => setCompanyId(event.target.value)}>{companies.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}</Select></label>
        <label className="text-xs font-bold text-[#0d1a2c]">Agent<Select name="agentId" className="mt-1" required><option value="">Select</option>{company?.agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.name}</option>)}</Select></label>
        <label className="text-xs font-bold text-[#0d1a2c]">ID value<Input name="value" className="mt-1" required /></label>
        <label className="text-xs font-bold text-[#0d1a2c]">Type<SegmentedToggle name="type" label="ID type" size="md" className="mt-1 w-full" options={[{ value: "AGENT", label: "Agent" }, { value: "SUB_AGENT", label: "Sub Agent" }]} /></label>
        <label className="text-xs font-bold text-[#0d1a2c]">Agent percentage<Input name="percentageRate" className="mt-1" type="number" min="0" max="100" step="0.0001" required /></label>
      </div>
      {state.message ? <p className={`mt-2 text-xs ${state.status === "error" ? "text-[#b42318]" : "text-[#16794b]"}`}>{state.message}</p> : null}
      <FormFooter><Button type="submit" disabled={pending}>{pending ? <LoaderCircle className="size-4 animate-spin" /> : null}{pending ? "Saving" : "Create ID"}</Button></FormFooter>
    </form>
  );
}
