"use client";

import { useActionState } from "react";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ActionState } from "@/lib/actions/types";
import { updateLedgerEntryAction } from "../../actions";

export function EditTransferForm({ entry }: { entry: { id: string; companyId: string; coins: string; rate: string; entryDate: string; remarks: string } }) {
  const [state, action, pending] = useActionState(updateLedgerEntryAction, {} as ActionState);
  return <form action={action} className="rounded-lg border bg-white p-3"><input type="hidden" name="entryId" value={entry.id} /><input type="hidden" name="companyId" value={entry.companyId} /><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4"><label className="text-xs font-semibold text-[#3b4d63]">Coins<Input name="coins" className="mt-1" type="number" min="0.00000001" step="0.00000001" defaultValue={entry.coins} required /></label><label className="text-xs font-semibold text-[#3b4d63]">Rate<Input name="rate" className="mt-1" type="number" min="0" step="0.00000001" defaultValue={entry.rate} required /></label><label className="text-xs font-semibold text-[#3b4d63]">Date<Input name="entryDate" className="mt-1" type="date" defaultValue={entry.entryDate} required /></label><label className="text-xs font-semibold text-[#3b4d63]">Remarks<Input name="remarks" className="mt-1" defaultValue={entry.remarks} maxLength={500} /></label></div>{state.message ? <p className={`mt-2 text-xs ${state.status === "error" ? "text-[#b42318]" : "text-[#16794b]"}`}>{state.message}</p> : null}<div className="mt-3 flex justify-end"><Button type="submit" disabled={pending}>{pending ? <LoaderCircle className="size-4 animate-spin" /> : null}{pending ? "Saving" : "Save and recalculate"}</Button></div></form>;
}
