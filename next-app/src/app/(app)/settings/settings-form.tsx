"use client";

import { useModalAction } from "@/components/ui/use-modal-action";

import { LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ActionState } from "@/lib/actions/types";
import { updateSettingsAction } from "./actions";
import { Switch } from "@/components/ui/toggle";

interface SettingsValues { title: string; legalName: string; supportEmail: string; supportPhone: string; reportFooter: string; emailEnabled: boolean; smsEnabled: boolean; whatsappEnabled: boolean }

export function SettingsForm({ values }: { values: SettingsValues }) {
  const [state, action, pending] = useModalAction(updateSettingsAction, {} as ActionState);
  return <form action={action} className="space-y-3"><section className="rounded-lg border bg-white p-3"><h2 className="mb-3 text-sm font-bold">Brand and contact</h2><div className="grid gap-2 sm:grid-cols-2"><label className="text-xs font-bold text-[#0d1a2c]">Application title<Input name="title" className="mt-1" defaultValue={values.title} required /></label><label className="text-xs font-bold text-[#0d1a2c]">Legal name<Input name="legalName" className="mt-1" defaultValue={values.legalName} /></label><label className="text-xs font-bold text-[#0d1a2c]">Support email<Input name="supportEmail" className="mt-1" type="email" defaultValue={values.supportEmail} /></label><label className="text-xs font-bold text-[#0d1a2c]">Support phone<Input name="supportPhone" className="mt-1" defaultValue={values.supportPhone} /></label><label className="text-xs font-bold text-[#0d1a2c] sm:col-span-2">Report footer<Input name="reportFooter" className="mt-1" defaultValue={values.reportFooter} /></label></div></section><section className="rounded-lg border bg-white p-3"><h2 className="mb-3 text-sm font-bold">Provider switches</h2><div className="grid gap-2 sm:grid-cols-3">{[["emailEnabled", "Email", values.emailEnabled], ["smsEnabled", "SMS OTP", values.smsEnabled], ["whatsappEnabled", "WhatsApp", values.whatsappEnabled]].map(([name, label, checked]) => <div key={String(name)} className="flex items-center justify-between rounded-md border px-3 py-2 text-xs font-semibold"><span>{String(label)}</span><Switch name={String(name)} defaultChecked={Boolean(checked)} aria-label={String(label)} /></div>)}</div><p className="mt-2 text-[11px] text-[#647386]">A provider also requires its environment credentials. No secret is stored in this form.</p></section>{state.message ? <p className={`text-xs ${state.status === "error" ? "text-[#b42318]" : "text-[#16794b]"}`}>{state.message}</p> : null}<div className="flex justify-end"><Button type="submit" disabled={pending}>{pending ? <LoaderCircle className="size-4 animate-spin" /> : null}{pending ? "Saving" : "Save settings"}</Button></div></form>;
}
