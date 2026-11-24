"use client";

import { useModalAction } from "@/components/ui/use-modal-action";
import { Button } from "@/components/ui/button";
import { FormModal } from "@/components/ui/form-modal";
import { Input, Select } from "@/components/ui/input";
import { FormFooter } from "@/components/ui/form-footer";
import type { ActionState } from "@/lib/actions/types";
import { createReportTemplateAction } from "./actions";

function ReportTemplateFormBody() {
  const [state, action, pending] = useModalAction(createReportTemplateAction, {} as ActionState);
  return <><form action={action} className="rounded-lg border bg-white p-3"><h2 className="mb-2 text-sm font-bold">Report template</h2><div className="grid gap-2 sm:grid-cols-2"><Input name="name" placeholder="Template name" maxLength={100} required /><Select name="type" ><option value="COMPANY_LEDGER">Company ledger</option><option value="AGENT_LEDGER">Agent ledger</option><option value="SETTLEMENT">Settlements</option><option value="PROFIT_DISTRIBUTION">Profit distribution</option><option value="UPLINE">Upline entries</option><option value="COMPANY_SUMMARY">Agent balance summary</option></Select><Input name="body" className="sm:col-span-2" placeholder="Header or message body. Use {{company}}, {{startDate}}, {{endDate}}." maxLength={5000} required /></div>{state.message ? <p className={`mt-2 text-xs ${state.status === "error" ? "text-[#b42318]" : "text-[#16794b]"}`}>{state.message}</p> : null}<FormFooter><Button type="submit" disabled={pending}>{pending ? "Saving" : "Save template"}</Button></FormFooter></form></>;
}

export function ReportTemplateForm() {
  return <FormModal trigger="Add template" title="Create report template"><ReportTemplateFormBody /></FormModal>;
}
