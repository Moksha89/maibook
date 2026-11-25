"use client";

import { useModalAction } from "@/components/ui/use-modal-action";
import { Button } from "@/components/ui/button";
import { FormModal } from "@/components/ui/form-modal";
import { Select } from "@/components/ui/input";
import { FormFooter } from "@/components/ui/form-footer";
import { ActionButton } from "@/components/ui/action-button";
import type { ActionState } from "@/lib/actions/types";
import { assignIdentifierAgentAction, unassignIdentifierAgentAction } from "../actions";

const label = "text-[11px] font-semibold text-[#3b4d63]";
const field = "mt-0.5 !text-xs [&_select]:!h-7 [&_select]:!text-xs";

function AssignAgentBody({ identifierId, agents }: { identifierId: string; agents: { id: string; name: string }[] }) {
  const [state, action, pending] = useModalAction(assignIdentifierAgentAction, {} as ActionState);
  return (
    <form action={action} className="text-xs">
      <input type="hidden" name="identifierId" value={identifierId} />
      <label className={label}>Agent
        <Select name="agentId" className={field} required defaultValue="">
          <option value="" disabled>{agents.length ? "Select agent" : "No agents on this company"}</option>
          {agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.name}</option>)}
        </Select>
      </label>
      {state.message ? <p className={`mt-1.5 text-[11px] ${state.status === "error" ? "text-[#b42318]" : "text-[#16794b]"}`}>{state.message}</p> : null}
      <FormFooter className="!mt-2"><Button type="submit" size="sm" disabled={pending || !agents.length}>{pending ? "Saving" : "Assign"}</Button></FormFooter>
    </form>
  );
}

export function AssignAgentButton({ identifierId, identifierValue, agents }: { identifierId: string; identifierValue: string; agents: { id: string; name: string }[] }) {
  return (
    <FormModal compact size="sm" trigger="Assign agent" title={`Assign agent to ${identifierValue}`} triggerClassName="!size-7 [&_svg]:!size-3.5">
      <AssignAgentBody identifierId={identifierId} agents={agents} />
    </FormModal>
  );
}

export function UnassignAgentButton({ identifierId, identifierValue, agentName }: { identifierId: string; identifierValue: string; agentName: string }) {
  return <ActionButton action={unassignIdentifierAgentAction} fields={{ identifierId }} label="Unassign agent" confirmMessage={`Unassign ${agentName} from ${identifierValue}? Old settlements stay with ${agentName}.`} danger />;
}
