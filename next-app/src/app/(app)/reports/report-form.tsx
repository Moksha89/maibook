"use client";

import { useModalAction } from "@/components/ui/use-modal-action";
import { useState } from "react";
import { FileBarChart, LoaderCircle } from "lucide-react";
import { Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormFooter } from "@/components/ui/form-footer";
import { FormModal } from "@/components/ui/form-modal";
import type { ActionState } from "@/lib/actions/types";
import { generateReportAction } from "./actions";
import { DateRangePicker, istToday } from "@/components/ui/date-range-picker";

interface CompanyOption { id: string; name: string; agents: { id: string; name: string }[] }
interface TemplateOption { id: string; name: string; type: string }

function ReportFormBody({ companies, templates }: { companies: CompanyOption[]; templates: TemplateOption[] }) {
  const [state, action, pending] = useModalAction(generateReportAction, {} as ActionState);
  const [companyId, setCompanyId] = useState(companies[0]?.id || "");
  const [type, setType] = useState("COMPANY_LEDGER");
  const company = companies.find((option) => option.id === companyId);
  const today = istToday();
  return <><form action={action} className="rounded-lg border bg-white p-3">
    <div className="mb-3 flex items-center gap-2"><FileBarChart className="size-4 text-[#a97819]" /><h2 className="text-sm font-bold">Generate report</h2></div>
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4"><Select name="companyId"  value={companyId} onChange={(event) => setCompanyId(event.target.value)}>{companies.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}</Select><Select name="type"  value={type} onChange={(event) => setType(event.target.value)}><option value="COMPANY_LEDGER">Company ledger</option><option value="AGENT_LEDGER">Agent ledger</option><option value="SETTLEMENT">Settlements</option><option value="PROFIT_DISTRIBUTION">Profit distribution</option><option value="UPLINE">Upline entries</option><option value="COMPANY_SUMMARY">Agent balance summary</option></Select><Select name="templateId" ><option value="">Default template</option>{templates.filter((template) => template.type === type).map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}</Select><Select name="agentId"  disabled={type !== "AGENT_LEDGER"} required={type === "AGENT_LEDGER"}><option value="">Select agent</option>{company?.agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.name}</option>)}</Select><DateRangePicker fromName="startDate" toName="endDate" defaultFrom={`${today.slice(0, 8)}01`} defaultTo={today} required className="sm:col-span-2" /><Select name="format" ><option value="PDF">PDF</option><option value="PNG">PNG image</option><option value="CSV">CSV</option><option value="TEXT">Text</option><option value="PRINT">Print view</option></Select></div>
    {state.message ? <div className={`mt-2 flex items-center justify-between gap-2 text-xs ${state.status === "error" ? "text-[#b42318]" : "text-[#16794b]"}`}><span>{state.message}</span>{state.data?.reportId ? <a className="font-semibold underline" href={`/api/reports/${state.data.reportId}/download`} target="_blank">Open report</a> : null}</div> : null}
    <FormFooter><Button type="submit" disabled={pending}>{pending ? <LoaderCircle className="size-4 animate-spin" /> : null}{pending ? "Generating" : "Generate"}</Button></FormFooter>
  </form></>;
}

export function ReportForm(props: Parameters<typeof ReportFormBody>[0]) {
  return <FormModal trigger="Generate report" title="Generate report" size="xl"><ReportFormBody {...props} /></FormModal>;
}
