"use client";

import { useModalAction } from "@/components/ui/use-modal-action";
import { useState } from "react";
import { Landmark, LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { FormFooter } from "@/components/ui/form-footer";
import type { ActionState } from "@/lib/actions/types";
import { createSettlementAction } from "./actions";

interface CompanyOption { id: string; name: string; identifiers: { id: string; value: string; type: string; agentName: string; percentageRate: string }[]; uplines: { id: string; name: string; percentageRate: string }[] }

export function SettlementFormBody({ companies, initialIdempotencyKey }: { companies: CompanyOption[]; initialIdempotencyKey: string }) {
  const [state, action, pending] = useModalAction(createSettlementAction, {} as ActionState);
  const [companyId, setCompanyId] = useState(companies[0]?.id ?? "");
  const company = companies.find((option) => option.id === companyId);
  return (
    <form action={action} className="rounded-lg border bg-white p-3">
      <div className="mb-3 flex items-center gap-2"><Landmark className="size-4 text-[#a97819]" /><h2 className="text-sm font-bold">Post settlement</h2></div>
      <input type="hidden" name="idempotencyKey" value={state.data?.idempotencyKey ?? initialIdempotencyKey} />
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <label className="text-xs font-bold text-[#0d1a2c]">Company<Select name="companyId" className="mt-1" value={companyId} onChange={(event) => setCompanyId(event.target.value)}>{companies.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}</Select></label>
        <label className="text-xs font-bold text-[#0d1a2c]">ID<Select name="identifierId" className="mt-1" required><option value="">Select ID</option>{company?.identifiers.map((identifier) => <option key={identifier.id} value={identifier.id}>{identifier.value} · {identifier.agentName} · {identifier.percentageRate}%</option>)}</Select></label>
        <label className="text-xs font-bold text-[#0d1a2c]">Upline<Select name="uplineId" className="mt-1"><option value="">No upline</option>{company?.uplines.map((upline) => <option key={upline.id} value={upline.id}>{upline.name} · {upline.percentageRate}%</option>)}</Select></label>
        <label className="text-xs font-bold text-[#0d1a2c]">Amount<Input name="amount" className="mt-1" type="number" step="0.00000001" required /></label>
        <label className="text-xs font-bold text-[#0d1a2c]">Date<Input name="settlementDate" className="mt-1" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required /></label>
        <label className="text-xs font-bold text-[#0d1a2c]">Remarks<Input name="remarks" className="mt-1" maxLength={500} /></label>
      </div>
      {state.message ? <p className={`mt-2 text-xs ${state.status === "error" ? "text-[#b42318]" : "text-[#16794b]"}`}>{state.message}</p> : null}
      <FormFooter><Button type="submit" disabled={pending || !company?.identifiers.length}>{pending ? <LoaderCircle className="size-4 animate-spin" /> : null}{pending ? "Posting" : "Post settlement"}</Button></FormFooter>
    </form>
  );
}
