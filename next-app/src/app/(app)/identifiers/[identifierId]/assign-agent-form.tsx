"use client";

import { useState } from "react";
import { useModalAction } from "@/components/ui/use-modal-action";
import { Button } from "@/components/ui/button";
import { FormModal } from "@/components/ui/form-modal";
import { FormFooter } from "@/components/ui/form-footer";
import { ActionButton } from "@/components/ui/action-button";
import type { ActionState } from "@/lib/actions/types";
import { assignIdentifierAgentAction, unassignIdentifierAgentAction } from "../actions";
import { emptyAgentRow, IdentifierAgentRows, splitTotal, type AgentSplitRow } from "../identifier-agent-rows";

function AssignAgentBody({ identifierId, agents, current }: { identifierId: string; agents: { id: string; name: string }[]; current: { id: string; splitPercentage: number }[] }) {
  const [state, action, pending] = useModalAction(assignIdentifierAgentAction, {} as ActionState);
  const [agentRows, setAgentRows] = useState<AgentSplitRow[]>(current.length ? current.map((agent) => ({ agentId: agent.id, split: String(agent.splitPercentage) })) : [emptyAgentRow()]);
  const agentsOk = splitTotal(agentRows);
  return (
    <form action={action} className="text-xs">
      <input type="hidden" name="identifierId" value={identifierId} />
      <div className="grid grid-cols-1">
        <IdentifierAgentRows agents={agents} rows={agentRows} onChange={setAgentRows} />
      </div>
      {state.message ? <p className={`mt-1.5 text-[11px] ${state.status === "error" ? "text-[#b42318]" : "text-[#16794b]"}`}>{state.message}</p> : null}
      <FormFooter className="!mt-2"><Button type="submit" size="sm" disabled={pending || !agentsOk.complete || !agentsOk.hasAgents}>{pending ? "Saving" : "Save"}</Button></FormFooter>
    </form>
  );
}

export function AssignAgentButton({ identifierId, identifierValue, agents, current = [] }: { identifierId: string; identifierValue: string; agents: { id: string; name: string }[]; current?: { id: string; splitPercentage: number }[] }) {
  return (
    <FormModal compact size="md" trigger="Assign agent" title={`Assign agents to ${identifierValue}`} triggerClassName="!size-7 [&_svg]:!size-3.5">
      <AssignAgentBody identifierId={identifierId} agents={agents} current={current} />
    </FormModal>
  );
}

export function UnassignAgentButton({ identifierId, identifierValue, agentName }: { identifierId: string; identifierValue: string; agentName: string }) {
  return <ActionButton action={unassignIdentifierAgentAction} fields={{ identifierId }} label="Unassign agent" confirmMessage={`Unassign ${agentName} from ${identifierValue}? Old settlements stay with the previous agents.`} danger />;
}
