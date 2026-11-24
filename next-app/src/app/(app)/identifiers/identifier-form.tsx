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
import { SegmentedToggle } from "@/components/ui/toggle";

interface SiteOption { id: string; name: string; companyId: string | null }
interface CompanyOption { id: string; name: string; agents: { id: string; name: string }[] }

export function IdentifierForm({ sites, companies }: { sites: SiteOption[]; companies: CompanyOption[] }) {
  const [state, action, pending] = useModalAction(createIdentifierAction, {} as ActionState);
  const [siteId, setSiteId] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [agentId, setAgentId] = useState("");
  const company = companies.find((option) => option.id === companyId);
  return (
    <form action={action} className="text-xs">
      <div className="grid grid-cols-2" style={{ columnGap: 16, rowGap: 8 }}>
        <label className={modalLabel}>ID name<Input name="value" className={modalField} required /></label>
        <label className={modalLabel}>Site<Select name="siteId" className={modalField} value={siteId} required onChange={(event) => { setSiteId(event.target.value); setAgentId(""); setCompanyId(sites.find((option) => option.id === event.target.value)?.companyId ?? ""); }}><option value="">None</option>{sites.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}</Select></label>
        <label className={modalLabel}>Company<Select name="companyId" className={modalField} value={companyId} onChange={(event) => { setCompanyId(event.target.value); setAgentId(""); }}><option value="">None</option>{companies.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}</Select></label>
        <label className={modalLabel}>Agent<Select key={companyId} name="agentId" className={modalField} defaultValue="" onChange={(event) => setAgentId(event.target.value)}><option value="">None</option>{company?.agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.name}</option>)}</Select></label>
        <label className={modalLabel}>Type<div className="mt-0.5"><SegmentedToggle name="type" label="ID type" size="xs" className="w-fit" options={[{ value: "AGENT", label: "Agent" }, { value: "SUB_AGENT", label: "Sub Agent" }]} /></div></label>
        <label className={modalLabel}>Agent percentage<Input name="percentageRate" className={modalField} type="number" min="0" max="100" step="0.0001" required={Boolean(agentId)} /></label>
      </div>
      {state.message ? <p className={`mt-2 text-xs ${state.status === "error" ? "text-[#b42318]" : "text-[#16794b]"}`}>{state.message}</p> : null}
      <FormFooter className="!mt-2"><Button type="submit" disabled={pending}>{pending ? <LoaderCircle className="size-4 animate-spin" /> : null}{pending ? "Saving" : "Create ID"}</Button></FormFooter>
    </form>
  );
}
