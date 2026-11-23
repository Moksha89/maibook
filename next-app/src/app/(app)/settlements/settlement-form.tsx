"use client";

import { useActionState, useState } from "react";
import { Landmark, LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ActionState } from "@/lib/actions/types";
import { createSettlementAction } from "./actions";

interface CompanyOption { id: string; name: string; identifiers: { id: string; value: string; type: string; agentName: string; percentageRate: string }[]; uplines: { id: string; name: string; percentageRate: string }[] }

export function SettlementForm({ companies, initialIdempotencyKey }: { companies: CompanyOption[]; initialIdempotencyKey: string }) {
  const [state, action, pending] = useActionState(createSettlementAction, {} as ActionState);
  const [companyId, setCompanyId] = useState(companies[0]?.id ?? "");
  const company = companies.find((option) => option.id === companyId);
  return (
    <form action={action} className="rounded-lg border bg-white p-3">
      <div className="mb-3 flex items-center gap-2"><Landmark className="size-4 text-[#a97819]" /><h2 className="text-sm font-bold">Post settlement</h2></div>
      <input type="hidden" name="idempotencyKey" value={state.data?.idempotencyKey ?? initialIdempotencyKey} />
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <label className="text-xs font-semibold text-[#3b4d63]">Company<select name="companyId" className="mt-1 h-9 w-full rounded-md border bg-white px-2.5" value={companyId} onChange={(event) => setCompanyId(event.target.value)}>{companies.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}</select></label>
        <label className="text-xs font-semibold text-[#3b4d63]">ID<select name="identifierId" className="mt-1 h-9 w-full rounded-md border bg-white px-2.5" required><option value="">Select ID</option>{company?.identifiers.map((identifier) => <option key={identifier.id} value={identifier.id}>{identifier.value} · {identifier.agentName} · {identifier.percentageRate}%</option>)}</select></label>
        <label className="text-xs font-semibold text-[#3b4d63]">Upline<select name="uplineId" className="mt-1 h-9 w-full rounded-md border bg-white px-2.5"><option value="">No upline</option>{company?.uplines.map((upline) => <option key={upline.id} value={upline.id}>{upline.name} · {upline.percentageRate}%</option>)}</select></label>
        <label className="text-xs font-semibold text-[#3b4d63]">Amount<Input name="amount" className="mt-1" type="number" step="0.00000001" required /></label>
        <label className="text-xs font-semibold text-[#3b4d63]">Date<Input name="settlementDate" className="mt-1" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required /></label>
        <label className="text-xs font-semibold text-[#3b4d63]">Remarks<Input name="remarks" className="mt-1" maxLength={500} /></label>
      </div>
      {state.message ? <p className={`mt-2 text-xs ${state.status === "error" ? "text-[#b42318]" : "text-[#16794b]"}`}>{state.message}</p> : null}
      <div className="mt-3 flex justify-end"><Button type="submit" disabled={pending || !company?.identifiers.length}>{pending ? <LoaderCircle className="size-4 animate-spin" /> : null}{pending ? "Posting" : "Post settlement"}</Button></div>
    </form>
  );
}
