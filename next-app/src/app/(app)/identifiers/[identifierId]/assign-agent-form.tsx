"use client";

import { useState } from "react";
import { useModalAction } from "@/components/ui/use-modal-action";
import { Button } from "@/components/ui/button";
import { FormModal } from "@/components/ui/form-modal";
import { FormFooter } from "@/components/ui/form-footer";
import { ActionButton } from "@/components/ui/action-button";
import { modalLabel } from "@/components/ui/form-styles";
import type { ActionState } from "@/lib/actions/types";
import { assignIdentifierAgentAction, unassignIdentifierAgentAction } from "../actions";
import { emptyAgentRow, identifierTypeOptions, IdentifierAgentRows, rowsMatchingAgents, splitTotal, type AgentSplitRow } from "../identifier-agent-rows";
import { SegmentedToggle } from "@/components/ui/toggle";

function AssignAgentBody({ identifierId, type: initialType, agents, current }: { identifierId: string; type: "AGENT" | "SUB_AGENT"; agents: { id: string; name: string; type?: "AGENT" | "SUB_AGENT" }[]; current: { id: string; splitPercentage: number }[] }) {
  const [state, action, pending] = useModalAction(assignIdentifierAgentAction, {} as ActionState);
  const [type, setType] = useState<"AGENT" | "SUB_AGENT">(initialType);
  const [agentRows, setAgentRows] = useState<AgentSplitRow[]>(current.length ? current.map((agent) => ({ agentId: agent.id, split: String(agent.splitPercentage) })) : [emptyAgentRow()]);
  const agentsOk = splitTotal(agentRows);
  const currentIds = new Set(agentRows.map((row) => row.agentId).filter(Boolean));
  const agentsForType = agents.filter((agent) => (agent.type ?? "AGENT") === type || currentIds.has(agent.id));
  function changeType(next: string) {
    const value = next === "SUB_AGENT" ? "SUB_AGENT" : "AGENT";
    setType(value);
    setAgentRows(rowsMatchingAgents(agentRows, agents.filter((agent) => (agent.type ?? "AGENT") === value)));
  }
  return (
    <form action={action} className="text-xs">
      <input type="hidden" name="identifierId" value={identifierId} />
      <div className="grid grid-cols-1" style={{ rowGap: 8 }}>
        <label className={modalLabel}>Type<div className="mt-0.5"><SegmentedToggle name="type" label="ID type" size="xs" className="w-fit" value={type} onChange={changeType} submitOnChange={false} options={[...identifierTypeOptions]} /></div></label>
        <IdentifierAgentRows agents={agentsForType} rows={agentRows} onChange={setAgentRows} />
      </div>
      {state.message ? <p className={`mt-1.5 text-[11px] ${state.status === "error" ? "text-[#b42318]" : "text-[#16794b]"}`}>{state.message}</p> : null}
      <FormFooter className="!mt-2"><Button type="submit" size="sm" disabled={pending || !agentsOk.complete || !agentsOk.hasAgents}>{pending ? "Saving" : "Save"}</Button></FormFooter>
    </form>
  );
}

export function AssignAgentButton({ identifierId, identifierValue, type, agents, current = [] }: { identifierId: string; identifierValue: string; type: "AGENT" | "SUB_AGENT"; agents: { id: string; name: string; type?: "AGENT" | "SUB_AGENT" }[]; current?: { id: string; splitPercentage: number }[] }) {
  return (
    <FormModal compact size="md" trigger="Assign agent" title={`Assign agents to ${identifierValue}`} triggerClassName="!size-7 [&_svg]:!size-3.5">
      <AssignAgentBody identifierId={identifierId} type={type} agents={agents} current={current} />
    </FormModal>
  );
}

export function UnassignAgentButton({ identifierId, identifierValue, agentName }: { identifierId: string; identifierValue: string; agentName: string }) {
  return <ActionButton action={unassignIdentifierAgentAction} fields={{ identifierId }} label="Unassign agent" confirmMessage={`Unassign ${agentName} from ${identifierValue}? Old settlements stay with the previous agents.`} danger />;
}
