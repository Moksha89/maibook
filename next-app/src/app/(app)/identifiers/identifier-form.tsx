"use client";

import { useActionState, useState } from "react";
import { IdCard, LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ActionState } from "@/lib/actions/types";
import { createIdentifierAction } from "./actions";

interface CompanyOption { id: string; name: string; agents: { id: string; name: string }[] }

export function IdentifierForm({ companies }: { companies: CompanyOption[] }) {
  const [state, action, pending] = useActionState(createIdentifierAction, {} as ActionState);
  const [companyId, setCompanyId] = useState(companies[0]?.id ?? "");
  const company = companies.find((option) => option.id === companyId);
  return (
    <form action={action} className="rounded-lg border bg-white p-3">
      <div className="mb-3 flex items-center gap-2"><IdCard className="size-4 text-[#a97819]" /><h2 className="text-sm font-bold">Add ID</h2></div>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
        <label className="text-xs font-semibold text-[#3b4d63]">Company<select name="companyId" className="mt-1 h-9 w-full rounded-md border bg-white px-2.5" value={companyId} onChange={(event) => setCompanyId(event.target.value)}>{companies.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}</select></label>
        <label className="text-xs font-semibold text-[#3b4d63]">Agent<select name="agentId" className="mt-1 h-9 w-full rounded-md border bg-white px-2.5" required><option value="">Select</option>{company?.agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.name}</option>)}</select></label>
        <label className="text-xs font-semibold text-[#3b4d63]">ID value<Input name="value" className="mt-1" required /></label>
        <label className="text-xs font-semibold text-[#3b4d63]">Type<select name="type" className="mt-1 h-9 w-full rounded-md border bg-white px-2.5"><option value="AGENT">Agent</option><option value="SUB_AGENT">Sub Agent</option></select></label>
        <label className="text-xs font-semibold text-[#3b4d63]">Agent percentage<Input name="percentageRate" className="mt-1" type="number" min="0" max="100" step="0.0001" required /></label>
      </div>
      {state.message ? <p className={`mt-2 text-xs ${state.status === "error" ? "text-[#b42318]" : "text-[#16794b]"}`}>{state.message}</p> : null}
      <div className="mt-3 flex justify-end"><Button type="submit" disabled={pending}>{pending ? <LoaderCircle className="size-4 animate-spin" /> : null}{pending ? "Saving" : "Create ID"}</Button></div>
    </form>
  );
}
