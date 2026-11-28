"use client";

import { useModalAction } from "@/components/ui/use-modal-action";
import { useState } from "react";
import { modalField, modalLabel } from "@/components/ui/form-styles";

import { LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { FormFooter } from "@/components/ui/form-footer";
import type { ActionState } from "@/lib/actions/types";
import { updateIdentifierAction } from "./actions";
import { emptyAgentRow, identifierTypeOptions, IdentifierAgentRows, rowsMatchingAgents, splitTotal, type AgentSplitRow } from "./identifier-agent-rows";
import { SegmentedToggle } from "@/components/ui/toggle";

export function EditIdentifierForm({ identifier, companies = [] }: { identifier: { id: string; value: string; type: "AGENT" | "SUB_AGENT"; percentageRate: string; companyId?: string | null; agents?: { id: string; splitPercentage: number }[] }; companies?: { id: string; name: string; agents: { id: string; name: string; type?: "AGENT" | "SUB_AGENT" }[] }[] }) {
  const [state, action, pending] = useModalAction(updateIdentifierAction, {} as ActionState);
  const [companyId, setCompanyId] = useState(identifier.companyId ?? "");
  const [type, setType] = useState<"AGENT" | "SUB_AGENT">(identifier.type);
  const initialRows: AgentSplitRow[] = identifier.agents?.length
    ? identifier.agents.map((agent) => ({ agentId: agent.id, split: String(agent.splitPercentage) }))
    : [emptyAgentRow()];
  const [agentRows, setAgentRows] = useState<AgentSplitRow[]>(initialRows);
  const assignedIds = new Set((identifier.agents ?? []).map((agent) => agent.id));
  const allAgents = companies.find((option) => option.id === companyId)?.agents ?? [];
  const agentChoices = allAgents.filter((agent) => (agent.type ?? "AGENT") === type || assignedIds.has(agent.id) && agentRows.some((row) => row.agentId === agent.id));
  const agentsOk = splitTotal(agentRows);
  function agentsFor(nextCompany: string, nextType: "AGENT" | "SUB_AGENT") {
    return (companies.find((option) => option.id === nextCompany)?.agents ?? []).filter((agent) => (agent.type ?? "AGENT") === nextType);
  }
  function changeCompany(next: string) {
    setCompanyId(next);
    setAgentRows(rowsMatchingAgents(agentRows, agentsFor(next, type)));
  }
  function changeType(next: string) {
    const value = next === "SUB_AGENT" ? "SUB_AGENT" : "AGENT";
    setType(value);
    setAgentRows(rowsMatchingAgents(agentRows, agentsFor(companyId, value)));
  }
  return (
    <form action={action} className="text-xs">
      <input type="hidden" name="identifierId" value={identifier.id} />
      <div className="grid grid-cols-2" style={{ columnGap: 16, rowGap: 8 }}>
        <label className={modalLabel}>ID name<Input name="value" className={modalField} defaultValue={identifier.value} required /></label>
        <span />
        <label className={modalLabel}>Company<Select name="companyId" className={modalField} value={companyId} onChange={(event) => changeCompany(event.target.value)}><option value="">None</option>{companies.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}</Select></label>
        <div className="flex items-end gap-2">
          <label className={`${modalLabel} min-w-0 flex-1`}>Type<div className="mt-0.5"><SegmentedToggle name="type" label="ID type" size="xs" className="w-fit" value={type} onChange={changeType} submitOnChange={false} options={[...identifierTypeOptions]} /></div></label>
          <label className={`${modalLabel} w-[4.75rem] shrink-0`}>ID %<Input name="percentageRate" icon={null} className={modalField} type="number" min="0" max="100" step="0.0001" defaultValue={identifier.percentageRate} required={agentsOk.hasAgents} /></label>
        </div>
        <IdentifierAgentRows agents={agentChoices} rows={agentRows} onChange={setAgentRows} />
      </div>
      {state.message ? <p className={`mt-2 text-xs ${state.status === "error" ? "text-[#b42318]" : "text-[#16794b]"}`}>{state.message}</p> : null}
      <FormFooter className="!mt-2"><Button type="submit" disabled={pending || !agentsOk.complete}>{pending ? <LoaderCircle className="size-4 animate-spin" /> : null}{pending ? "Saving" : "Save changes"}</Button></FormFooter>
    </form>
  );
}
