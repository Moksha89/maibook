"use client";

import { useModalAction } from "@/components/ui/use-modal-action";
import { LoaderCircle, Send } from "lucide-react";
import { Select, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormFooter } from "@/components/ui/form-footer";
import { FormModal } from "@/components/ui/form-modal";
import type { ActionState } from "@/lib/actions/types";
import { queueWhatsAppDeliveryAction } from "./actions";
import { SegmentedToggle } from "@/components/ui/toggle";

function DeliveryFormBody({ reports }: { reports: { id: string; label: string }[] }) {
  const [state, action, pending] = useModalAction(queueWhatsAppDeliveryAction, {} as ActionState);
  return <><form action={action} className="rounded-lg border bg-white p-3"><div className="mb-3 flex items-center gap-2"><Send className="size-4 text-[#a97819]" /><h2 className="text-sm font-bold">Send report</h2></div><div className="grid gap-2 sm:grid-cols-2"><Select name="reportId" className="sm:col-span-2" required><option value="">Select generated report</option>{reports.map((report) => <option key={report.id} value={report.id}>{report.label}</option>)}</Select><Textarea name="recipient" rows={2} placeholder="WhatsApp numbers with country code, separated by commas or new lines" required /><SegmentedToggle name="mode" label="Delivery mode" size="md" options={[{ value: "TEXT", label: "Text" }, { value: "IMAGE", label: "PNG Image" }, { value: "BOTH", label: "Both" }]} /></div>{state.message ? <p className={`mt-2 text-xs ${state.status === "error" ? "text-[#b42318]" : "text-[#16794b]"}`}>{state.message}</p> : null}<p className="mt-2 text-[11px] text-[#647386]">PDF remains a separate download and print action on the Reports page.</p><FormFooter><Button type="submit" disabled={pending}>{pending ? <LoaderCircle className="size-4 animate-spin" /> : null}Send</Button></FormFooter></form></>;
}

export function DeliveryForm(props: Parameters<typeof DeliveryFormBody>[0]) {
  return <FormModal trigger="Send report" title="Send WhatsApp report"><DeliveryFormBody {...props} /></FormModal>;
}
