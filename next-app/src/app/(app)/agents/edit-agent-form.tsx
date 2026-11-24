"use client";

import { useModalAction } from "@/components/ui/use-modal-action";

import { LoaderCircle } from "lucide-react";

import { ActionButton } from "@/components/ui/action-button";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { FormFooter } from "@/components/ui/form-footer";
import type { ActionState } from "@/lib/actions/types";
import { assignAgentAction, removeAgentAssignmentAction, updateAgentAction } from "./actions";

export interface EditableAgent { id: string; name: string; phone: string | null; email: string | null; assignments: { companyId: string; companyName: string; balance: string }[] }

export function EditAgentForm({ agent, assignableCompanies, canAssign }: { agent: EditableAgent; assignableCompanies: { id: string; name: string }[]; canAssign: boolean }) {
  const [state, action, pending] = useModalAction(updateAgentAction, {} as ActionState);
  const [assignState, assignAction, assigning] = useModalAction(assignAgentAction, {} as ActionState);
  return (
    <div className="space-y-3">
      <form action={action} className="rounded-lg border bg-white p-3">
        <input type="hidden" name="agentId" value={agent.id} />
        <div className="grid gap-2 sm:grid-cols-3">
          <label className="text-xs font-bold text-[#0d1a2c]">Name<Input name="name" className="mt-1" defaultValue={agent.name} required /></label>
          <label className="text-xs font-bold text-[#0d1a2c]">Phone<Input name="phone" className="mt-1" inputMode="tel" defaultValue={agent.phone ?? ""} /></label>
          <label className="text-xs font-bold text-[#0d1a2c]">Email<Input name="email" className="mt-1" type="email" defaultValue={agent.email ?? ""} /></label>
        </div>
        {state.message ? <p className={`mt-2 text-xs ${state.status === "error" ? "text-[#b42318]" : "text-[#16794b]"}`}>{state.message}</p> : null}
        <FormFooter><Button type="submit" disabled={pending}>{pending ? <LoaderCircle className="size-4 animate-spin" /> : null}{pending ? "Saving" : "Save changes"}</Button></FormFooter>
      </form>
      <section className="rounded-lg border bg-white p-3">
        <h3 className="mb-2 text-xs font-bold">Company assignments</h3>
        <ul className="space-y-1.5 text-xs">
          {agent.assignments.map((assignment) => <li key={assignment.companyId} className="flex items-center justify-between gap-2"><span><span className="font-semibold">{assignment.companyName}</span> <span className="font-mono text-[#647386]">balance {assignment.balance}</span></span>{canAssign ? <ActionButton action={removeAgentAssignmentAction} fields={{ agentId: agent.id, companyId: assignment.companyId }} label="Remove" danger confirmMessage={`Remove ${agent.name} from ${assignment.companyName}?`} /> : null}</li>)}
          {!agent.assignments.length ? <li className="text-[#647386]">Not assigned to any company.</li> : null}
        </ul>
        {canAssign && assignableCompanies.length ? <form action={assignAction} className="mt-3 flex flex-wrap items-end gap-2 border-t pt-3"><input type="hidden" name="agentId" value={agent.id} /><label className="text-xs font-bold text-[#0d1a2c]">Add to company<Select name="companyId" className="mt-1 min-w-44" required>{assignableCompanies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</Select></label><label className="text-xs font-bold text-[#0d1a2c]">Opening balance<Input name="openingBalance" className="mt-1 w-36" type="number" step="0.00000001" defaultValue="0" required /></label><Button type="submit" variant="secondary" disabled={assigning}>{assigning ? "Adding" : "Assign"}</Button></form> : null}
        {assignState.message ? <p className={`mt-2 text-xs ${assignState.status === "error" ? "text-[#b42318]" : "text-[#16794b]"}`}>{assignState.message}</p> : null}
      </section>
    </div>
  );
}
