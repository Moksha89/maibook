"use client";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ActionState } from "@/lib/actions/types";
import { createReportTemplateAction } from "./actions";

export function ReportTemplateForm() {
  const [state, action, pending] = useActionState(createReportTemplateAction, {} as ActionState);
  return <form action={action} className="mt-3 rounded-lg border bg-white p-3"><h2 className="mb-2 text-sm font-bold">Report template</h2><div className="grid gap-2 md:grid-cols-[1fr_1fr_2fr_auto]"><Input name="name" placeholder="Template name" maxLength={100} required /><select name="type" className="h-9 rounded-md border bg-white px-2.5 text-sm"><option value="COMPANY_LEDGER">Company ledger</option><option value="AGENT_LEDGER">Agent ledger</option><option value="SETTLEMENT">Settlements</option><option value="PROFIT_DISTRIBUTION">Profit distribution</option></select><Input name="body" placeholder="Header or message body. Use {{company}}, {{startDate}}, {{endDate}}." maxLength={5000} required /><Button type="submit" disabled={pending}>{pending ? "Saving" : "Save template"}</Button></div>{state.message ? <p className={`mt-2 text-xs ${state.status === "error" ? "text-[#b42318]" : "text-[#16794b]"}`}>{state.message}</p> : null}</form>;
}
