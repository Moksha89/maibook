"use client";

import { useModalAction } from "@/components/ui/use-modal-action";
import { Button } from "@/components/ui/button";
import { FormModal } from "@/components/ui/form-modal";
import { Input, Select } from "@/components/ui/input";
import { FormFooter } from "@/components/ui/form-footer";
import type { ActionState } from "@/lib/actions/types";
import { distributeManualAgentAction } from "./actions";

function DistributionFormBody({ agents, idempotencyKey }: { agents: { id: string; name: string; companies: string }[]; idempotencyKey: string }) {
  const [state, action, pending] = useModalAction(distributeManualAgentAction, {} as ActionState);
  return <><form action={action} className="rounded-lg border bg-white p-3"><input type="hidden" name="idempotencyKey" value={state.data?.idempotencyKey || idempotencyKey} /><div className="grid gap-2 sm:grid-cols-2"><label className="text-xs font-semibold sm:col-span-2">Agent<Select name="agentId" className="mt-1" required><option value="">Select agent</option>{agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.name} ({agent.companies})</option>)}</Select></label><label className="text-xs font-semibold">Signed amount<Input name="amount" className="mt-1" type="number" step="0.00000001" required /></label><label className="text-xs font-semibold">Date<Input name="entryDate" className="mt-1" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required /></label><label className="text-xs font-semibold sm:col-span-2">Remarks<Input name="remarks" className="mt-1" maxLength={500} /></label></div>{state.message ? <p className={`mt-2 text-xs ${state.status === "error" ? "text-[#b42318]" : "text-[#16794b]"}`}>{state.message}</p> : null}<FormFooter><Button type="submit" disabled={pending}>{pending ? "Posting" : "Distribute"}</Button></FormFooter></form></>;
}

export function DistributionForm(props: Parameters<typeof DistributionFormBody>[0]) {
  return <FormModal trigger="New distribution" title="Manual distribution"><DistributionFormBody {...props} /></FormModal>;
}
