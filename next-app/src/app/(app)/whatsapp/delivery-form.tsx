"use client";
import { useActionState } from "react";
import { LoaderCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormModal } from "@/components/ui/form-modal";
import { Input } from "@/components/ui/input";
import type { ActionState } from "@/lib/actions/types";
import { queueWhatsAppDeliveryAction } from "./actions";

export function DeliveryForm({ reports }: { reports: { id: string; label: string }[] }) {
  const [state, action, pending] = useActionState(queueWhatsAppDeliveryAction, {} as ActionState);
  return <FormModal trigger="Send report" title="Send WhatsApp report"><form action={action} className="rounded-lg border bg-white p-3"><div className="mb-3 flex items-center gap-2"><Send className="size-4 text-[#a97819]" /><h2 className="text-sm font-bold">Send report</h2></div><div className="grid gap-2 sm:grid-cols-2"><select name="reportId" className="h-9 rounded-md border bg-white px-2.5 text-sm sm:col-span-2" required><option value="">Select generated report</option>{reports.map((report) => <option key={report.id} value={report.id}>{report.label}</option>)}</select><Input name="recipient" placeholder="WhatsApp number" required /><select name="mode" className="h-9 rounded-md border bg-white px-2.5 text-sm"><option value="TEXT">Text</option><option value="IMAGE">PNG Image</option><option value="BOTH">Both</option></select></div>{state.message ? <p className={`mt-2 text-xs ${state.status === "error" ? "text-[#b42318]" : "text-[#16794b]"}`}>{state.message}</p> : null}<p className="mt-2 text-[11px] text-[#647386]">PDF remains a separate download and print action on the Reports page.</p><div className="mt-3 flex justify-end"><Button type="submit" disabled={pending}>{pending ? <LoaderCircle className="size-4 animate-spin" /> : null}Send</Button></div></form></FormModal>;
}
