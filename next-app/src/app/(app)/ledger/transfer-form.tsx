"use client";

import { useModalAction } from "@/components/ui/use-modal-action";
import { useState } from "react";
import { ArrowRightLeft, LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { FormFooter } from "@/components/ui/form-footer";
import type { ActionState } from "@/lib/actions/types";
import { createTransferAction } from "./actions";

interface CompanyOption {
  id: string;
  name: string;
  defaultRate: string | null;
  agents: { id: string; name: string }[];
}

export function TransferForm({ companies, initialIdempotencyKey }: { companies: CompanyOption[]; initialIdempotencyKey: string }) {
  const [state, action, pending] = useModalAction(createTransferAction, {} as ActionState);
  const [companyId, setCompanyId] = useState(companies[0]?.id ?? "");
  const company = companies.find((option) => option.id === companyId);

  return (
    <form action={action} className="rounded-lg border bg-white p-3">
      <div className="mb-3 flex items-center gap-2"><ArrowRightLeft className="size-4 text-[#a97819]" /><h2 className="text-sm font-bold">Post agent transfer</h2></div>
      <input type="hidden" name="idempotencyKey" value={state.data?.idempotencyKey ?? initialIdempotencyKey} />
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-7">
        <label className="text-xs font-bold text-[#0d1a2c]">Company<Select name="companyId" className="mt-1" value={companyId} onChange={(event) => setCompanyId(event.target.value)} required>{companies.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}</Select></label>
        <label className="text-xs font-bold text-[#0d1a2c]">Sender<Select name="senderAgentId" className="mt-1" required><option value="">Select</option>{company?.agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.name}</option>)}</Select></label>
        <label className="text-xs font-bold text-[#0d1a2c]">Receiver<Select name="receiverAgentId" className="mt-1" required><option value="">Select</option>{company?.agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.name}</option>)}</Select></label>
        <label className="text-xs font-bold text-[#0d1a2c]">Coins<Input uppercase name="coins" className="mt-1" type="number" min="0.01" step="0.01" required /></label>
        <label className="text-xs font-bold text-[#0d1a2c]">Rate<Input name="rate" className="mt-1" type="number" min="0" step="0.0001" defaultValue={company?.defaultRate ?? ""} required /></label>
        <label className="text-xs font-bold text-[#0d1a2c]">Date<Input name="entryDate" className="mt-1" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required /></label>
        <label className="text-xs font-bold text-[#0d1a2c]">Remarks<Input name="remarks" className="mt-1" maxLength={500} /></label>
      </div>
      {state.message ? <p className={`mt-2 text-xs ${state.status === "error" ? "text-[#b42318]" : "text-[#16794b]"}`}>{state.message}</p> : null}
      <FormFooter><Button type="submit" disabled={pending || !company?.agents.length}>{pending ? <LoaderCircle className="size-4 animate-spin" /> : null}{pending ? "Posting" : "Post transfer"}</Button></FormFooter>
    </form>
  );
}
