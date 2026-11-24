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
import { SegmentedToggle } from "@/components/ui/toggle";

export function EditIdentifierForm({ identifier, agents = [], companies = [] }: { identifier: { id: string; value: string; type: "AGENT" | "SUB_AGENT"; percentageRate: string; agentId?: string | null; companyId?: string | null }; agents?: { id: string; name: string }[]; companies?: { id: string; name: string; agents: { id: string; name: string }[] }[] }) {
  const [state, action, pending] = useModalAction(updateIdentifierAction, {} as ActionState);
  const [companyId, setCompanyId] = useState("");
  const [agentId, setAgentId] = useState("");
  const agentChoices = identifier.companyId ? agents : companies.find((option) => option.id === companyId)?.agents ?? [];
  return (
    <form action={action} className="text-xs">
      <input type="hidden" name="identifierId" value={identifier.id} />
      <div className="grid grid-cols-2" style={{ columnGap: 16, rowGap: 8 }}>
        {!identifier.companyId ? <label className={modalLabel}>Company<Select name="companyId" className={modalField} value={companyId} onChange={(event) => { setCompanyId(event.target.value); setAgentId(""); }}><option value="">None</option>{companies.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}</Select></label> : null}
        {!identifier.agentId ? <label className={modalLabel}>Agent<Select key={companyId} name="agentId" className={modalField} defaultValue="" onChange={(event) => setAgentId(event.target.value)}><option value="">None</option>{agentChoices.map((agent) => <option key={agent.id} value={agent.id}>{agent.name}</option>)}</Select></label> : null}
        <label className={modalLabel}>ID name<Input name="value" className={modalField} defaultValue={identifier.value} required /></label>
        <label className={modalLabel}>Type<div className="mt-0.5"><SegmentedToggle name="type" label="ID type" size="xs" className="w-fit" defaultValue={identifier.type} options={[{ value: "AGENT", label: "Agent" }, { value: "SUB_AGENT", label: "Sub Agent" }]} /></div></label>
        <label className={modalLabel}>Agent percentage<Input name="percentageRate" className={modalField} type="number" min="0" max="100" step="0.0001" defaultValue={identifier.percentageRate} required={Boolean(identifier.agentId || agentId)} /></label>
      </div>
      
      {state.message ? <p className={`mt-2 text-xs ${state.status === "error" ? "text-[#b42318]" : "text-[#16794b]"}`}>{state.message}</p> : null}
      <FormFooter className="!mt-2"><Button type="submit" disabled={pending}>{pending ? <LoaderCircle className="size-4 animate-spin" /> : null}{pending ? "Saving" : "Save changes"}</Button></FormFooter>
    </form>
  );
}
