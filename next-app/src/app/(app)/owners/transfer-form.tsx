"use client";

import { useModalAction } from "@/components/ui/use-modal-action";
import { Button } from "@/components/ui/button";
import { FormModal } from "@/components/ui/form-modal";
import { Input, Select } from "@/components/ui/input";
import { FormFooter } from "@/components/ui/form-footer";
import type { ActionState } from "@/lib/actions/types";
import { createOwnerTransferAction, updateOwnerTransferAction } from "./actions";

const label = "text-[11px] font-semibold text-[#3b4d63]";
const field = "mt-0.5 !text-xs [&_input]:!h-7 [&_select]:!h-7 [&_select]:!text-xs";
const today = () => { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`; };
const nowTime = () => { const now = new Date(); return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`; };

type Partner = { id: string; name: string };

export function TransferForm({ partners, defaultFromId, entry }: {
  partners: Partner[];
  defaultFromId?: string;
  entry?: { id: string; fromOwnerId: string; toOwnerId: string; entryDate: string; entryTime: string; amount: string; remarks: string };
}) {
  const actionFn = entry ? updateOwnerTransferAction : createOwnerTransferAction;
  const [state, action, pending] = useModalAction(actionFn, {} as ActionState);
  const editing = Boolean(entry);
  return (
    <FormModal compact={editing} size="sm" trigger={editing ? "Edit" : "Internal transfer"} title={editing ? "Edit transfer" : "Internal transfer"} triggerClassName={editing ? "!size-7 [&_svg]:!size-3.5" : undefined}>
      <form action={action} className="text-xs">
        {entry ? <input type="hidden" name="entryId" value={entry.id} /> : null}
        <div className="grid grid-cols-2 gap-2">
          <label className={label}>From
            <Select name="fromOwnerId" className={field} required defaultValue={entry?.fromOwnerId ?? defaultFromId ?? ""}>
              <option value="" disabled>From</option>
              {partners.map((partner) => <option key={partner.id} value={partner.id}>{partner.name}</option>)}
            </Select>
          </label>
          <label className={label}>To
            <Select name="toOwnerId" className={field} required defaultValue={entry?.toOwnerId ?? ""}>
              <option value="" disabled>To</option>
              {partners.map((partner) => <option key={partner.id} value={partner.id}>{partner.name}</option>)}
            </Select>
          </label>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <label className={label}>Date<Input name="entryDate" type="date" className={field} required defaultValue={entry?.entryDate ?? today()} /></label>
          <label className={label}>Time<Input name="entryTime" type="time" className={field} required defaultValue={entry?.entryTime ?? nowTime()} /></label>
        </div>
        <label className={`${label} mt-2 block`}>Amount<Input name="amount" type="number" min={1} step="1" className={field} required defaultValue={entry?.amount} /></label>
        <label className={`${label} mt-2 block`}>Remarks<Input name="remarks" uppercase className={field} defaultValue={entry?.remarks} /></label>
        {state.message ? <p className={`mt-1.5 text-[11px] ${state.status === "error" ? "text-[#b42318]" : "text-[#16794b]"}`}>{state.message}</p> : null}
        <FormFooter className="!mt-2"><Button type="submit" size="sm" disabled={pending}>{pending ? "Saving" : "Save"}</Button></FormFooter>
      </form>
    </FormModal>
  );
}
