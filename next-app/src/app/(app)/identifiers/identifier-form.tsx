"use client";

import { useModalAction } from "@/components/ui/use-modal-action";
import { useState } from "react";
import { LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { FormFooter } from "@/components/ui/form-footer";
import { modalField, modalLabel } from "@/components/ui/form-styles";
import type { ActionState } from "@/lib/actions/types";
import { createIdentifierAction } from "./actions";
import { emptyAgentRow, IdentifierAgentRows, splitTotal, type AgentSplitRow } from "./identifier-agent-rows";
import { SegmentedToggle } from "@/components/ui/toggle";

interface SiteOption { id: string; name: string }
interface CompanyOption { id: string; name: string; agents: { id: string; name: string }[] }

export function IdentifierForm({ sites, companies }: { sites: SiteOption[]; companies: CompanyOption[] }) {
  const [state, action, pending] = useModalAction(createIdentifierAction, {} as ActionState);
  const [siteId, setSiteId] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [agentRows, setAgentRows] = useState<AgentSplitRow[]>([emptyAgentRow()]);
  const company = companies.find((option) => option.id === companyId);
  const agentsOk = splitTotal(agentRows);
  return (
    <form action={action} className="text-xs">
      <div className="grid grid-cols-2" style={{ columnGap: 16, rowGap: 8 }}>
        <label className={modalLabel}>ID name<Input name="value" className={modalField} required /></label>
        <label className={modalLabel}>Site<Select name="siteId" className={modalField} value={siteId} required onChange={(event) => setSiteId(event.target.value)}><option value="">None</option>{sites.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}</Select></label>
        <label className={modalLabel}>Company<Select name="companyId" className={modalField} value={companyId} onChange={(event) => { setCompanyId(event.target.value); setAgentRows([emptyAgentRow()]); }}><option value="">None</option>{companies.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}</Select></label>
        <IdentifierAgentRows agents={company?.agents ?? []} rows={agentRows} onChange={setAgentRows} />
        <label className={modalLabel}>Type<div className="mt-0.5"><SegmentedToggle name="type" label="ID type" size="xs" className="w-fit" options={[{ value: "AGENT", label: "Agent" }, { value: "SUB_AGENT", label: "Sub Agent" }]} /></div></label>
        <label className={modalLabel}>Agent percentage<Input name="percentageRate" className={modalField} type="number" min="0" max="100" step="0.0001" required={agentsOk.hasAgents} /></label>
      </div>
      {state.message ? <p className={`mt-2 text-xs ${state.status === "error" ? "text-[#b42318]" : "text-[#16794b]"}`}>{state.message}</p> : null}
      <FormFooter className="!mt-2"><Button type="submit" disabled={pending || !agentsOk.complete}>{pending ? <LoaderCircle className="size-4 animate-spin" /> : null}{pending ? "Saving" : "Create ID"}</Button></FormFooter>
    </form>
  );
}
