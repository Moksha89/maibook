"use client";

import { useState } from "react";
import { useModalAction } from "@/components/ui/use-modal-action";
import { Button } from "@/components/ui/button";
import { FormModal } from "@/components/ui/form-modal";
import { Input, Select } from "@/components/ui/input";
import { FormFooter } from "@/components/ui/form-footer";
import type { ActionState } from "@/lib/actions/types";
import { updateOwnerEntryAction } from "../actions";

const label = "text-[11px] font-semibold text-[#3b4d63]";
const field = "mt-0.5 !text-xs [&_input]:!h-7 [&_select]:!h-7 [&_select]:!text-xs";

export function EditOwnerEntryForm({ entry, companies }: {
  entry: { id: string; ownerId: string; companyId: string; entryDate: string; entryTime: string; direction: "PAID" | "RECEIVED"; amount: string; remarks: string };
  companies: { id: string; name: string }[];
}) {
  const [state, action, pending] = useModalAction(updateOwnerEntryAction, {} as ActionState);
  const [direction, setDirection] = useState<"PAID" | "RECEIVED">(entry.direction);
  return (
    <FormModal compact size="sm" trigger="Edit" title="Edit entry" triggerClassName="!size-7 [&_svg]:!size-3.5">
      <form action={action} className="text-xs">
        <input type="hidden" name="entryId" value={entry.id} />
        <input type="hidden" name="ownerId" value={entry.ownerId} />
        <input type="hidden" name="direction" value={direction} />
        <div className="grid grid-cols-2 gap-2">
          <label className={label}>Date<Input name="entryDate" type="date" className={field} required defaultValue={entry.entryDate} /></label>
          <label className={label}>Time<Input name="entryTime" type="time" className={field} required defaultValue={entry.entryTime} /></label>
        </div>
        <div className="mt-2 flex h-8 overflow-hidden rounded-full border border-[#d5dbe6] w-fit">
          <button type="button" aria-pressed={direction === "PAID"} onClick={() => setDirection("PAID")} className={`px-3 text-[11px] font-semibold ${direction === "PAID" ? "bg-[#f44336] text-white" : "bg-white text-[#647386]"}`}>Paid to partner</button>
          <button type="button" aria-pressed={direction === "RECEIVED"} onClick={() => setDirection("RECEIVED")} className={`px-3 text-[11px] font-semibold ${direction === "RECEIVED" ? "bg-[#16a34a] text-white" : "bg-white text-[#647386]"}`}>Received from partner</button>
        </div>
        <label className={`${label} mt-2 block`}>Company
          <Select name="companyId" className={field} required defaultValue={entry.companyId}>
            {companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}
          </Select>
        </label>
        <label className={`${label} mt-2 block`}>Amount<Input name="amount" type="number" min={1} step="1" className={field} required defaultValue={entry.amount} /></label>
        <label className={`${label} mt-2 block`}>Remarks<Input name="remarks" uppercase className={field} defaultValue={entry.remarks} /></label>
        {state.message ? <p className={`mt-1.5 text-[11px] ${state.status === "error" ? "text-[#b42318]" : "text-[#16794b]"}`}>{state.message}</p> : null}
        <FormFooter className="!mt-2"><Button type="submit" size="sm" disabled={pending}>{pending ? "Saving" : "Save"}</Button></FormFooter>
      </form>
    </FormModal>
  );
}
