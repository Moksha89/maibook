"use client";

import { useState } from "react";
import { useModalAction } from "@/components/ui/use-modal-action";

import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { FormFooter } from "@/components/ui/form-footer";
import type { ActionState } from "@/lib/actions/types";
import { updateLedgerEntryAction, updateManualAgentEntryAction } from "../../actions";

type CompanyOption = { id: string; name: string; agents: { id: string; name: string }[] };

export function EditTransferForm({ entry, companies }: {
  entry: { id: string; companyId: string; senderAgentId: string; receiverAgentId: string; coins: string; rate: string; entryDate: string; remarks: string };
  companies: CompanyOption[];
}) {
  const [state, action, pending] = useModalAction(updateLedgerEntryAction, {} as ActionState);
  const [companyId, setCompanyId] = useState(entry.companyId);
  const [senderAgentId, setSenderAgentId] = useState(entry.senderAgentId);
  const [receiverAgentId, setReceiverAgentId] = useState(entry.receiverAgentId);
  const company = companies.find((item) => item.id === companyId);
  const agents = company?.agents ?? [];
  function changeCompany(next: string) {
    setCompanyId(next);
    const nextAgents = companies.find((item) => item.id === next)?.agents ?? [];
    const ids = new Set(nextAgents.map((agent) => agent.id));
    if (!ids.has(senderAgentId)) setSenderAgentId("");
    if (!ids.has(receiverAgentId)) setReceiverAgentId("");
  }
  return <form action={action} className="rounded-lg border bg-white p-3"><input type="hidden" name="entryId" value={entry.id} />
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      <label className="text-xs font-bold text-[#0d1a2c]">Company<Select name="companyId" className="mt-1" value={companyId} onChange={(event) => changeCompany(event.target.value)} required>{companies.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></label>
      <label className="text-xs font-bold text-[#0d1a2c]">Sender<Select name="senderAgentId" className="mt-1" value={senderAgentId} onChange={(event) => setSenderAgentId(event.target.value)} required><option value="">Select agent</option>{agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.name}</option>)}</Select></label>
      <label className="text-xs font-bold text-[#0d1a2c]">Receiver<Select name="receiverAgentId" className="mt-1" value={receiverAgentId} onChange={(event) => setReceiverAgentId(event.target.value)} required><option value="">Select agent</option>{agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.name}</option>)}</Select></label>
      <label className="text-xs font-bold text-[#0d1a2c]">Coins<Input uppercase name="coins" className="mt-1" type="number" min="0.01" step="0.01" defaultValue={entry.coins} required /></label>
      <label className="text-xs font-bold text-[#0d1a2c]">Rate<Input name="rate" className="mt-1" type="number" min="0" step="0.0001" defaultValue={entry.rate} required /></label>
      <label className="text-xs font-bold text-[#0d1a2c]">Date<Input name="entryDate" className="mt-1" type="date" defaultValue={entry.entryDate} required /></label>
      <label className="text-xs font-bold text-[#0d1a2c]">Remarks<Input name="remarks" className="mt-1" defaultValue={entry.remarks} maxLength={500} /></label>
    </div>
    {state.message ? <p className={`mt-2 text-xs ${state.status === "error" ? "text-[#b42318]" : "text-[#16794b]"}`}>{state.message}</p> : null}
    <FormFooter><Button type="submit" disabled={pending}>{pending ? <LoaderCircle className="size-4 animate-spin" /> : null}{pending ? "Saving" : "Save and recalculate"}</Button></FormFooter>
  </form>;
}

export function EditManualAgentForm({ entry, companies }: {
  entry: { id: string; companyId: string; agentId: string; amount: string; entryDate: string; remarks: string };
  companies: CompanyOption[];
}) {
  const [state, action, pending] = useModalAction(updateManualAgentEntryAction, {} as ActionState);
  const [companyId, setCompanyId] = useState(entry.companyId);
  const [agentId, setAgentId] = useState(entry.agentId);
  const agents = companies.find((item) => item.id === companyId)?.agents ?? [];
  function changeCompany(next: string) {
    setCompanyId(next);
    const ids = new Set((companies.find((item) => item.id === next)?.agents ?? []).map((agent) => agent.id));
    if (!ids.has(agentId)) setAgentId("");
  }
  return <form action={action} className="rounded-lg border bg-white p-3"><input type="hidden" name="entryId" value={entry.id} />
    <div className="grid gap-2 sm:grid-cols-3">
      <label className="text-xs font-bold text-[#0d1a2c]">Company<Select name="companyId" className="mt-1" value={companyId} onChange={(event) => changeCompany(event.target.value)} required>{companies.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></label>
      <label className="text-xs font-bold text-[#0d1a2c]">Agent<Select name="agentId" className="mt-1" value={agentId} onChange={(event) => setAgentId(event.target.value)} required><option value="">Select agent</option>{agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.name}</option>)}</Select></label>
      <label className="text-xs font-bold text-[#0d1a2c]">Signed amount<Input uppercase name="amount" className="mt-1" type="number" step="0.01" defaultValue={entry.amount} required /></label>
      <label className="text-xs font-bold text-[#0d1a2c]">Date<Input name="entryDate" className="mt-1" type="date" defaultValue={entry.entryDate} required /></label>
      <label className="text-xs font-bold text-[#0d1a2c]">Remarks<Input name="remarks" className="mt-1" defaultValue={entry.remarks} /></label>
    </div>
    {state.message ? <p className={`mt-2 text-xs ${state.status === "error" ? "text-[#b42318]" : "text-[#16794b]"}`}>{state.message}</p> : null}
    <FormFooter><Button type="submit" disabled={pending}>{pending ? <LoaderCircle className="size-4 animate-spin" /> : null}Save changes</Button></FormFooter>
  </form>;
}
