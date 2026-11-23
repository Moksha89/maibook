"use client";

import { useActionState } from "react";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormModal } from "@/components/ui/form-modal";
import { Input } from "@/components/ui/input";
import type { ActionState } from "@/lib/actions/types";
import { createManualUplineEntryAction, createShareholderAction, createUplineAction, createUplineGroupAction, distributeProfitAction } from "./actions";

function Feedback({ state }: { state: ActionState }) { return state.message ? <p className={`mt-2 text-xs ${state.status === "error" ? "text-[#b42318]" : "text-[#16794b]"}`}>{state.message}</p> : null; }

export function UplineForm({ companyId }: { companyId: string }) {
  const [state, action, pending] = useActionState(createUplineAction, {} as ActionState);
  return <FormModal trigger="Add upline" title="Add upline"><form action={action} className="rounded-lg border bg-white p-3"><input type="hidden" name="companyId" value={companyId} /><div className="grid gap-2 sm:grid-cols-[1fr_140px]"><Input name="name" placeholder="Upline name" required /><Input name="percentageRate" type="number" min="0" max="100" step="0.0001" placeholder="Rate %" required /></div><Feedback state={state} /><div className="mt-3 flex justify-end"><Button type="submit" disabled={pending}>{pending ? <LoaderCircle className="size-4 animate-spin" /> : null}Add</Button></div></form></FormModal>;
}

export function UplineGroupForm({ companyId, uplines }: { companyId: string; uplines: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState(createUplineGroupAction, {} as ActionState);
  return <FormModal trigger="Add group" title="Create upline group" size="xl"><form action={action} className="rounded-lg border bg-white p-3"><input type="hidden" name="companyId" value={companyId} /><Input name="name" placeholder="Group name" required /><div className="mt-2 grid max-h-64 gap-1 overflow-y-auto sm:grid-cols-2">{uplines.map((upline) => <label key={upline.id} className="grid grid-cols-[auto_1fr_90px] items-center gap-2 rounded border px-2 py-1 text-xs"><input type="checkbox" name="uplineIds" value={upline.id} /><span>{upline.name}</span><Input name={`percentage-${upline.id}`} type="number" min="0.0001" max="100" step="0.0001" placeholder="%" /></label>)}</div><p className="mt-1 text-[11px] text-[#647386]">The selected member total cannot exceed 100 percent.</p><Feedback state={state} /><div className="mt-3 flex justify-end"><Button type="submit" disabled={pending}>{pending ? <LoaderCircle className="size-4 animate-spin" /> : null}Create</Button></div></form></FormModal>;
}

export function ManualUplineEntryForm({ companyId, uplines }: { companyId: string; uplines: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState(createManualUplineEntryAction, {} as ActionState);
  return <FormModal trigger="Manual entry" title="Manual upline entry"><form action={action} className="rounded-lg border bg-white p-3"><input type="hidden" name="companyId" value={companyId} /><div className="grid gap-2 sm:grid-cols-2"><select name="uplineId" className="h-9 rounded-md border bg-white px-2.5 text-sm" required><option value="">Select upline</option>{uplines.map((upline) => <option key={upline.id} value={upline.id}>{upline.name}</option>)}</select><Input name="amount" type="number" step="0.00000001" placeholder="Amount" required /><Input name="entryDate" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required /><Input name="remarks" placeholder="Remarks" /></div><Feedback state={state} /><div className="mt-3 flex justify-end"><Button type="submit" disabled={pending}>{pending ? <LoaderCircle className="size-4 animate-spin" /> : null}Post</Button></div></form></FormModal>;
}

export function ShareholderForm({ companyId }: { companyId: string }) {
  const [state, action, pending] = useActionState(createShareholderAction, {} as ActionState);
  return <FormModal trigger="Add shareholder" title="Add shareholder"><form action={action} className="rounded-lg border bg-white p-3"><input type="hidden" name="companyId" value={companyId} /><div className="grid gap-2 sm:grid-cols-2"><Input name="name" placeholder="Name" required /><Input name="percentage" type="number" min="0.0001" max="100" step="0.0001" placeholder="Share %" required /><Input name="phone" placeholder="Phone" /><Input name="email" type="email" placeholder="Email" /></div><Feedback state={state} /><div className="mt-3 flex justify-end"><Button type="submit" disabled={pending}>{pending ? <LoaderCircle className="size-4 animate-spin" /> : null}Add</Button></div></form></FormModal>;
}

export function ProfitDistributionForm({ companyId, initialIdempotencyKey }: { companyId: string; initialIdempotencyKey: string }) {
  const [state, action, pending] = useActionState(distributeProfitAction, {} as ActionState);
  const firstDay = new Date(); firstDay.setDate(1);
  return <FormModal trigger="Distribute profit" title="Distribute settlement profit"><form action={action} className="rounded-lg border bg-white p-3"><input type="hidden" name="companyId" value={companyId} /><input type="hidden" name="idempotencyKey" value={state.data?.idempotencyKey ?? initialIdempotencyKey} /><div className="grid gap-2 sm:grid-cols-2"><Input name="periodStart" type="date" defaultValue={firstDay.toISOString().slice(0, 10)} required /><Input name="periodEnd" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required /></div><p className="mt-2 text-[11px] text-[#647386]">Uses posted settlements only. Manual agent and upline entries are excluded.</p><Feedback state={state} /><div className="mt-3 flex justify-end"><Button type="submit" disabled={pending}>{pending ? <LoaderCircle className="size-4 animate-spin" /> : null}Distribute</Button></div></form></FormModal>;
}
