"use client";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { FormModal } from "@/components/ui/form-modal";
import { Input } from "@/components/ui/input";
import type { ActionState } from "@/lib/actions/types";
import { distributeManualAgentAction } from "./actions";

export function DistributionForm({ agents, idempotencyKey }: { agents: { id: string; name: string; companies: string }[]; idempotencyKey: string }) {
  const [state, action, pending] = useActionState(distributeManualAgentAction, {} as ActionState);
  return <FormModal trigger="New distribution" title="Manual distribution"><form action={action} className="rounded-lg border bg-white p-3"><input type="hidden" name="idempotencyKey" value={state.data?.idempotencyKey || idempotencyKey} /><div className="grid gap-2 sm:grid-cols-2"><label className="text-xs font-semibold sm:col-span-2">Agent<select name="agentId" className="mt-1 h-9 w-full rounded-md border bg-white px-2" required><option value="">Select agent</option>{agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.name} ({agent.companies})</option>)}</select></label><label className="text-xs font-semibold">Signed amount<Input name="amount" className="mt-1" type="number" step="0.00000001" required /></label><label className="text-xs font-semibold">Date<Input name="entryDate" className="mt-1" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required /></label><label className="text-xs font-semibold sm:col-span-2">Remarks<Input name="remarks" className="mt-1" maxLength={500} /></label></div>{state.message ? <p className={`mt-2 text-xs ${state.status === "error" ? "text-[#b42318]" : "text-[#16794b]"}`}>{state.message}</p> : null}<div className="mt-3 flex justify-end"><Button type="submit" disabled={pending}>{pending ? "Posting" : "Distribute"}</Button></div></form></FormModal>;
}
