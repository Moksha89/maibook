"use client";

import { useModalAction } from "@/components/ui/use-modal-action";

import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormFooter } from "@/components/ui/form-footer";
import type { ActionState } from "@/lib/actions/types";
import { updateLedgerEntryAction, updateManualAgentEntryAction } from "../../actions";

export function EditTransferForm({ entry }: { entry: { id: string; companyId: string; coins: string; rate: string; entryDate: string; remarks: string } }) {
  const [state, action, pending] = useModalAction(updateLedgerEntryAction, {} as ActionState);
  return <form action={action} className="rounded-lg border bg-white p-3"><input type="hidden" name="entryId" value={entry.id} /><input type="hidden" name="companyId" value={entry.companyId} /><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4"><label className="text-xs font-bold text-[#0d1a2c]">Coins<Input name="coins" className="mt-1" type="number" min="0.01" step="0.01" defaultValue={entry.coins} required /></label><label className="text-xs font-bold text-[#0d1a2c]">Rate<Input name="rate" className="mt-1" type="number" min="0" step="0.0001" defaultValue={entry.rate} required /></label><label className="text-xs font-bold text-[#0d1a2c]">Date<Input name="entryDate" className="mt-1" type="date" defaultValue={entry.entryDate} required /></label><label className="text-xs font-bold text-[#0d1a2c]">Remarks<Input name="remarks" className="mt-1" defaultValue={entry.remarks} maxLength={500} /></label></div>{state.message ? <p className={`mt-2 text-xs ${state.status === "error" ? "text-[#b42318]" : "text-[#16794b]"}`}>{state.message}</p> : null}<FormFooter><Button type="submit" disabled={pending}>{pending ? <LoaderCircle className="size-4 animate-spin" /> : null}{pending ? "Saving" : "Save and recalculate"}</Button></FormFooter></form>;
}

export function EditManualAgentForm({ entry }: { entry: { id: string; amount: string; entryDate: string; remarks: string } }) {
  const [state, action, pending] = useModalAction(updateManualAgentEntryAction, {} as ActionState);
  return <form action={action} className="rounded-lg border bg-white p-3"><input type="hidden" name="entryId" value={entry.id} /><div className="grid gap-2 sm:grid-cols-3"><label className="text-xs font-bold text-[#0d1a2c]">Signed amount<Input name="amount" className="mt-1" type="number" step="0.01" defaultValue={entry.amount} required /></label><label className="text-xs font-bold text-[#0d1a2c]">Date<Input name="entryDate" className="mt-1" type="date" defaultValue={entry.entryDate} required /></label><label className="text-xs font-bold text-[#0d1a2c]">Remarks<Input name="remarks" className="mt-1" defaultValue={entry.remarks} /></label></div>{state.message ? <p className={`mt-2 text-xs ${state.status === "error" ? "text-[#b42318]" : "text-[#16794b]"}`}>{state.message}</p> : null}<FormFooter><Button type="submit" disabled={pending}>{pending ? <LoaderCircle className="size-4 animate-spin" /> : null}Save changes</Button></FormFooter></form>;
}
