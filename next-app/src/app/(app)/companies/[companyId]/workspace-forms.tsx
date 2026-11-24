"use client";

import { useActionState } from "react";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormModal } from "@/components/ui/form-modal";
import { Input, Select } from "@/components/ui/input";
import { FormFooter } from "@/components/ui/form-footer";
import type { ActionState } from "@/lib/actions/types";
import { createManualUplineEntryAction, createShareholderAction, createUplineAction, createUplineGroupAction, distributeProfitAction, updateShareholderAction, updateUplineAction } from "./actions";
import { DateRangePicker, istToday } from "@/components/ui/date-range-picker";

function Feedback({ state }: { state: ActionState }) { return state.message ? <p className={`mt-2 text-xs ${state.status === "error" ? "text-[#b42318]" : "text-[#16794b]"}`}>{state.message}</p> : null; }

export function UplineForm({ companyId }: { companyId: string }) {
  const [state, action, pending] = useActionState(createUplineAction, {} as ActionState);
  return <FormModal trigger="Add upline" title="Add upline"><form action={action} className="rounded-lg border bg-white p-3"><input type="hidden" name="companyId" value={companyId} /><div className="grid gap-2 sm:grid-cols-[1fr_140px]"><Input name="name" placeholder="Upline name" required /><Input name="percentageRate" type="number" min="0" max="100" step="0.0001" placeholder="Rate %" required /></div><Feedback state={state} /><FormFooter><Button type="submit" disabled={pending}>{pending ? <LoaderCircle className="size-4 animate-spin" /> : null}Add</Button></FormFooter></form></FormModal>;
}

export function UplineGroupFormBody({ companyId, uplines }: { companyId: string; uplines: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState(createUplineGroupAction, {} as ActionState);
  return <form action={action} className="rounded-lg border bg-white p-3"><input type="hidden" name="companyId" value={companyId} /><Input name="name" placeholder="Group name" required /><div className="mt-2 grid max-h-64 gap-1 overflow-y-auto sm:grid-cols-2">{uplines.map((upline) => <label key={upline.id} className="grid grid-cols-[auto_1fr_90px] items-center gap-2 rounded border px-2 py-1 text-xs"><input type="checkbox" name="uplineIds" value={upline.id} /><span>{upline.name}</span><Input name={`percentage-${upline.id}`} type="number" min="0.0001" max="100" step="0.0001" placeholder="%" /></label>)}</div><p className="mt-1 text-[11px] text-[#647386]">The selected member total cannot exceed 100 percent.</p><Feedback state={state} /><FormFooter><Button type="submit" disabled={pending}>{pending ? <LoaderCircle className="size-4 animate-spin" /> : null}Create</Button></FormFooter></form>;
}

export function UplineGroupForm({ companyId, uplines }: { companyId: string; uplines: { id: string; name: string }[] }) {
  return <FormModal trigger="Add group" title="Create upline group" size="xl"><UplineGroupFormBody companyId={companyId} uplines={uplines} /></FormModal>;
}

export function ManualUplineEntryForm({ companyId, uplines }: { companyId: string; uplines: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState(createManualUplineEntryAction, {} as ActionState);
  return <FormModal trigger="Manual entry" title="Manual upline entry"><form action={action} className="rounded-lg border bg-white p-3"><input type="hidden" name="companyId" value={companyId} /><div className="grid gap-2 sm:grid-cols-2"><Select name="uplineId"  required><option value="">Select upline</option>{uplines.map((upline) => <option key={upline.id} value={upline.id}>{upline.name}</option>)}</Select><Input name="amount" type="number" step="0.00000001" placeholder="Amount" required /><Input name="entryDate" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required /><Input name="remarks" placeholder="Remarks" /></div><Feedback state={state} /><FormFooter><Button type="submit" disabled={pending}>{pending ? <LoaderCircle className="size-4 animate-spin" /> : null}Post</Button></FormFooter></form></FormModal>;
}

export function ShareholderForm({ companyId }: { companyId: string }) {
  const [state, action, pending] = useActionState(createShareholderAction, {} as ActionState);
  return <FormModal trigger="Add shareholder" title="Add shareholder"><form action={action} className="rounded-lg border bg-white p-3"><input type="hidden" name="companyId" value={companyId} /><div className="grid gap-2 sm:grid-cols-2"><Input name="name" placeholder="Name" required /><Input name="percentage" type="number" min="0.0001" max="100" step="0.0001" placeholder="Share %" required /><Input name="phone" placeholder="Phone" /><Input name="email" type="email" placeholder="Email" /></div><Feedback state={state} /><FormFooter><Button type="submit" disabled={pending}>{pending ? <LoaderCircle className="size-4 animate-spin" /> : null}Add</Button></FormFooter></form></FormModal>;
}

export function ProfitDistributionForm({ companyId, initialIdempotencyKey }: { companyId: string; initialIdempotencyKey: string }) {
  const [state, action, pending] = useActionState(distributeProfitAction, {} as ActionState);
  const today = istToday();
  return <FormModal trigger="Distribute profit" title="Distribute settlement profit"><form action={action} className="rounded-lg border bg-white p-3"><input type="hidden" name="companyId" value={companyId} /><input type="hidden" name="idempotencyKey" value={state.data?.idempotencyKey ?? initialIdempotencyKey} /><DateRangePicker fromName="periodStart" toName="periodEnd" defaultFrom={`${today.slice(0, 8)}01`} defaultTo={today} required /><p className="mt-2 text-[11px] text-[#647386]">Uses posted settlements only. Manual agent and upline entries are excluded.</p><Feedback state={state} /><FormFooter><Button type="submit" disabled={pending}>{pending ? <LoaderCircle className="size-4 animate-spin" /> : null}Distribute</Button></FormFooter></form></FormModal>;
}

export function EditUplineForm({ upline }: { upline: { id: string; name: string; percentageRate: string } }) {
  const [state, action, pending] = useActionState(updateUplineAction, {} as ActionState);
  return <form action={action} className="rounded-lg border bg-white p-3"><input type="hidden" name="uplineId" value={upline.id} /><div className="grid gap-2 sm:grid-cols-[1fr_140px]"><Input name="name" defaultValue={upline.name} required /><Input name="percentageRate" type="number" min="0" max="100" step="0.0001" defaultValue={upline.percentageRate} required /></div><Feedback state={state} /><FormFooter><Button type="submit" disabled={pending}>{pending ? <LoaderCircle className="size-4 animate-spin" /> : null}Save changes</Button></FormFooter></form>;
}

export function EditShareholderForm({ shareholder }: { shareholder: { id: string; name: string; percentage: string; phone: string | null; email: string | null } }) {
  const [state, action, pending] = useActionState(updateShareholderAction, {} as ActionState);
  return <form action={action} className="rounded-lg border bg-white p-3"><input type="hidden" name="shareholderId" value={shareholder.id} /><div className="grid gap-2 sm:grid-cols-2"><Input name="name" defaultValue={shareholder.name} required /><Input name="percentage" type="number" min="0.0001" max="100" step="0.0001" defaultValue={shareholder.percentage} required /><Input name="phone" defaultValue={shareholder.phone ?? ""} placeholder="Phone" /><Input name="email" type="email" defaultValue={shareholder.email ?? ""} placeholder="Email" /></div><Feedback state={state} /><FormFooter><Button type="submit" disabled={pending}>{pending ? <LoaderCircle className="size-4 animate-spin" /> : null}Save changes</Button></FormFooter></form>;
}
