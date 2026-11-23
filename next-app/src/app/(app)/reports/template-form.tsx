"use client";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { FormModal } from "@/components/ui/form-modal";
import { Input } from "@/components/ui/input";
import type { ActionState } from "@/lib/actions/types";
import { createReportTemplateAction } from "./actions";

export function ReportTemplateForm() {
  const [state, action, pending] = useActionState(createReportTemplateAction, {} as ActionState);
  return <FormModal trigger="Add template" title="Create report template"><form action={action} className="rounded-lg border bg-white p-3"><h2 className="mb-2 text-sm font-bold">Report template</h2><div className="grid gap-2 sm:grid-cols-2"><Input name="name" placeholder="Template name" maxLength={100} required /><select name="type" className="h-9 rounded-md border bg-white px-2.5 text-sm"><option value="COMPANY_LEDGER">Company ledger</option><option value="AGENT_LEDGER">Agent ledger</option><option value="SETTLEMENT">Settlements</option><option value="PROFIT_DISTRIBUTION">Profit distribution</option></select><Input name="body" className="sm:col-span-2" placeholder="Header or message body. Use {{company}}, {{startDate}}, {{endDate}}." maxLength={5000} required /></div>{state.message ? <p className={`mt-2 text-xs ${state.status === "error" ? "text-[#b42318]" : "text-[#16794b]"}`}>{state.message}</p> : null}<div className="mt-3 flex justify-end"><Button type="submit" disabled={pending}>{pending ? "Saving" : "Save template"}</Button></div></form></FormModal>;
}
