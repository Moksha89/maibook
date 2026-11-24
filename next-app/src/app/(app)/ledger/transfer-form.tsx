"use client";

import { useActionState, useState } from "react";
import { ArrowRightLeft, LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ActionState } from "@/lib/actions/types";
import { createTransferAction } from "./actions";

interface CompanyOption {
  id: string;
  name: string;
  defaultRate: string | null;
  agents: { id: string; name: string }[];
}

export function TransferForm({ companies, initialIdempotencyKey }: { companies: CompanyOption[]; initialIdempotencyKey: string }) {
  const [state, action, pending] = useActionState(createTransferAction, {} as ActionState);
  const [companyId, setCompanyId] = useState(companies[0]?.id ?? "");
  const company = companies.find((option) => option.id === companyId);

  return (
    <form action={action} className="rounded-lg border bg-white p-3">
      <div className="mb-3 flex items-center gap-2"><ArrowRightLeft className="size-4 text-[#a97819]" /><h2 className="text-sm font-bold">Post agent transfer</h2></div>
      <input type="hidden" name="idempotencyKey" value={state.data?.idempotencyKey ?? initialIdempotencyKey} />
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-7">
        <label className="text-xs font-semibold text-[#3b4d63]">Company<select name="companyId" className="mt-1 h-9 w-full rounded-md border bg-white px-2.5" value={companyId} onChange={(event) => setCompanyId(event.target.value)} required>{companies.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}</select></label>
        <label className="text-xs font-semibold text-[#3b4d63]">Sender<select name="senderAgentId" className="mt-1 h-9 w-full rounded-md border bg-white px-2.5" required><option value="">Select</option>{company?.agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.name}</option>)}</select></label>
        <label className="text-xs font-semibold text-[#3b4d63]">Receiver<select name="receiverAgentId" className="mt-1 h-9 w-full rounded-md border bg-white px-2.5" required><option value="">Select</option>{company?.agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.name}</option>)}</select></label>
        <label className="text-xs font-semibold text-[#3b4d63]">Coins<Input name="coins" className="mt-1" type="number" min="0.00000001" step="0.00000001" required /></label>
        <label className="text-xs font-semibold text-[#3b4d63]">Rate<Input name="rate" className="mt-1" type="number" min="0" step="0.00000001" defaultValue={company?.defaultRate ?? ""} required /></label>
        <label className="text-xs font-semibold text-[#3b4d63]">Date<Input name="entryDate" className="mt-1" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required /></label>
        <label className="text-xs font-semibold text-[#3b4d63]">Remarks<Input name="remarks" className="mt-1" maxLength={500} /></label>
      </div>
      {state.message ? <p className={`mt-2 text-xs ${state.status === "error" ? "text-[#b42318]" : "text-[#16794b]"}`}>{state.message}</p> : null}
      <div className="mt-3 flex justify-end"><Button type="submit" disabled={pending || !company?.agents.length}>{pending ? <LoaderCircle className="size-4 animate-spin" /> : null}{pending ? "Posting" : "Post transfer"}</Button></div>
    </form>
  );
}
